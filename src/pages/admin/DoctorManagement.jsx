import React, { useState } from 'react'
import { Search, UserCheck, UserX, Mail } from 'lucide-react'

const DoctorManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Sample doctor data
  const [doctors] = useState([
    {
      id: 1,
      name: 'Dr. Jean Dupont',
      email: 'jean.dupont@email.com',
      phone: '+33 1 23 45 67 89',
      specialite: 'Médecine Générale',
      type_pratique: 'prive',
      status: 'active',
      trial_end: null,
      registration_date: '2024-01-15'
    },
    {
      id: 2,
      name: 'Dr. Marie Martin',
      email: 'marie.martin@email.com',
      phone: '+33 1 98 76 54 32',
      specialite: 'Cardiologie',
      type_pratique: 'public',
      status: 'trial',
      trial_end: '2024-02-15',
      registration_date: '2024-01-12'
    },
    {
      id: 3,
      name: 'Dr. Pierre Durand',
      email: 'pierre.durand@email.com',
      phone: '+33 1 11 22 33 44',
      specialite: 'Pédiatrie',
      type_pratique: 'prive',
      status: 'suspended',
      trial_end: '2024-01-10',
      registration_date: '2024-01-08'
    }
  ])

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || doctor.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-blue-100 text-blue-800'
    }
    
    const labels = {
      active: 'Actif',
      trial: 'Essai',
      suspended: 'Suspendu',
      pending: 'En attente'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Médecins</h1>
        <p className="text-gray-600">Gérez les comptes médecins et les inscriptions</p>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher un médecin..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-input"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="trial">En essai</option>
              <option value="suspended">Suspendus</option>
              <option value="pending">En attente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Médecins Actifs</p>
              <p className="text-2xl font-bold text-gray-900">
                {doctors.filter(d => d.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Essai</p>
              <p className="text-2xl font-bold text-gray-900">
                {doctors.filter(d => d.status === 'trial').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-lg">
              <UserX className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suspendus</p>
              <p className="text-2xl font-bold text-gray-900">
                {doctors.filter(d => d.status === 'suspended').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {doctors.filter(d => d.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Médecin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spécialité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fin d'essai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDoctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                      <div className="text-sm text-gray-500">{doctor.email}</div>
                      <div className="text-sm text-gray-500">{doctor.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doctor.specialite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doctor.type_pratique === 'prive' ? 'Privé' : 'Public'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(doctor.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doctor.trial_end || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {doctor.status === 'trial' && (
                        <button className="btn btn-success px-3 py-1 text-xs">
                          Activer
                        </button>
                      )}
                      {doctor.status === 'suspended' && (
                        <button className="btn btn-primary px-3 py-1 text-xs">
                          Réactiver
                        </button>
                      )}
                      {doctor.status === 'active' && (
                        <button className="btn btn-danger px-3 py-1 text-xs">
                          Suspendre
                        </button>
                      )}
                      <button className="text-primary-600 hover:text-primary-900 text-xs">
                        Détails
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun médecin trouvé</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorManagement