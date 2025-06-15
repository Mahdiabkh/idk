from odoo import models, fields

class indications(models.Model):
    _name = 'dynamed.indications'
    _description = 'Indications'

    name = fields.Char(string='Nom', required=True)
