from odoo import models, fields, api,_
from odoo.exceptions import ValidationError
from datetime import datetime, timedelta
from odoo.exceptions import UserError

from odoo.tools import html_sanitize

class InscriptionMedecin(models.Model):
    _name = 'dynamed.inscription.medecin'
    _inherit = ['mail.thread', 'mail.activity.mixin']  # Add these inherits

    _description = 'Demande d\'inscription Médecin'

    name = fields.Char(string='Nom', required=True)
    phone = fields.Char(string='Téléphone')
    email = fields.Char(string='Email', required=True)
    type_pratique = fields.Selection([('prive', 'Privé'), ('public', 'Public')], string='Type de pratique')
    specialite_id = fields.Many2one('dynamed.specialite', string='Spécialité')
    preuve_paiement = fields.Binary(string='Preuve de paiement', widget="image")
    # Add to your states
    statut = fields.Selection([
        ('en_attente', 'En attente'),
        ('approuve', 'demande Approuvé'),
        ('rejete', 'Rejeté'),
        ('medecin_cree', 'Médecin Créé'),
        ('essai', 'En période d\'essai'),
        ('paiement_attente', 'En attente de paiement'),  # New state
        ('suspendu', 'Suspendu') ,
        ('validated', 'Validée')  # New state
    ], string='Statut', default='en_attente')

    medecin_id = fields.Many2one('dynamed.medecin', string='Médecin associé', readonly=True)
    date_fin_essai = fields.Datetime(string='Fin de la période d\'essai')
    est_suspendu = fields.Boolean(string='Suspendu', default=False)

    payment_valide = fields.Boolean(string='Paiement Validé', default=False)

    # Add to your InscriptionMedecin class
    payment_confirmation_url = fields.Char(compute='_compute_payment_url')

    outgoing_email = fields.Char(
        string='Outgoing Email',
        default=lambda self: self.env['ir.mail_server'].sudo().search([], limit=1).smtp_user or 'support@dynamed.com'
    )

    login_url = fields.Char(string="Login URL", compute="_compute_login_url")

    rejection_reason = fields.Text(string="Raison de rejet")

    def _notify_admins(self, event_type="inscription"):
        """
        Notify admin group about registration/payment events
        Returns: mail.message record or False
        """
        try:
            # 1. Get Odoo Bot as sender with sudo
            bot = self.env.ref('base.user_root').sudo()
            if not bot:
                print("Odoo Bot user not found in system")
                return False

            # 2. Get admin group members with sudo
            admin_group = self.env.ref('dynamed.group_dynamed_admin').sudo()
            if not admin_group:
                print("Admin group not found!")
                return False

            admin_users = admin_group.users.filtered(lambda u: u.active)
            if not admin_users:
                print("No active users in admin group")
                return False

            # 3. Prepare message content
            base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
            record_url = f"{base_url}/web#id={self.id}&model=dynamed.inscription.medecin"

            templates = {
                'inscription': {
                    'subject': f"🆕 Nouvelle inscription - Dr. {self.name}",
                    'body': html_sanitize(f"""
                        <div style='padding:10px;border-left:4px solid #875A7B'>
                            <p><b>Nouvelle inscription</b></p>
                            <p>Médecin: {self.name}</p>
                            <p>Email: {self.email}</p>
                            <p><a href='{record_url}'>Voir la demande</a></p>
                        </div>
                    """),
                    'subtype_id': self.env.ref('mail.mt_comment').id,
                },
                'paiement': {
                    'subject': f"💰 Paiement à valider - Dr. {self.name}",
                    'body': html_sanitize(f"""
                        <div style='padding:10px;border-left:4px solid #FFC107'>
                            <p><b>Nouveau paiement</b></p>
                            <p>Médecin: {self.name}</p>
                            <p>Date: {fields.Datetime.now()}</p>
                            <p><a href='{record_url}'>Vérifier le paiement</a></p>
                        </div>
                    """),
                    'subtype_id': self.env.ref('mail.mt_comment').id,
                }
            }

            template = templates.get(event_type)
            if not template:
                print(f"No template found for event type: {event_type}")
                return False

            # 4. Create message with sudo
            print("Creating new message...")
            message = self.with_user(bot).sudo().message_post(
                body=template['body'].strip(),
                subject=template['subject'],
                message_type="comment",
                subtype_id=template['subtype_id'],
                email_from=bot.email,
                email_layout_xmlid='mail.mail_notification_light',
            )
            print(f"Created message ID: {message.id}")

            # 5. Create notifications - simplified approach
            for user in admin_users:
                try:
                    print(f"Creating notification for {user.name}")
                    self.env['mail.notification'].sudo().create({
                        'mail_message_id': message.id,
                        'res_partner_id': user.partner_id.id,
                        'notification_type': 'inbox',
                        'is_read': False,
                    })
                except Exception as e:
                    print(f"Failed to create notification for {user.name}: {str(e)}")
                    continue

            return message

        except Exception as e:
            print(f"Notification failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def _notify_admin_channel(self, event_type):
        """Send notification to admin channel"""
        channel = self.env.ref('dynamed.channel_admin_notifications')
        if not channel:
            return False

        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')

        if event_type == 'inscription':
            message = f"""
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <strong>Nouvelle inscription</strong>
                </div>
                <div class="card-body">
                    <p><strong>Médecin:</strong> {self.name}</p>
                    <p><strong>Email:</strong> {self.email}</p>
                    <p><strong>Téléphone:</strong> {self.phone}</p>
                    <p><strong>Spécialité:</strong> {self.specialite_id.name or 'Non spécifié'}</p>
                    <a href="{base_url}/web#id={self.id}&model=dynamed.inscription.medecin" 
                       class="btn btn-primary mt-2">
                        Voir la demande
                    </a>
                </div>
            </div>
            """
            subject = f"Nouvelle inscription - Dr. {self.name}"
        else:  # paiement
            message = f"""
            <div class="card">
                <div class="card-header bg-warning text-white">
                    <strong>Nouveau paiement</strong>
                </div>
                <div class="card-body">
                    <p><strong>Médecin:</strong> {self.name}</p>
                    <p><strong>Email:</strong> {self.email}</p>
                    <p><strong>Date soumission:</strong> {fields.Datetime.now()}</p>
                    <a href="{base_url}/web#id={self.id}&model=dynamed.inscription.medecin" 
                       class="btn btn-warning mt-2">
                        Vérifier le paiement
                    </a>
                </div>
            </div>
            """
            subject = f"Paiement soumis - Dr. {self.name}"

        channel.sudo().message_post(
            body=message,
            subject=subject,
            message_type="comment",
            subtype_xmlid="mail.mt_comment"
        )

    def action_reject_payment(self):
        return {
            'name': 'Rejeter le Paiement',
            'type': 'ir.actions.act_window',
            'res_model': 'payment.rejection.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {'default_inscription_id': self.id}
        }

    def _send_rejection_email(self):
        template = self.env.ref('dynamed.email_template_payment_rejected')
        for record in self:
            template.with_context(rejection_reason=record.rejection_reason).send_mail(record.id, force_send=True)

    def _compute_login_url(self):

        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        for record in self:
            record.login_url =  f"{base_url}/web/login"


    def _compute_payment_url(self):
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        for record in self:
            record.payment_confirmation_url = f"{base_url}/medecin/upload/payment?inscription_id={record.id}"

    def action_valider_payment(self):
        """Valider manuellement le paiement et activer le compte"""
        print("\n=== action_valider_payment called ===")
        for record in self:
            print(f"Processing record {record.id}")
            print(f"Current status: {record.statut}")
            print(f"Payment valid: {record.payment_valide}")
            print(f"Has proof: {bool(record.preuve_paiement)}")

            if not record.payment_valide and record.preuve_paiement:
                try:
                    record.write({
                        'payment_valide': True,
                        'statut': 'validated'
                    })
                    print(f"Updated status to: {record.statut}")
                    record.action_confirm_payment()
                    record._send_payment_confirmation()
                except Exception as e:
                    print(f"Error updating record: {str(e)}")
                    raise
            elif not record.preuve_paiement:
                msg = "Aucune preuve de paiement n'a été uploadée."
                print(msg)
                raise ValidationError(msg)
            else:
                print("Payment already validated")

    def _send_payment_confirmation(self):
        self.ensure_one()
        template = self.env.ref('dynamed.email_template_account_activated')
        template.send_mail(self.id, force_send=True)

    def action_approve(self):
        for record in self:
            # Set trial period end date (3 days from now)
            record.write({
                'statut': 'essai',
                'date_fin_essai': datetime.now() + timedelta(days=3) , # Changed from days=3 to minutes=2
                #'date_fin_essai': datetime.now() + timedelta(minutes=2)  # Changed from days=3 to minutes=2
            })
            # Create doctor account immediately for trial
            record.action_create_medecin_trial()

    def action_create_medecin_trial(self):
        """Create doctor account for trial period (without payment proof)"""
        for record in self:
            if not record.medecin_id and record.statut == 'essai':
                if not record.email:
                    raise ValidationError("L'email est obligatoire pour créer un utilisateur.")
                if not record.name:
                    raise ValidationError("Le nom est obligatoire pour créer un utilisateur.")

                # Create user with trial status
                user = self.env['res.users'].create({
                    'name': record.name,
                    'login': record.email,
                    'email': record.email,
                    'phone': record.phone,
                    'action_id': self.env.ref('dynamed.action_consultation').id,
                    'groups_id': [
                        (6, 0, [
                            self.env.ref('base.group_user').id,
                            self.env.ref('dynamed.group_dynamed_medecin').id,
                            self.env.ref('dynamed.group_dynamed_medecin_trial').id  # New group for trial doctors
                        ])
                    ],
                    'active': True
                })

                user.action_reset_password()

                # Create the Medecin record
                medecin = self.env['dynamed.medecin'].create({
                    'user_id': user.id,
                    'type_pratique': record.type_pratique,
                    'specialite_id': record.specialite_id.id,
                    'en_essai': True,
                    'date_fin_essai': record.date_fin_essai
                })

                record.write({'medecin_id': medecin.id})

    def action_confirm_payment(self):
        """Confirm payment and convert trial account to full account"""
        for record in self:
            if record.medecin_id and record.statut == 'essai' and record.preuve_paiement:
                # Remove trial group and add regular doctor group
                record.medecin_id.user_id.write({
                    'groups_id': [
                        (3, self.env.ref('dynamed.group_dynamed_medecin_trial').id),
                        (4, self.env.ref('dynamed.group_dynamed_medecin').id)
                    ],
                })
                # Update doctor record
                record.medecin_id.write({
                    'en_essai': False,
                    'date_fin_essai': False,
                    'preuve_paiement': record.preuve_paiement
                })
                record.write({'statut': 'medecin_cree', 'est_suspendu': False})

    def check_trial_expiration(self):
        """Check all trial doctors and suspend those whose trial has expired"""
        print("\n=== STARTING TRIAL EXPIRATION CHECK ===")
        print(f"Current time: {datetime.now()}")

        # Get the outgoing mail server (replace with your server ID or search logic)
        mail_server = self.env['ir.mail_server'].search([], limit=1)
        if not mail_server:
            print("⚠️ Warning: No outgoing mail server configured!")
            return False

        # Find expired trial records
        expired_records = self.search([
            ('statut', '=', 'essai'),
            ('date_fin_essai', '<', datetime.now()),
            ('est_suspendu', '=', False)
        ])

        print(f"Found {len(expired_records)} expired trial records to process")

        for i, record in enumerate(expired_records, 1):
            print(f"\nProcessing record {i}/{len(expired_records)}")
            print(f"Record ID: {record.id}")
            print(f"Doctor Name: {record.name}")
            print(f"Email: {record.email}")
            print(f"Trial End Date: {record.date_fin_essai}")

            if not record.medecin_id:
                print("⚠️ Warning: No associated medecin record found!")
                continue

            print("\nBefore changes:")
            print(f"  User active status: {record.medecin_id.user_id.active}")
            print(f"  Inscription suspended flag: {record.est_suspendu}")
            print(f"  Medecin suspended flag: {record.medecin_id.est_suspendu}")

            try:
                # Update records
                record.write({
                    'est_suspendu': True,
                    'statut': 'rejete'
                })
                record.medecin_id.write({
                    'est_suspendu': True,
                    'en_essai': False,
                    'date_suspension': datetime.now()
                })
                record.medecin_id.user_id.write({'active': False})

                print("\nAfter changes:")
                print(f"  User active status: {record.medecin_id.user_id.active}")
                print(f"  Inscription suspended flag: {record.est_suspendu}")
                print(f"  Medecin suspended flag: {record.medecin_id.est_suspendu}")

                # Send notification email
                print("\nSending suspension notice...")
                try:
                    base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
                    payment_url = f"{base_url}/medecin/upload/payment"

                    email_template = self.env.ref('dynamed.email_template_trial_expired')
                    if email_template:
                        # Send with specific mail server and context
                        email_template.with_context({
                            'default_mail_server_id': mail_server.id,
                            'doctor_name': record.name,
                            'trial_end_date': record.date_fin_essai.strftime('%Y-%m-%d'),
                        }).send_mail(record.id, force_send=True)

                        print(f"✅ Email sent to {record.email} using server {mail_server.name}")
                    else:
                        print("⚠️ Email template not found!")

                except Exception as e:
                    print(f"❌ Email sending failed: {str(e)}")
                    import traceback
                    traceback.print_exc()

            except Exception as e:
                print(f"❌ Error processing record {record.id}: {str(e)}")
                continue

        print("\n=== TRIAL EXPIRATION CHECK COMPLETE ===")
        return True

    def action_reject(self):
        self.write({'statut': 'rejete'})

    def open_medecin(self):
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'dynamed.medecin',
            'res_id': self.medecin_id.id,
            'view_mode': 'form',
            'target': 'current',
        }

    def action_create_medecin(self):
        for record in self:
            if not record.medecin_id and record.statut == 'approuve':
                # Ensure the email is provided and valid (used as login)
                if not record.email:
                    raise ValidationError("L'email est obligatoire pour créer un utilisateur.")

                # Ensure the name is provided
                if not record.name:
                    raise ValidationError("Le nom est obligatoire pour créer un utilisateur.")

                # Create a user for the Medecin
                user = self.env['res.users'].create({
                    'name': record.name,  # Mandatory field
                    'login': record.email,  # Mandatory field (must be unique)
                    'email': record.email,  # Optional but recommended
                    'phone': record.phone,  # Optional
                    'action_id': self.env.ref('dynamed.action_consultation').id,  # Set default home action

                    'groups_id': [
                        (6, 0, [
                            self.env.ref('base.group_user').id,  # Assign the internal user group
                            self.env.ref('dynamed.group_dynamed_medecin').id  # Assign the custom Medecin group
                        ])
                    ]
                })
                user.action_reset_password()

                # Create the Medecin record and link it to the user
                medecin = self.env['dynamed.medecin'].create({
                    'user_id': user.id,  # Link to the created user
                    'type_pratique': record.type_pratique,
                    'specialite_id': record.specialite_id.id,
                    'preuve_paiement': record.preuve_paiement,
                })

                # Update the InscriptionMedecin record
                record.write({'medecin_id': medecin.id, 'statut': 'medecin_cree'})