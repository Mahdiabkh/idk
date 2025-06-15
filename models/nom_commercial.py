from odoo import models, fields, api


class NomCommercial(models.Model):
    _name = 'nom.commercial'
    _description = 'Noms Commerciaux des Médicaments'

    name = fields.Char(string='Nom Commercial', required=True)
    dosage = fields.Char(string='Dosage')
    forme_pharmaceutique = fields.Char(string='Forme Pharmaceutique')
    conditionnement = fields.Char(string='Conditionnement')
    molecule_id = fields.Many2one('dynamed.molecule', string='Molecule', required=True)

