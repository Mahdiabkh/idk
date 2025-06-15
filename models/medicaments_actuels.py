from odoo import models, fields

class MedicamentActuels(models.Model):
    _name = 'dynamed.medicaments_actuels'
    _description = 'Médicaments actuellement pris par le patient'

    name = fields.Char(string="Nom du médicament", required=True)
    description = fields.Text(string="Description du médicament")