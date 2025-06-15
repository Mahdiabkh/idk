import React, { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { Plus, Search, Edit, Eye } from 'lucide-react'
import PatientModal from '../components/PatientModal'
import toast from 'react-hot-toast'

const Patients = () => {
  const { patients, addPatient, updatePatient } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddPatient = (patientData) => {
    try {
      addPatient(patientData)
      setShowModal(false)
      toast.success('Patient ajouté avec succès')
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du patient')
    }
  }

  const handleEditPatient = (patientData) => {
    try {
      updatePatient(editingPatient.id, patientData)
      setEditingPatient(null)
      setShowModal(false)
      toast.success('Patient modifié avec succès')
    } catch (error) {
      toast.error('Erreur lors de la modification du patient')
    }
  }

  const openEditModal = (patient) => {
    setEditingPatient(patient)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">Gérez vos patients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary px-4 py-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Patient
        </button>
      </div>

      <div className="card p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Âge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sexe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {patient.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.age} ans
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.sexe === 'homme' ? 'Homme' : 'Femme'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(patient)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun patient trouvé</p>
          </div>
        )}
      </div>

      {showModal && (
        <PatientModal
          patient={editingPatient}
          onSave={editingPatient ? handleEditPatient : handleAddPatient}
          onClose={() => {
            setShowModal(false)
            setEditingPatient(null)
          }}
        />
      )}
    </div>
  )
}

export default Patients