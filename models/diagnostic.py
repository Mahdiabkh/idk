from odoo import models, fields, api

class Diagnostic(models.Model):
    _name = 'dynamed.diagnostic'
    _description = 'Diagnostics médicaux'
    _order = 'name asc'

    name = fields.Char(string='Diagnostic', required=True, index=True)
    classe_medicale_ids = fields.Many2many(
        'dynamed.classe.medicale',
        string='Classes médicales associées',
        help='Classes de médicaments recommandées'
    )
