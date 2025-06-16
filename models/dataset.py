from odoo import models, fields, api, _
from odoo.exceptions import UserError
import base64
import csv
import re
from io import StringIO


class DataSet(models.Model):
    _name = 'dynamed.dataset'
    _description = 'DataSet pour importer des fichiers CSV'

    name = fields.Char(string='Nom du fichier', required=True)
    file = fields.Binary(string='Fichier CSV', required=True)
    file_name = fields.Char(string='Nom du fichier')

    def _split_values(self, text):
        """
        Fonction pour séparer les valeurs selon différents séparateurs
        RÈGLE IMPORTANTE: Ne pas séparer les virgules/slashes à l'intérieur des parenthèses
        """
        if not text:
            return []

        # Fonction pour protéger le contenu entre parenthèses
        def protect_parentheses_content(match):
            content = match.group(1)
            # Remplacer temporairement les séparateurs dans les parenthèses
            content = content.replace(',', '§COMMA§')
            content = content.replace('/', '§SLASH§')
            content = content.replace('-', '§DASH§')
            return f"({content})"

        # Protéger le contenu entre parenthèses
        protected_text = re.sub(r'\(([^)]+)\)', protect_parentheses_content, text.strip())
        
        # Normaliser les séparateurs (remplacer les tirets par des virgules)
        normalized_text = re.sub(r'(\s*-\s*|\s*,\s*|\s*/\s*)', '|', protected_text)
        
        # Séparer par le pipe
        values = [v.strip() for v in normalized_text.split('|') if v.strip()]
        
        # Restaurer le contenu protégé
        restored_values = []
        for value in values:
            restored_value = value.replace('§COMMA§', ',').replace('§SLASH§', '/').replace('§DASH§', '-')
            restored_values.append(restored_value)
        
        return restored_values

    def import_molecules_data(self):
        """Méthode principale pour l'importation des molécules"""
        self.ensure_one()

        if not self.file:
            raise UserError(_("Aucun fichier attaché"))

        try:
            file_content = base64.b64decode(self.file).decode('utf-8')
            csv_file = StringIO(file_content)
            reader = csv.DictReader(csv_file)

            models = {
                'molecule': self.env['dynamed.molecule'],
                'allergies': self.env['dynamed.allergies'],
                'antecedents': self.env['dynamed.antecedents_medicaux'],
                'age': self.env['dynamed.age.category'],
                'indications': self.env['dynamed.indications'],
                'classe_medicale': self.env['dynamed.classe.medicale'],
                'precaution': self.env['dynamed.precaution']
            }

            imported_molecules_count = 0
            processed_molecule_names = set()  # Pour éviter les doublons

            for row in reader:
                molecule_name_field = row.get('Nom de la molécule', '').strip()
                if not molecule_name_field:
                    continue

                # Vérifier si c'est vraiment un nom de molécule et non une indication/précaution
                if self._is_valid_molecule_name(molecule_name_field):
                    # Éviter les doublons
                    if molecule_name_field in processed_molecule_names:
                        continue
                    
                    processed_molecule_names.add(molecule_name_field)

                    # Gestion de la molécule de base
                    molecule = models['molecule'].search([('name', '=', molecule_name_field)], limit=1)

                    vals = {
                        'name': molecule_name_field,
                        'grossesse': row.get('Grossesse', '').strip().upper() == 'TRUE',
                        'allaitement': row.get('Allaitement', '').strip().upper() == 'TRUE',
                        'effet_majeurs': row.get('Effets secondaires majeurs', '').strip(),
                    }

                    if not molecule:
                        molecule = models['molecule'].create(vals)
                        imported_molecules_count += 1
                    else:
                        molecule.write(vals)

                    # Mapping corrigé pour utiliser le bon nom de champ
                    mapping = {
                        'Classes thérapeutiques': ('classes_medicales_ids', 'classe_medicale'),
                        'Allergies': ('allergies_ids', 'allergies'),
                        'Antécédents médicaux': ('antecedents_medicaux_ids', 'antecedents'),
                        'Catégories d\'âge': ('categories_age_id', 'age'),
                        'Indications principales': ('indications_ids', 'indications'),
                        'Précautions': ('precaution_ids', 'precaution')
                    }

                    for col_name, (field_name, model_key) in mapping.items():
                        if row.get(col_name):
                            items = self._split_values(row[col_name])
                            if field_name.endswith('_id'):  # Gestion spéciale pour les One2many
                                if items:
                                    item = models[model_key].search([('name', '=', items[0])], limit=1)
                                    if not item:
                                        item = models[model_key].create({'name': items[0]})
                                    molecule.write({field_name: item.id})
                            else:
                                item_ids = []
                                for item_name in items:
                                    # Filtrer les noms invalides
                                    if self._is_valid_field_value(item_name, model_key):
                                        item = models[model_key].search([('name', '=', item_name)], limit=1)
                                        if not item:
                                            item = models[model_key].create({'name': item_name})
                                        item_ids.append(item.id)
                                if item_ids:
                                    molecule.write({field_name: [(6, 0, item_ids)]})

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': 'Succès',
                    'message': f'{imported_molecules_count} molécules importées avec succès',
                    'sticky': False,
                }
            }

        except Exception as e:
            raise UserError(_("Erreur lors de l'importation : %s") % str(e))

    def _is_valid_molecule_name(self, name):
        """
        Vérifier si le nom est un vrai nom de molécule
        Exclure les termes qui sont clairement des indications ou précautions
        """
        if not name or len(name.strip()) < 2:
            return False
            
        # Liste des termes qui ne sont PAS des noms de molécules
        invalid_terms = {
            'nausée', 'naussée', 'vomissement', 'douleur', 'fièvre', 'toux',
            'infection', 'inflammation', 'allergie', 'hypertension', 'diabète',
            'asthme', 'migraine', 'dépression', 'anxiété', 'insomnie',
            'constipation', 'diarrhée', 'fatigue', 'vertiges', 'maux de tête',
            'grossesse', 'allaitement', 'enfant', 'adulte', 'âgé',
            'précaution', 'indication', 'contre-indication', 'effet secondaire'
        }
        
        name_lower = name.lower().strip()
        
        # Vérifier si c'est dans la liste des termes invalides
        if name_lower in invalid_terms:
            return False
            
        # Vérifier si ça ressemble à une phrase (contient plusieurs mots avec des articles/prépositions)
        if any(word in name_lower for word in ['de la', 'du', 'des', 'le ', 'la ', 'les ', 'en cas de', 'pour']):
            return False
            
        return True

    def _is_valid_field_value(self, value, field_type):
        """
        Vérifier si la valeur est valide pour le type de champ donné
        """
        if not value or len(value.strip()) < 2:
            return False
            
        value_lower = value.lower().strip()
        
        # Pour les indications, accepter les termes médicaux
        if field_type == 'indications':
            return True  # Les indications peuvent être variées
            
        # Pour les précautions, accepter les termes de précaution
        if field_type == 'precaution':
            return True  # Les précautions peuvent être variées
            
        # Pour les allergies, classes, etc.
        return True

    def import_precautions(self):
        """
        Méthode pour importer les précautions depuis le fichier CSV attaché
        """
        self.ensure_one()

        if not self.file:
            raise UserError(_("Aucun fichier attaché"))

        try:
            # Décoder le fichier
            file_content = base64.b64decode(self.file).decode('utf-8')
            csv_file = StringIO(file_content)
            reader = csv.reader(csv_file, delimiter=',')

            # Passer l'en-tête si présent
            next(reader, None)

            # Récupérer le modèle des précautions
            precaution_model = self.env['dynamed.precaution']
            imported_count = 0

            for row in reader:
                if row and row[0].strip():
                    name = row[0].strip()
                    # Rechercher ou créer la précaution
                    existing = precaution_model.search([('name', '=', name)], limit=1)
                    if not existing:
                        precaution_model.create({'name': name})
                        imported_count += 1

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': 'Importation réussie',
                    'message': f'{imported_count} précautions importées avec succès',
                    'sticky': False,
                }
            }

        except Exception as e:
            raise UserError(_("Erreur lors de l'importation : %s") % str(e))

    def import_diagnostics_classes(self):
        """
        Méthode pour importer les diagnostics et classes médicales depuis le fichier CSV
        """
        self.ensure_one()

        if not self.file:
            raise UserError(_("Aucun fichier attaché"))

        try:
            # Décoder le fichier
            file_content = base64.b64decode(self.file).decode('utf-8')
            csv_file = StringIO(file_content)
            reader = csv.DictReader(csv_file)

            # Modèles
            diagnostic_model = self.env['dynamed.diagnostic']
            classe_model = self.env['dynamed.classe.medicale']

            count_diag = 0
            count_classes = 0

            for row in reader:
                if not row.get('Diagnostic') or not row.get('Classe médicale'):
                    continue

                # Traitement du diagnostic
                diagnostic_name = row['Diagnostic'].strip()
                diagnostic = diagnostic_model.search([('name', '=', diagnostic_name)], limit=1)

                if not diagnostic:
                    diagnostic = diagnostic_model.create({'name': diagnostic_name})
                    count_diag += 1

                # Traitement des classes médicales avec parsing amélioré
                classes_text = row['Classe médicale'].strip()
                classes = self._split_values(classes_text)
                class_ids = []

                for class_name in classes:
                    if class_name:  # Vérifier que le nom n'est pas vide
                        classe = classe_model.search([('name', '=', class_name)], limit=1)
                        if not classe:
                            classe = classe_model.create({'name': class_name})
                            count_classes += 1
                        class_ids.append(classe.id)

                # Mise à jour des relations many2many
                if class_ids:
                    diagnostic.write({'classe_medicale_ids': [(6, 0, class_ids)]})

            message = f"""
                   Importation terminée avec succès:
                   - Diagnostics créés/mis à jour: {count_diag}
                   - Classes médicales créées: {count_classes}
               """

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': 'Importation réussie',
                    'message': message,
                    'sticky': False,
                }
            }

        except Exception as e:
            raise UserError(_("Erreur lors de l'importation : %s") % str(e))

    def import_nom_commercial(self):
        """Méthode pour importer les noms commerciaux depuis CSV"""
        if not self.file:
            raise UserError(_("Aucun fichier sélectionné"))

        try:
            file_content = base64.b64decode(self.file).decode('utf-8-sig')
            csv_reader = csv.DictReader(StringIO(file_content), delimiter=',')

            imported_count = 0

            for row in csv_reader:
                # Traitement de chaque ligne
                dci = row.get('DCI (Dénomination Commune Internationale)', '').strip()
                nom_commercial = row.get('Nom Commercial', '').strip()

                if not dci or not nom_commercial:
                    continue

                # Gestion de la molécule (dynamed.molecule)
                molecule = self.env['dynamed.molecule'].search([('name', '=', dci)], limit=1)
                if not molecule:
                    molecule = self.env['dynamed.molecule'].create({'name': dci})

                # Gestion du nom commercial
                commercial = self.env['nom.commercial'].search([
                    ('name', '=', nom_commercial),
                    ('molecule_id', '=', molecule.id)
                ], limit=1)

                vals = {
                    'name': nom_commercial,
                    'dosage': row.get('Dosage', '').strip(),
                    'forme_pharmaceutique': row.get('Forme Pharmaceutique', '').strip(),
                    'conditionnement': row.get('Conditionnement', '').strip(),
                    'molecule_id': molecule.id,
                }

                if not commercial:
                    self.env['nom.commercial'].create(vals)
                    imported_count += 1
                else:
                    commercial.write(vals)

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Import réussi'),
                    'message': f'{imported_count} noms commerciaux importés avec succès',
                    'type': 'success',
                    'sticky': False,
                }
            }

        except Exception as e:
            raise UserError(_("Erreur lors de l'import des noms commerciaux: %s") % str(e))

    def _get_or_create_medicament(self, name, model_keys=['medicaments_actuels', 'molecule']):
        """Crée ou récupère un médicament dans tous les modèles nécessaires"""
        res = {}
        for key in model_keys:
            model = self.env[f'dynamed.{key}']
            record = model.search([('name', '=', name)], limit=1)
            if not record:
                record = model.create({'name': name})
            res[key] = record
        return res

    def import_interactions_data(self):
        """Méthode optimisée pour l'importation des interactions"""
        self.ensure_one()

        if not self.file:
            raise UserError(_("Aucun fichier attaché"))

        try:
            file_content = base64.b64decode(self.file).decode('utf-8')
            csv_file = StringIO(file_content)
            reader = csv.DictReader(csv_file)

            Interaction = self.env['dynamed.interaction']
            Classe = self.env['dynamed.classe.medicale']
            imported_count = 0

            for row in reader:
                if not row.get('Médicaments 1'):
                    continue

                # Traitement Médicament 1 (colonne principale)
                med1_data = self._get_or_create_medicament(row['Médicaments 1'].strip())

                # Traitement Classe médicale
                classe = None
                if row.get('Class'):
                    classe = Classe.search([('name', '=', row['Class'].strip())], limit=1)
                    if not classe:
                        classe = Classe.create({'name': row['Class'].strip()})

                # Traitement Médicaments 2 (colonne des interactions)
                if row.get('Médicaments'):
                    med2_names = self._split_values(row['Médicaments'])
                    for med2_name in med2_names:
                        if med2_name:  # Vérifier que le nom n'est pas vide
                            med2_data = self._get_or_create_medicament(med2_name)

                            # Création interaction si elle n'existe pas
                            domain = [
                                ('medicament_1_id', '=', med1_data['molecule'].id),
                                ('medicament_2_id', '=', med2_data['molecule'].id),
                                ('classe_medicale_id', '=', classe.id if classe else False)
                            ]

                            if not Interaction.search(domain, limit=1):
                                Interaction.create({
                                    'medicament_1_id': med1_data['molecule'].id,
                                    'medicament_2_id': med2_data['molecule'].id,
                                    'classe_medicale_id': classe.id if classe else False,
                                    'type_interaction': row.get('Type d\'Interaction', '').strip()
                                })
                                imported_count += 1

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': 'Succès',
                    'message': f'{imported_count} interactions importées avec succès',
                    'sticky': False,
                }
            }

        except Exception as e:
            raise UserError(_("Erreur lors de l'importation : %s") % str(e))