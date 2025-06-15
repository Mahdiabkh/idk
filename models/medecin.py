from odoo import models, fields, api

class Medecin(models.Model):
    _name = 'dynamed.medecin'
    _description = 'Médecin'
    _inherits = {'res.users': 'user_id'}  # Inherit from res.users

    user_id = fields.Many2one('res.users', string='Utilisateur associé', required=True, ondelete='cascade')
    type_pratique = fields.Selection([('prive', 'Privé'), ('public', 'Public')], string='Type de pratique')
    specialite_id = fields.Many2one('dynamed.specialite', string='Spécialité')
    preuve_paiement = fields.Binary(string='Preuve de paiement')
    consultation_ids = fields.One2many('dynamed.consultation', 'medecin_id', string='Consultations')
    nombre_ordonnances = fields.Integer(
        string='Nombre d\'ordonnances',
        compute='_compute_nombre_ordonnances',
        store=True,  # Optionnel : stocke la valeur en base pour des requêtes plus rapides
    )

    @api.depends('user_id')
    def _compute_nombre_ordonnances(self):
        for medecin in self:
            medecin.nombre_ordonnances = self.env['dynamed.prescription'].search_count([
                ('medecin_id', '=', medecin.id)
            ])

    en_essai = fields.Boolean(string='En période d\'essai', default=False)
    date_fin_essai = fields.Datetime(string='Fin de la période d\'essai')
    date_suspension = fields.Datetime(string='Fin de la période d\'essai')
    est_suspendu = fields.Boolean(string='Suspendu', default=False)

    def open_user(self):
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'res.users',
            'res_id': self.user_id.id,
            'view_mode': 'form',
            'target': 'current',
        }

class ResUsers(models.Model):
    _inherit = 'res.users'

    medecin_id = fields.One2many('dynamed.medecin', 'user_id', string='Médecin Profile')