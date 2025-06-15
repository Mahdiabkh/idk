from odoo import models, fields, api
from odoo.exceptions import UserError, ValidationError


class DynamedPrescription(models.Model):
    _name = 'dynamed.prescription'
    _description = 'Prescription Médicale'

    # Champs de base
    name = fields.Char(string="Référence", default="Nouvelle Ordonnance", readonly=True)
    consultation_id = fields.Many2one(
        'dynamed.consultation',
        string="Consultation",
        required=True,
        ondelete='cascade',
    )
    valid_molecules = fields.Many2many(
        'dynamed.molecule',
        string="Médicaments Recommandés",
    )

    medecin_id = fields.Many2one(
        'dynamed.medecin',
        string="Médecin",
        related='consultation_id.medecin_id',
        store=True,
        readonly=True,
    )
    patient_id = fields.Many2one(  # Ensure this field is defined
        'dynamed.patient',
        string="Patient",
        related='consultation_id.patient_id',
        store=True,
        readonly=True,
    )
    # Champs liés pour afficher les informations du médecin
    medecin_name = fields.Char(related='consultation_id.medecin_id.name', string="Nom du médecin", readonly=True)
    medecin_specialite = fields.Char(related='consultation_id.medecin_id.specialite_id.name',
                                     string="Spécialité du médecin", readonly=True)
    medecin_phone = fields.Char(related='consultation_id.medecin_id.phone', string="Téléphone du médecin",
                                readonly=True)
    medecin_email = fields.Char(related='consultation_id.medecin_id.email', string="Email du médecin", readonly=True)

    # Champs liés pour afficher les informations du patient
    patient_name = fields.Char(related='consultation_id.patient_id.name', string="Nom du patient", readonly=True)
    patient_age = fields.Integer(related='consultation_id.patient_id.age', string="Âge du patient", readonly=True)
    patient_sexe = fields.Selection(related='consultation_id.patient_id.sexe', string="Sexe du patient", readonly=True)

    molecule_line_ids = fields.One2many(
        'prescription.molecule.line',
        'prescription_id',
        string='Détails des médicaments'
    )

    # Méthode pour générer une référence unique
    @api.model
    def create(self, vals):
        if vals.get('name', 'Nouvelle Ordonnance') == 'Nouvelle Ordonnance':
            vals['name'] = self.env['ir.sequence'].next_by_code('dynamed.prescription') or 'Nouvelle Ordonnance'
        return super().create(vals)

    # Méthode pour imprimer le rapport
    def action_print_prescription(self):
        return self.env.ref('dynamed.action_prescription_report').report_action(self)



class PrescriptionMoleculeLine(models.Model):
    _name = 'prescription.molecule.line'

    prescription_id = fields.Many2one('dynamed.prescription')
    molecule_id = fields.Many2one('dynamed.molecule', required=True)
    commercial_name_id = fields.Many2one(
        'nom.commercial',
        domain="[('molecule_id','=',molecule_id)]",
        string="Nom commercial"
    )

    # Champs qui se mettront à jour automatiquement
    dosage = fields.Char(compute='_compute_commercial_details', store=True)
    forme = fields.Char(compute='_compute_commercial_details', store=True)
    conditionnement = fields.Char(compute='_compute_commercial_details', store=True)

    @api.depends('commercial_name_id')
    def _compute_commercial_details(self):
        for record in self:
            if record.commercial_name_id:
                record.dosage = record.commercial_name_id.dosage
                record.forme = record.commercial_name_id.forme_pharmaceutique
                record.conditionnement = record.commercial_name_id.conditionnement
            else:
                record.dosage = False
                record.forme = False
                record.conditionnement = False

    @api.model
    def create(self, vals):
        # Vérification avant création
        prescription = self.env['dynamed.prescription'].browse(vals.get('prescription_id'))
        new_molecule = self.env['dynamed.molecule'].browse(vals.get('molecule_id'))

        if prescription and new_molecule:
            # Récupérer les molécules existantes
            existing_molecules = prescription.molecule_line_ids.mapped('molecule_id')

            # Vérifier les interactions
            interactions = self._check_interactions(new_molecule, existing_molecules)
            if interactions:
                raise UserError(
                    "⚠️❌ Interaction médicamenteuse détectée :\n\n" +
                    "\n".join([
                        f"- {new_molecule.name} + {mol.name}: {interaction.type_interaction}"
                        for mol, interaction in interactions.items()
                    ]) +
                    "\n\n Veuillez choisir une autre molécule."
                )

        return super().create(vals)

    def _check_interactions(self, new_molecule, existing_molecules):
        """Retourne un dictionnaire des interactions trouvées"""
        interactions = {}

        for molecule in existing_molecules:
            # Recherche d'interaction dans les deux sens
            interaction = self.env['dynamed.interaction'].search([
                '|',
                '&', ('medicament_1_id', '=', new_molecule.id),
                ('medicament_2_id', '=', molecule.id),
                '&', ('medicament_2_id', '=', new_molecule.id),
                ('medicament_1_id', '=', molecule.id)
            ], limit=1)

            if interaction:
                interactions[molecule] = interaction

        return interactions

    @api.constrains('molecule_id')
    def _check_interactions_on_update(self):
        for rec in self:
            prescription = rec.prescription_id
            if prescription:
                other_molecules = prescription.molecule_line_ids - rec
                interactions = self._check_interactions(rec.molecule_id, other_molecules)
                if interactions:
                    raise ValidationError(
                        "Interaction médicamenteuse détectée après modification:\n\n" +
                        "\n".join([
                            f"- {rec.molecule_id.name} + {mol.name}: {interaction.type_interaction}"
                            for mol, interaction in interactions.items()
                        ])
                    )