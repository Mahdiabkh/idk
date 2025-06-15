from odoo import models, fields, api

class ClasseMedicale(models.Model):
    _name = 'dynamed.classe.medicale'
    _description = 'Classes médicales normalisées'
    _order = 'name asc'

    name = fields.Char(string='Nom', required=True)
    molecules_ids = fields.Many2many('dynamed.molecule', string="Molecules associées")
