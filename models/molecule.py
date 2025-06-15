from odoo import models, fields


class Molecule(models.Model):
    _name = 'dynamed.molecule'
    _description = 'Molécule médicamenteuse'

    name = fields.Char(string="Nom de la molécule", required=True)
    grossesse = fields.Boolean(string="Grossesse")
    allaitement = fields.Boolean(string="Allaitement")
    effet_majeurs = fields.Text(string="Effets majeurs")

    # Relations avec les autres modèles
    allergies_ids = fields.Many2many('dynamed.allergies', string="Allergies")
    antecedents_medicaux_ids = fields.Many2many('dynamed.antecedents_medicaux', string="Antécédents médicaux")
    medicaments_actuels_ids = fields.Many2many('dynamed.medicaments_actuels', string="Médicaments actuels")
    categories_age_id = fields.Many2one('dynamed.age.category', string="Catégorie d'âge")
    indications_ids = fields.Many2many('dynamed.indications', string="Indications")
    classes_medicales_ids = fields.Many2many('dynamed.classe.medicale', string="Classes médicales")
    nom_commercial_ids = fields.One2many('nom.commercial', 'molecule_id', string='Noms Commerciaux')
    precaution_ids = fields.Many2many(
        'dynamed.precaution',
        string='Précautions',
        help='Liste des précautions associées à cette molécule'
    )