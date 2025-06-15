from odoo import models, fields, api
from datetime import datetime, timedelta


class DynamedDashboard(models.Model):
    _name = 'dynamed.dashboard'
    _description = 'Tableau de bord Dynamed'

    def get_doctor_count(self):
        # Nombre de médecins avec user actif
        return self.env['dynamed.medecin'].search_count([('user_id.active', '=', True)])

    def get_clinic_count(self):
        # Nombre total de cliniques
        return self.env['dynamed.clinique'].search_count([])

    def get_patient_count(self):
        # Nombre total de patients
        return self.env['dynamed.patient'].search_count([])

    def get_today_consultations(self):
        # Consultations aujourd'hui
        today = datetime.now().date()
        return self.env['dynamed.consultation'].search_count([
            ('create_date', '>=', today.strftime('%Y-%m-%d 00:00:00')),
            ('create_date', '<=', today.strftime('%Y-%m-%d 23:59:59'))
        ])

    def get_week_consultations(self):
        # Consultations cette semaine
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        return self.env['dynamed.consultation'].search_count([
            ('create_date', '>=', week_start.strftime('%Y-%m-%d 00:00:00')),
            ('create_date', '<=', week_end.strftime('%Y-%m-%d 23:59:59'))
        ])

    def get_month_consultations(self):
        # Consultations ce mois
        today = datetime.now().date()
        month_start = today.replace(day=1)
        next_month = month_start.replace(
            month=month_start.month + 1) if month_start.month < 12 else month_start.replace(year=month_start.year + 1,
                                                                                            month=1)
        month_end = next_month - timedelta(days=1)
        return self.env['dynamed.consultation'].search_count([
            ('create_date', '>=', month_start.strftime('%Y-%m-%d 00:00:00')),
            ('create_date', '<=', month_end.strftime('%Y-%m-%d 23:59:59'))
        ])

    def get_year_consultations(self):
        # Consultations cette année
        today = datetime.now().date()
        year_start = today.replace(month=1, day=1)
        year_end = today.replace(month=12, day=31)
        return self.env['dynamed.consultation'].search_count([
            ('create_date', '>=', year_start.strftime('%Y-%m-%d 00:00:00')),
            ('create_date', '<=', year_end.strftime('%Y-%m-%d 23:59:59'))
        ])

    def get_last_12_months_consultations(self):
        # Statistiques des 12 derniers mois
        result = []
        today = datetime.now().date()

        for i in range(11, -1, -1):
            month = today.month - i
            year = today.year
            if month <= 0:
                month += 12
                year -= 1

            month_start = datetime(year, month, 1)
            next_month = month_start.replace(
                month=month_start.month + 1) if month_start.month < 12 else month_start.replace(
                year=month_start.year + 1, month=1)
            month_end = next_month - timedelta(days=1)

            count = self.env['dynamed.consultation'].search_count([
                ('create_date', '>=', month_start.strftime('%Y-%m-%d 00:00:00')),
                ('create_date', '<=', month_end.strftime('%Y-%m-%d 23:59:59'))
            ])

            result.append({
                'month': month_start.strftime('%b %Y'),
                'count': count
            })

        return result

    @api.model
    def get_dashboard_data(self):
        return {
            'doctor_count': self.get_doctor_count(),
            'clinic_count': self.get_clinic_count(),
            'patient_count': self.get_patient_count(),
            'today_consultations': self.get_today_consultations(),
            'week_consultations': self.get_week_consultations(),
            'month_consultations': self.get_month_consultations(),
            'year_consultations': self.get_year_consultations(),
            'last_12_months': self.get_last_12_months_consultations(),
        }