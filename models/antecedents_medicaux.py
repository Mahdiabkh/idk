from odoo import models, fields

class AntecedentsMedicaux(models.Model):
    _name = 'dynamed.antecedents_medicaux'
    _description = 'Antécédents médicaux du patient'

    name = fields.Char(string="Nom de l'antécédent", required=True)
    description = fields.Text(string="Description détaillée de l'antécédent")