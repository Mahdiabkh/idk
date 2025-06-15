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
        """Fonction pour séparer les valeurs selon différents séparateurs"""
        if not text:
            return []

        # Normaliser les séparateurs (remplacer les tirets par des virgules)
        normalized_text = re.sub(r'(\s*-\s*|\s*,\s*)', '|', text.strip())
        # Supprimer les espaces autour des pipes et filtrer les valeurs vides
        return [v.strip() for v in normalized_text.split('|') if v.strip()]

    def import_molecules_data(self):
        """Méthode principale pour l'importation"""
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
                'classe_medicale': self.env['dynamed.classe.medicale'],  # Modifié pour correspondre au nom du modèle
                'precaution': self.env['dynamed.precaution']
            }

            for row in reader:
                if not row.get('Nom de la molécule'):
                    continue

                # Gestion de la molécule de base
                molecule_name = row['Nom de la molécule'].strip()
                molecule = models['molecule'].search([('name', '=', molecule_name)], limit=1)

                vals = {
                    'name': molecule_name,
                    'grossesse': row.get('Grossesse', '').strip().upper() == 'TRUE',
                    'allaitement': row.get('Allaitement', '').strip().upper() == 'TRUE',
                    'effet_majeurs': row.get('Effets secondaires majeurs', '').strip(),
                }

                if not molecule:
                    molecule = models['molecule'].create(vals)
                else:
                    molecule.write(vals)

                # Mapping corrigé pour utiliser le bon nom de champ
                mapping = {
                    'Classes thérapeutiques': ('classes_medicales_ids', 'classe_medicale'),
                    'Allergies': ('allergies_ids', 'allergies'),
                    'Antécédents médicaux': ('antecedents_medicaux_ids', 'antecedents'),
                    'Catégories d\'âge': ('categories_age_id', 'age'),  # One2many spécial
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
                    'message': 'Importation terminée avec succès',
                    'sticky': False,
                }
            }

        except Exception as e:
            raise UserError(_("Erreur lors de l'importation : %s") % str(e))


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

            for row in reader:
                if row and row[0].strip():
                    name = row[0].strip()
                    # Rechercher ou créer la précaution
                    precaution_model.search([('name', '=', name)], limit=1) or \
                    precaution_model.create({'name': name})

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': 'Importation réussie',
                    'message': 'Les précautions ont été importées avec succès',
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

                # Traitement des classes médicales
                classes = [c.strip() for c in row['Classe médicale'].split(',') if c.strip()]
                class_ids = []

                for class_name in classes:
                    classe = classe_model.search([('name', '=', class_name)], limit=1)
                    if not classe:
                        classe = classe_model.create({'name': class_name})
                        count_classes += 1
                    class_ids.append(classe.id)

                # Mise à jour des relations many2many
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

                if commercial:
                    commercial.write(vals)
                else:
                    self.env['nom.commercial'].create(vals)

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Import réussi'),
                    'message': _('Les noms commerciaux ont été importés avec succès'),
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
        """Méthode optimisée pour l'importation"""
        self.ensure_one()

        if not self.file:
            raise UserError(_("Aucun fichier attaché"))

        try:
            file_content = base64.b64decode(self.file).decode('utf-8')
            csv_file = StringIO(file_content)
            reader = csv.DictReader(csv_file)

            Interaction = self.env['dynamed.interaction']
            Classe = self.env['dynamed.classe.medicale']

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
                    for med2_name in self._split_values(row['Médicaments']):
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

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': 'Succès',
                    'message': 'Importation des interactions et médicaments terminée',
                    'sticky': False,
                }
            }

        except Exception as e:
            raise UserError(_("Erreur lors de l'importation : %s") % str(e))