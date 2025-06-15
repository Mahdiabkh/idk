from odoo import http
from odoo.http import request
from datetime import datetime, timedelta


class DynamedDashboard(http.Controller):

    @http.route('/dynamed/consultation_stats', type='json', auth='user')
    def consultation_stats(self):
        # Last 6 months data
        months = []
        values = []

        for i in range(6):
            date = datetime.now() - timedelta(days=30 * (5 - i))
            month = date.strftime('%b %Y')
            count = request.env['dynamed.consultation'].search_count([
                ('date', '>=', date.replace(day=1)),
                ('date', '<', (date.replace(day=1) + timedelta(days=32)).replace(day=1))
            ])
            months.append(month)
            values.append(count)

        return {
            'months': months,
            'values': values,
        }