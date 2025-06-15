from odoo import models, fields,api

class Patient(models.Model):
    _name = 'dynamed.patient'
    _description = 'Patient'


    name = fields.Char(string='Nom', required=True)
    age = fields.Integer(string='Âge')
    phone = fields.Char(string='Téléphone')
    email = fields.Char(string='Email')
    sexe = fields.Selection([('homme', 'Homme'), ('femme', 'Femme')], string='Sexe')

    #just for dashboard
    age_group = fields.Selection(
        selection=[
            ('0-10', '0-10'),  # NEW: Added 0-10 range
            ('11-18', '11-18'),  # Split previous 0-18 into 0-10 and 11-18
            ('19-30', '19-30'),
            ('31-50', '31-50'),
            ('50+', '50+'),
        ],
        string="Age Group",
        compute="_compute_age_group",
        store=True,
    )

    @api.depends('age')
    def _compute_age_group(self):
        for patient in self:
            if patient.age <= 10:  # NEW: 0-10 range
                patient.age_group = '0-10'
            elif 11 <= patient.age <= 18:  # Updated: 11-18 range
                patient.age_group = '11-18'
            elif 19 <= patient.age <= 30:
                patient.age_group = '19-30'
            elif 31 <= patient.age <= 50:
                patient.age_group = '31-50'
            else:
                patient.age_group = '50+'