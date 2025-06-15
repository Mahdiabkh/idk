from odoo import models, fields, api, _
from odoo.exceptions import UserError


class Consultation(models.Model):
    _name = 'dynamed.consultation'
    _description = 'Consultation'

    date_consultation = fields.Date(string='Date de consultation', default=fields.Date.context_today)
    patient_id = fields.Many2one('dynamed.patient', string='Patient', required=True)
    patient_name = fields.Char(related='patient_id.name', string="Nom du patient", readonly=True)
    patient_age = fields.Integer(related='patient_id.age', string="Âge du patient", readonly=True)
    patient_sexe = fields.Selection(related='patient_id.sexe', string="Sexe du patient", readonly=True)

    medecin_id = fields.Many2one('dynamed.medecin', string='Médecin', default=lambda self: self._get_default_medecin())

    @api.model
    def _get_default_medecin(self):
        user = self.env.user
        medecin = self.env['dynamed.medecin'].search([('user_id', '=', user.id)], limit=1)
        return medecin.id if medecin else False
    medecin_phone = fields.Char(related='medecin_id.phone', string='Téléphone du Médecin', readonly=True)
    medecin_email = fields.Char(related='medecin_id.email', string='Email du Médecin', readonly=True)
    medecin_type_pratique = fields.Selection(related='medecin_id.type_pratique', string='Type de Pratique',
                                             readonly=True)
    medecin_specialite = fields.Char(related='medecin_id.specialite_id.name', string='Spécialité du Médecin',
                                     readonly=True)

    type_patient = fields.Selection([('adulte', 'Adulte'), ('enfant', 'Enfant')], string='Type de patient')
    femme_enceinte = fields.Boolean(string='Enceinte')
    femme_allaitante = fields.Boolean(string='Allaitante')

    indications_ids = fields.Many2many('dynamed.indications', string='Indications')
    medicament_actuels_ids = fields.Many2many('dynamed.medicaments_actuels', string='Médicaments Actuels')
    antecedents_medicaux_ids = fields.Many2many('dynamed.antecedents_medicaux', string='Antécédents Médicaux')
    allergies_ids = fields.Many2many('dynamed.allergies', string='Allergies')
    prescription_ids = fields.One2many(
        'dynamed.prescription',
        'consultation_id',
        string="Ordonnances",
    )
    valid_molecules = fields.Many2many(
        'dynamed.molecule',
        string='Médicaments Recommandés',
        compute='_compute_valid_molecules',  # Méthode de calcul
    )
    diagnostics_ids = fields.Many2many(
        'dynamed.diagnostic',
        string='Diagnostics'
    )
    precaution_ids = fields.Many2many(
        'dynamed.precaution',
        string='Précautions spécifiques',
        help='Précautions particulières à prendre en compte pour cette consultation'
    )

    def score_molecules(self):
        """
        Score molecules based on diagnostics, indications, and contraindications.
        Only molecules that belong to the medical classes associated with selected diagnostics are considered.
        """
        self.ensure_one()
        scored_molecules = []

        # Step 1: Get medical classes from selected diagnostics
        medical_class_ids = self.diagnostics_ids.mapped('classe_medicale_ids').ids
        if not medical_class_ids:
            raise UserError("Aucun classe médicale associée aux diagnostics sélectionnés.")

        # Step 2: Get molecules belonging to these medical classes
        molecules = self.env['dynamed.molecule'].search([
            ('classes_medicales_ids', 'in', medical_class_ids)
        ])

        # Step 3: Prepare contraindications data from consultation
        contraindications = {
            'allergies': [a.name.lower() for a in self.allergies_ids],
            'medical_history': [h.name.lower() for h in self.antecedents_medicaux_ids],
            'current_meds': [m.name.lower() for m in self.medicament_actuels_ids],
            'pregnancy': self.femme_enceinte,
            'breastfeeding': self.femme_allaitante
        }

        # Step 4: Prepare indications and precautions
        indications = [i.name.lower() for i in self.indications_ids]
        precautions = [p.name.lower() for p in self.precaution_ids]

        for molecule in molecules:
            score = 0
            skip_molecule = False

            # Check contraindications
            if molecule.allergies_ids:
                for allergy in contraindications['allergies']:
                    if allergy in [a.name.lower() for a in molecule.allergies_ids]:
                        skip_molecule = True
                        break

            if not skip_molecule and molecule.antecedents_medicaux_ids:
                for condition in contraindications['medical_history']:
                    if condition in [c.name.lower() for c in molecule.antecedents_medicaux_ids]:
                        skip_molecule = True
                        break

            if not skip_molecule and molecule.medicaments_actuels_ids:
                for med in contraindications['current_meds']:
                    if med in [m.name.lower() for m in molecule.medicaments_actuels_ids]:
                        skip_molecule = True
                        break

            if not skip_molecule and contraindications['pregnancy'] and molecule.grossesse:
                skip_molecule = True

            if not skip_molecule and contraindications['breastfeeding'] and molecule.allaitement:
                skip_molecule = True

            if skip_molecule:
                continue

            # Score based on indications
            if molecule.indications_ids:
                molecule_indications = [i.name.lower() for i in molecule.indications_ids]
                for indication in indications:
                    if indication in molecule_indications:
                        score += 2

            # Deduct for precautions
            if molecule.precaution_ids:
                molecule_precautions = [p.name.lower() for p in molecule.precaution_ids]
                for precaution in precautions:
                    if precaution in molecule_precautions:
                        score -= 1

            # Add to results if score > 0
            if score > 0:
                scored_molecules.append({
                    'molecule_id': molecule.id,
                    'name': molecule.name,
                    'score': score,
                    'indications': ', '.join(i.name for i in molecule.indications_ids),
                    'precautions': ', '.join(p.name for p in molecule.precaution_ids),
                    'side_effects': molecule.effet_majeurs or '',
                    'commercial_names': ', '.join(n.name for n in molecule.nom_commercial_ids),
                    'medical_classes': ', '.join(c.name for c in molecule.classes_medicales_ids)
                })

        scored_molecules.sort(key=lambda x: x['score'], reverse=True)
        valid_molecule_ids = [m['molecule_id'] for m in scored_molecules]
        self.write({'valid_molecules': [(6, 0, valid_molecule_ids)]})

        return scored_molecules
 
    def action_score_molecules(self):
        """Action to score molecules and show results"""
        self.ensure_one()
        results = self.score_molecules()

        if not results:
            raise UserError("Aucune molécule valide trouvée pour ce patient.")

        # Prepare message with results
        message_lines = []
        for mol in results[:1]:  # Show top 10 results
            message_lines.append(
                f"{mol['name']} (Score: {mol['score']})\n"
                f"Indications: {mol['indications']}\n"
                f"Précautions: {mol['precautions']}\n"
                f"Noms commerciaux: {mol['commercial_names']}\n"
                f"Classes médicales: {mol['medical_classes']}\n"
                f"Effets secondaires: {mol['side_effects']}\n"
                "----------------------------------------"
            )

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Médicaments recommandés',
                'message': '\n'.join(message_lines),
                'sticky': True,
            }
        }

    @api.depends(
        'indications_ids', 'allergies_ids', 'antecedents_medicaux_ids',
        'medicament_actuels_ids', 'precaution_ids', 'femme_enceinte',
        'femme_allaitante', 'type_patient'
    )
    def _compute_valid_molecules(self):
        """Compute method for valid_molecules field"""
        for consultation in self:
            if not consultation.id:  # New record, not saved yet
                consultation.valid_molecules = False
                continue

            # Call score_molecules but only keep the IDs
            scored_molecules = consultation.score_molecules()
            consultation.valid_molecules = [(6, 0, [m['molecule_id'] for m in scored_molecules])]

    def action_generate_prescription(self):
        self.ensure_one()

        if not self.valid_molecules:
            raise UserError("Aucune molécule valide disponible.")

        prescription = self.env['dynamed.prescription'].create({
            'consultation_id': self.id,
        })

        # Créer une ligne par molécule (sans dupliquer)
        for molecule in self.valid_molecules:
            first_commercial = molecule.nom_commercial_ids[0] if molecule.nom_commercial_ids else False
            self.env['prescription.molecule.line'].create({
                'prescription_id': prescription.id,
                'molecule_id': molecule.id,
                'commercial_name_id': first_commercial.id if first_commercial else False,
            })

        return {
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            'res_model': 'dynamed.prescription',
            'res_id': prescription.id,
            'target': 'current',
        }