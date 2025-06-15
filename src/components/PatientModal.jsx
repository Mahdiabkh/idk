import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const PatientModal = ({ patient, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    sexe: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    if (patient) {
      setFormData(patient)
    }
  }, [patient])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      age: parseInt(formData.age)
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {patient ? 'Modifier Patient' : 'Nouveau Patient'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Nom complet *</label>
            <input
              type="text"
              name="name"
              required
              className="form-input mt-1"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="form-label">Âge *</label>
            <input
              type="number"
              name="age"
              required
              min="0"
              max="120"
              className="form-input mt-1"
              value={formData.age}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="form-label">Sexe *</label>
            <select
              name="sexe"
              required
              className="form-input mt-1"
              value={formData.sexe}
              onChange={handleChange}
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
              name="phone"
              className="form-input mt-1"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input mt-1"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary px-4 py-2"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary px-4 py-2"
            >
              {patient ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PatientModal