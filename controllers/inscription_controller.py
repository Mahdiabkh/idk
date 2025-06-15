from odoo import http,fields
from odoo.http import request
import base64
from datetime import datetime, timedelta


class InscriptionMedecinController(http.Controller):

    @http.route('/inscription/medecin', type='http', auth="public", website=True)
    def inscription_medecin_form(self, **kw):
        specialites =   request.env['dynamed.specialite'].search([])
        return request.render('dynamed.inscription_medecin_form', {
            'specialites': specialites,
        })

    @http.route('/inscription/medecin/submit', type='http', auth="public", website=True, csrf=False)
    def submit_inscription(self, **post):
        InscriptionMedecin = request.env['dynamed.inscription.medecin']

        # Récupération du fichier de preuve de paiement
        preuve_paiement_file = request.httprequest.files.get('preuve_paiement')
        preuve_paiement_data = base64.b64encode(preuve_paiement_file.read()) if preuve_paiement_file else False

        values = {
            'name': post.get('name'),
            'phone': post.get('phone'),
            'email': post.get('email'),
            'type_pratique': post.get('type_pratique'),
            'specialite_id': int(post.get('specialite_id')) if post.get('specialite_id') else False,
            'preuve_paiement': preuve_paiement_data,
        }

        inscription = InscriptionMedecin.create(values)
        # Send notification
        inscription._notify_admins('inscription')


        return request.render('dynamed.inscription_success_template')

    @http.route('/medecin/upload/payment', type='http', auth="public", website=True)
    def upload_payment(self, **kw):
        # Get inscription ID from URL
        print(f"Accessing upload payment with params: {kw}")

        inscription_id = int(kw.get('inscription_id', 0))
        print(f"Looking for inscription ID: {inscription_id}")

        inscription = request.env['dynamed.inscription.medecin'].sudo().browse(inscription_id)

        if not inscription.exists():
            return request.redirect('/web/login')

        if request.httprequest.method == 'POST':
            proof_file = request.httprequest.files.get('preuve_paiement')
            if proof_file:
                # Save payment proof
                inscription.write({
                    'preuve_paiement': base64.b64encode(proof_file.read()),
                    'statut': 'paiement_attente'  # en attente de validation de payment
                })

                # Send notification
                inscription._notify_admins('paiement')

                return request.redirect('/payment/success')

        return request.render('dynamed.upload_payment_form', {
            'inscription': inscription
        })

    @http.route('/payment/success', type='http', auth="public", website=True)
    def payment_success(self, **kw):
        """
        Display payment success confirmation page
        """
        return request.render('dynamed.payment_success_template')