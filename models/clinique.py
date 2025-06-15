from odoo import models, fields

class Clinique(models.Model):
    _name = 'dynamed.clinique'
    _description = 'Clinique'


    name = fields.Char(string='Nom', required=True)
    phone = fields.Char(string='Téléphone')
    date_naissance = fields.Date(string='Date de naissance')
    email = fields.Char(string='Email')
    name_clinique = fields.Char(string='Nom de la clinique')
    adresse_clinique = fields.Char(string='Adresse de la clinique')
    nombre_medecin = fields.Integer(string='Nombre de médecins')
    offres = fields.Text(string='Offres')
    preuve_paiement = fields.Binary(string='Preuve de paiement')