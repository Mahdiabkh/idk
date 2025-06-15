from odoo import models, fields, api

class PaymentRejectionWizard(models.TransientModel):
    _name = 'payment.rejection.wizard'
    _description = 'Wizard for payment rejection'

    inscription_id = fields.Many2one('dynamed.inscription.medecin', required=True)
    rejection_reason = fields.Text(string="Raison de rejet", required=True)

    def action_confirm_rejection(self):
        self.ensure_one()
        self.inscription_id.write({
            'statut': 'paiement_attente',
            'rejection_reason': self.rejection_reason
        })
        self.inscription_id._send_rejection_email()
        return {'type': 'ir.actions.act_window_close'}