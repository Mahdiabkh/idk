from odoo import models, fields

class Interaction(models.Model):
    _name = 'dynamed.interaction'
    _description = 'Interaction entre médicaments'

    medicament_1_id = fields.Many2one(
        'dynamed.molecule',
        string='Médicament 1',
        required=True
    )
    medicament_2_id = fields.Many2one(
        'dynamed.molecule',
        string='Médicament 2',
        required=True
    )
    classe_medicale_id = fields.Many2one(
        'dynamed.classe.medicale',
        string='Classe Médicale'
    )
    type_interaction = fields.Text(
        string="Type d'interaction",
        required=True
    )