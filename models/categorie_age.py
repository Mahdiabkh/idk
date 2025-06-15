from odoo import models, fields

class AgeCategory(models.Model):
    _name = 'dynamed.age.category'
    _description = 'Catégories d\'âge des patients'

    name = fields.Char(string="Nom de la catégorie d'âge", required=True)
    description = fields.Text(string="Description de la tranche d'âge")