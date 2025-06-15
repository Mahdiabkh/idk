from odoo import models, fields


class Precaution(models.Model):
    _name = 'dynamed.precaution'
    _description = 'Précautions médicamenteuses'

    name = fields.Char(string='Nom de la précaution', required=True)