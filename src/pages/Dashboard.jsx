import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { Users, FileText, Stethoscope, Calendar } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const { patients, consultations, prescriptions } = useData()

  const stats = [
    {
      name: 'Patients',
      value: patients.length,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Consultations',
      value: consultations.length,
      icon: Stethoscope,
      color: 'bg-green-500'
    },
    {
      name: 'Ordonnances',
      value: prescriptions.length,
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      name: 'Aujourd\'hui',
      value: consultations.filter(c => 
        c.date_consultation === new Date().toISOString().split('T')[0]
      ).length,
      icon: Calendar,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user?.name}
        </h1>
        <p className="text-gray-600">
          Voici un aperçu de votre activité
        </p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Consultations récentes
          </h3>
          <div className="space-y-3">
            {consultations.slice(0, 5).map((consultation) => {
              const patient = patients.find(p => p.id === consultation.patient_id)
              return (
                <div key={consultation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{patient?.name}</p>
                    <p className="text-sm text-gray-600">{consultation.date_consultation}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {consultation.type_patient}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Ordonnances récentes
          </h3>
          <div className="space-y-3">
            {prescriptions.slice(0, 5).map((prescription) => {
              const consultation = consultations.find(c => c.id === prescription.consultation_id)
              const patient = patients.find(p => p.id === consultation?.patient_id)
              return (
                <div key={prescription.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{prescription.name}</p>
                    <p className="text-sm text-gray-600">{patient?.name}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {prescription.molecule_line_ids?.length || 0} médicaments
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard