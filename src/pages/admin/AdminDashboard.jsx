import React from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { Upload, Users, FileText, Database } from 'lucide-react'

const AdminDashboard = () => {
  const { patients, consultations, prescriptions, molecules } = useData()

  const stats = [
    {
      name: 'Total Patients',
      value: patients.length,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Total Consultations',
      value: consultations.length,
      icon: FileText,
      color: 'bg-green-500'
    },
    {
      name: 'Total Ordonnances',
      value: prescriptions.length,
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      name: 'Molécules en Base',
      value: molecules.length,
      icon: Database,
      color: 'bg-orange-500'
    }
  ]

  const quickActions = [
    {
      title: 'Import de Données',
      description: 'Importer des fichiers CSV pour alimenter la base de données',
      icon: Upload,
      link: '/admin/import',
      color: 'bg-blue-500'
    },
    {
      title: 'Gestion des Médecins',
      description: 'Gérer les comptes médecins et les inscriptions',
      icon: Users,
      link: '/admin/doctors',
      color: 'bg-green-500'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-600">Tableau de bord administrateur</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className="card p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start">
                <div className={`${action.color} p-3 rounded-lg`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard