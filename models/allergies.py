from odoo import models, fields

class Allergies(models.Model):
    _name = 'dynamed.allergies'
    _description = 'Allergies du patient'

    name = fields.Char(string="Nom de l'allergie", required=True)
    description = fields.Text(string="Description des symptômes ou réactions")