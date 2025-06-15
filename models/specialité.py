from odoo import models, fields

class Specialite(models.Model):
    _name = 'dynamed.specialite'
    _description = 'Spécialité Médicale'

    name = fields.Char(string='Nom de la spécialité', required=True)
    description = fields.Text(string='Description')