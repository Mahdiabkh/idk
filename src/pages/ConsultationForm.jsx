import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import Select from 'react-select'
import toast from 'react-hot-toast'

const ConsultationForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const {
    patients,
    consultations,
    diagnostics,
    allergies,
    indications,
    precautions,
    antecedentsMedicaux,
    addConsultation,
    updateConsultation,
    addPatient
  } = useData()

  const [formData, setFormData] = useState({
    patient_id: '',
    type_patient: 'adulte',
    femme_enceinte: false,
    femme_allaitante: false,
    diagnostics_ids: [],
    indications_ids: [],
    allergies_ids: [],
    antecedents_medicaux_ids: [],
    precaution_ids: []
  })

  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    sexe: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    if (id) {
      const consultation = consultations.find(c => c.id === parseInt(id))
      if (consultation) {
        setFormData(consultation)
      }
    }
  }, [id, consultations])

  const handleSubmit = (e) => {
    e.preventDefault()
    try {
      const consultationData = {
        ...formData,
        medecin_id: user.id
      }

      if (id) {
        updateConsultation(parseInt(id), consultationData)
        toast.success('Consultation modifiée avec succès')
      } else {
        const newConsultation = addConsultation(consultationData)
        toast.success('Consultation créée avec succès')
        navigate(`/consultations/${newConsultation.id}/prescription`)
        return
      }
      navigate('/consultations')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleNewPatient = (e) => {
    e.preventDefault()
    try {
      const patient = addPatient({
        ...newPatient,
        age: parseInt(newPatient.age)
      })
      setFormData({ ...formData, patient_id: patient.id })
      setShowNewPatientForm(false)
      setNewPatient({ name: '', age: '', sexe: '', phone: '', email: '' })
      toast.success('Patient créé avec succès')
    } catch (error) {
      toast.error('Erreur lors de la création du patient')
    }
  }

  const patientOptions = patients.map(p => ({
    value: p.id,
    label: `${p.name} (${p.age} ans, ${p.sexe})`
  }))

  const diagnosticOptions = diagnostics.map(d => ({
    value: d.id,
    label: d.name
  }))

  const allergyOptions = allergies.map(a => ({
    value: a.id,
    label: a.name
  }))

  const indicationOptions = indications.map(i => ({
    value: i.id,
    label: i.name
  }))

  const precautionOptions = precautions.map(p => ({
    value: p.id,
    label: p.name
  }))

  const antecedentOptions = antecedentsMedicaux.map(a => ({
    value: a.id,
    label: a.name
  }))

  const selectedPatient = patients.find(p => p.id === formData.patient_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Modifier Consultation' : 'Nouvelle Consultation'}
        </h1>
        <p className="text-gray-600">
          {id ? 'Modifiez les informations de la consultation' : 'Créez une nouvelle consultation'}
        </p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="form-label">Patient *</label>
            <div className="flex space-x-2 mt-1">
              <div className="flex-1">
                <Select
                  options={patientOptions}
                  value={patientOptions.find(p => p.value === formData.patient_id)}
                  onChange={(option) => setFormData({ ...formData, patient_id: option?.value || '' })}
                  placeholder="Sélectionner un patient..."
                  isClearable
                />
              </div>
              <button
                type="button"
                onClick={() => setShowNewPatientForm(true)}
                className="btn btn-secondary px-4 py-2"
              >
                Nouveau Patient
              </button>
            </div>
          </div>

          {/* Patient Info Display */}
          {selectedPatient && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Informations Patient</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nom:</span> {selectedPatient.name}
                </div>
                <div>
                  <span className="text-gray-600">Âge:</span> {selectedPatient.age} ans
                </div>
                <div>
                  <span className="text-gray-600">Sexe:</span> {selectedPatient.sexe}
                </div>
                <div>
                  <span className="text-gray-600">Téléphone:</span> {selectedPatient.phone || '-'}
                </div>
              </div>
            </div>
          )}

          {/* Patient Type */}
          <div>
            <label className="form-label">Type de patient *</label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type_patient"
                  value="adulte"
                  checked={formData.type_patient === 'adulte'}
                  onChange={(e) => setFormData({ ...formData, type_patient: e.target.value })}
                  className="mr-2"
                />
                Adulte
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type_patient"
                  value="enfant"
                  checked={formData.type_patient === 'enfant'}
                  onChange={(e) => setFormData({ ...formData, type_patient: e.target.value })}
                  className="mr-2"
                />
                Enfant
              </label>
            </div>
          </div>

          {/* Special Conditions for Women */}
          {selectedPatient?.sexe === 'femme' && (
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.femme_enceinte}
                  onChange={(e) => setFormData({ ...formData, femme_enceinte: e.target.checked })}
                  className="mr-2"
                />
                Enceinte
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.femme_allaitante}
                  onChange={(e) => setFormData({ ...formData, femme_allaitante: e.target.checked })}
                  className="mr-2"
                />
                Allaitante
              </label>
            </div>
          )}

          {/* Diagnostique (renamed from Diagnostics) */}
          <div>
            <label className="form-label">Diagnostique</label>
            <Select
              isMulti
              options={diagnosticOptions}
              value={diagnosticOptions.filter(d => formData.diagnostics_ids?.includes(d.value))}
              onChange={(options) => setFormData({
                ...formData,
                diagnostics_ids: options ? options.map(o => o.value) : []
              })}
              placeholder="Sélectionner des diagnostiques..."
              className="mt-1"
              noOptionsMessage={() => diagnostics.length === 0 ? "Aucun diagnostic disponible. Veuillez d'abord importer les données des molécules." : "Aucune option trouvée"}
            />
            {diagnostics.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">
                Les diagnostiques seront disponibles après l'import des données des molécules.
              </p>
            )}
          </div>

          {/* Indications */}
          <div>
            <label className="form-label">Indications</label>
            <Select
              isMulti
              options={indicationOptions}
              value={indicationOptions.filter(i => formData.indications_ids?.includes(i.value))}
              onChange={(options) => setFormData({
                ...formData,
                indications_ids: options ? options.map(o => o.value) : []
              })}
              placeholder="Sélectionner des indications..."
              className="mt-1"
              noOptionsMessage={() => indications.length === 0 ? "Aucune indication disponible. Veuillez d'abord importer les données des molécules." : "Aucune option trouvée"}
            />
            {indications.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">
                Les indications seront disponibles après l'import des données des molécules.
              </p>
            )}
          </div>

          {/* Allergies */}
          <div>
            <label className="form-label">Allergies</label>
            <Select
              isMulti
              options={allergyOptions}
              value={allergyOptions.filter(a => formData.allergies_ids?.includes(a.value))}
              onChange={(options) => setFormData({
                ...formData,
                allergies_ids: options ? options.map(o => o.value) : []
              })}
              placeholder="Sélectionner des allergies..."
              className="mt-1"
              noOptionsMessage={() => allergies.length === 0 ? "Aucune allergie disponible. Veuillez d'abord importer les données des molécules." : "Aucune option trouvée"}
            />
            {allergies.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">
                Les allergies seront disponibles après l'import des données des molécules.
              </p>
            )}
          </div>

          {/* Antécédents médicaux */}
          <div>
            <label className="form-label">Antécédents médicaux</label>
            <Select
              isMulti
              options={antecedentOptions}
              value={antecedentOptions.filter(a => formData.antecedents_medicaux_ids?.includes(a.value))}
              onChange={(options) => setFormData({
                ...formData,
                antecedents_medicaux_ids: options ? options.map(o => o.value) : []
              })}
              placeholder="Sélectionner des antécédents médicaux..."
              className="mt-1"
              noOptionsMessage={() => antecedentsMedicaux.length === 0 ? "Aucun antécédent médical disponible. Veuillez d'abord importer les données des molécules." : "Aucune option trouvée"}
            />
            {antecedentsMedicaux.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">
                Les antécédents médicaux seront disponibles après l'import des données des molécules.
              </p>
            )}
          </div>

          {/* Precautions */}
          <div>
            <label className="form-label">Précautions</label>
            <Select
              isMulti
              options={precautionOptions}
              value={precautionOptions.filter(p => formData.precaution_ids?.includes(p.value))}
              onChange={(options) => setFormData({
                ...formData,
                precaution_ids: options ? options.map(o => o.value) : []
              })}
              placeholder="Sélectionner des précautions..."
              className="mt-1"
              noOptionsMessage={() => precautions.length === 0 ? "Aucune précaution disponible. Veuillez d'abord importer les données des molécules." : "Aucune option trouvée"}
            />
            {precautions.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">
                Les précautions seront disponibles après l'import des données des molécules.
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/consultations')}
              className="btn btn-secondary px-4 py-2"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary px-4 py-2"
            >
              {id ? 'Modifier' : 'Créer et Générer Ordonnance'}
            </button>
          </div>
        </form>
      </div>

      {/* New Patient Modal */}
      {showNewPatientForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Nouveau Patient</h2>
            <form onSubmit={handleNewPatient} className="space-y-4">
              <div>
                <label className="form-label">Nom complet *</label>
                <input
                  type="text"
                  required
                  className="form-input mt-1"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Âge *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  className="form-input mt-1"
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Sexe *</label>
                <select
                  required
                  className="form-input mt-1"
                  value={newPatient.sexe}
                  onChange={(e) => setNewPatient({ ...newPatient, sexe: e.target.value })}
                >
                  <option value="">Sélectionner</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </select>
              </div>
              <div>
                <label className="form-label">Téléphone</label>
                <input
                  type="tel"
                  className="form-input mt-1"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input mt-1"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewPatientForm(false)}
                  className="btn btn-secondary px-4 py-2"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4 py-2"
                >
                  Créer Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConsultationForm