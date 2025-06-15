import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { Printer, Plus, Trash2, AlertTriangle, Info } from 'lucide-react'
import Select from 'react-select'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

const PrescriptionForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    consultations,
    patients,
    scoreMolecules,
    commercialNames,
    addPrescription,
    interactions
  } = useData()

  const [consultation, setConsultation] = useState(null)
  const [patient, setPatient] = useState(null)
  const [recommendedMolecules, setRecommendedMolecules] = useState([])
  const [selectedMolecules, setSelectedMolecules] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAlgorithmInfo, setShowAlgorithmInfo] = useState(false)

  useEffect(() => {
    if (id) {
      const consultationData = consultations.find(c => c.id === parseInt(id))
      if (consultationData) {
        setConsultation(consultationData)
        const patientData = patients.find(p => p.id === consultationData.patient_id)
        setPatient(patientData)
        
        // Generate molecule recommendations using enhanced algorithm
        const scored = scoreMolecules(consultationData)
        setRecommendedMolecules(scored)
      }
    }
  }, [id, consultations, patients, scoreMolecules])

  const addMolecule = (molecule) => {
    // Check for interactions
    const hasInteraction = selectedMolecules.some(selected => {
      return interactions.some(interaction => 
        (interaction.medicament_1_name === molecule.name && 
         interaction.medicament_2_names.includes(selected.molecule_name)) ||
        (interaction.medicament_2_names.includes(molecule.name) && 
         interaction.medicament_1_name === selected.molecule_name)
      )
    })

    if (hasInteraction) {
      toast.error('⚠️ Interaction médicamenteuse détectée!')
      return
    }

    const newMolecule = {
      id: Date.now(),
      molecule_id: molecule.id,
      molecule_name: molecule.name,
      commercial_name_id: molecule.commercial_names[0]?.id || null,
      commercial_name: molecule.commercial_names[0]?.name || '',
      dosage: molecule.commercial_names[0]?.dosage || '',
      forme: molecule.commercial_names[0]?.forme_pharmaceutique || '',
      conditionnement: molecule.commercial_names[0]?.conditionnement || '',
      frequency: '1 fois par jour',
      duration: '7 jours'
    }

    setSelectedMolecules([...selectedMolecules, newMolecule])
  }

  const removeMolecule = (id) => {
    setSelectedMolecules(selectedMolecules.filter(m => m.id !== id))
  }

  const updateMolecule = (id, field, value) => {
    setSelectedMolecules(selectedMolecules.map(m => {
      if (m.id === id) {
        if (field === 'commercial_name_id') {
          const commercial = commercialNames.find(c => c.id === value)
          return {
            ...m,
            commercial_name_id: value,
            commercial_name: commercial?.name || '',
            dosage: commercial?.dosage || '',
            forme: commercial?.forme_pharmaceutique || '',
            conditionnement: commercial?.conditionnement || ''
          }
        }
        return { ...m, [field]: value }
      }
      return m
    }))
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('ORDONNANCE MÉDICALE', 20, 30)
    
    // Doctor info
    doc.setFontSize(12)
    doc.text('Informations du Médecin:', 20, 50)
    doc.text(`Dr. ${user.name}`, 20, 60)
    doc.text(`Spécialité: ${user.specialite}`, 20, 70)
    doc.text(`Téléphone: ${user.phone}`, 20, 80)
    doc.text(`Email: ${user.email}`, 20, 90)
    
    // Patient info
    doc.text('Informations du Patient:', 20, 110)
    doc.text(`Nom: ${patient?.name}`, 20, 120)
    doc.text(`Âge: ${patient?.age} ans`, 20, 130)
    doc.text(`Sexe: ${patient?.sexe}`, 20, 140)
    
    // Medications
    doc.text('Médicaments prescrits:', 20, 160)
    let yPos = 170
    
    selectedMolecules.forEach((med, index) => {
      doc.text(`${index + 1}. ${med.commercial_name || med.molecule_name}`, 25, yPos)
      doc.text(`   Dosage: ${med.dosage}`, 25, yPos + 10)
      doc.text(`   Forme: ${med.forme}`, 25, yPos + 20)
      doc.text(`   Fréquence: ${med.frequency}`, 25, yPos + 30)
      doc.text(`   Durée: ${med.duration}`, 25, yPos + 40)
      yPos += 55
    })
    
    // Footer
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPos + 20)
    doc.text('Signature du médecin: ___________________', 20, yPos + 40)
    
    doc.save(`ordonnance-${patient?.name}-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const savePrescription = () => {
    setLoading(true)
    try {
      const prescription = {
        consultation_id: consultation.id,
        medecin_id: user.id,
        patient_id: patient.id,
        molecule_line_ids: selectedMolecules
      }
      
      addPrescription(prescription)
      toast.success('Ordonnance sauvegardée avec succès')
      navigate('/prescriptions')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  if (!consultation || !patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Génération d'Ordonnance</h1>
          <p className="text-gray-600">Patient: {patient.name}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAlgorithmInfo(!showAlgorithmInfo)}
            className="btn btn-secondary px-4 py-2"
          >
            <Info className="h-4 w-4 mr-2" />
            Algorithme
          </button>
          <button
            onClick={generatePDF}
            disabled={selectedMolecules.length === 0}
            className="btn btn-success px-4 py-2"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimer PDF
          </button>
          <button
            onClick={savePrescription}
            disabled={selectedMolecules.length === 0 || loading}
            className="btn btn-primary px-4 py-2"
          >
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Algorithm Information */}
      {showAlgorithmInfo && (
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Algorithme de Recommandation</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>Étape 1:</strong> Sélection des classes thérapeutiques basées sur les diagnostics
            </div>
            <div>
              <strong>Étape 2:</strong> Filtrage des molécules appartenant à ces classes
            </div>
            <div>
              <strong>Étape 3:</strong> Scoring des molécules:
              <ul className="ml-4 mt-1 space-y-1">
                <li>• +2 points si l'indication correspond au diagnostic</li>
                <li>• -1 point pour chaque précaution applicable</li>
                <li>• Exclusion si allergie, antécédent contre-indiqué, ou grossesse/allaitement non sûr</li>
              </ul>
            </div>
            <div>
              <strong>Étape 4:</strong> Sélection d'une molécule par classe thérapeutique (score le plus élevé)
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Molecules */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Médicaments Recommandés ({recommendedMolecules.length})
          </h2>
          
          {recommendedMolecules.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-500">
                Aucun médicament recommandé pour cette consultation.
                Veuillez vérifier les diagnostics et indications.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedMolecules.map((molecule) => (
                <div key={molecule.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{molecule.name}</h3>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Score: {molecule.score}
                        </span>
                      </div>
                      
                      {molecule.indications && (
                        <p className="text-sm text-blue-600 mb-1">
                          <strong>Indications:</strong> {molecule.indications}
                        </p>
                      )}
                      
                      {molecule.medical_classes && (
                        <p className="text-sm text-purple-600 mb-1">
                          <strong>Classes:</strong> {molecule.medical_classes}
                        </p>
                      )}
                      
                      {molecule.commercial_names.length > 0 && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Noms commerciaux:</strong> {molecule.commercial_names.map(c => c.name).join(', ')}
                        </p>
                      )}
                      
                      {molecule.precautions && (
                        <p className="text-sm text-orange-600 mb-1">
                          <strong>Précautions:</strong> {molecule.precautions}
                        </p>
                      )}
                      
                      {molecule.effet_majeurs && (
                        <p className="text-xs text-red-600 mt-1">
                          <strong>Effets secondaires:</strong> {molecule.effet_majeurs}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => addMolecule(molecule)}
                      className="btn btn-primary px-3 py-1 text-sm ml-4"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Molecules */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Ordonnance ({selectedMolecules.length} médicament{selectedMolecules.length !== 1 ? 's' : ''})
          </h2>
          
          {selectedMolecules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Aucun médicament sélectionné
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedMolecules.map((med) => {
                const availableCommercialNames = commercialNames.filter(c => c.molecule_id === med.molecule_id)
                
                return (
                  <div key={med.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-gray-900">{med.molecule_name}</h3>
                      <button
                        onClick={() => removeMolecule(med.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="form-label text-xs">Nom commercial</label>
                        <Select
                          options={availableCommercialNames.map(c => ({
                            value: c.id,
                            label: `${c.name} - ${c.dosage} - ${c.forme_pharmaceutique}`
                          }))}
                          value={availableCommercialNames.find(c => c.id === med.commercial_name_id) ? {
                            value: med.commercial_name_id,
                            label: `${med.commercial_name} - ${med.dosage} - ${med.forme}`
                          } : null}
                          onChange={(option) => updateMolecule(med.id, 'commercial_name_id', option?.value)}
                          placeholder="Sélectionner..."
                          className="text-sm"
                        />
                      </div>
                      
                      {med.commercial_name && (
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <div><strong>Dosage:</strong> {med.dosage}</div>
                          <div><strong>Forme:</strong> {med.forme}</div>
                          <div><strong>Conditionnement:</strong> {med.conditionnement}</div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="form-label text-xs">Fréquence</label>
                          <select
                            value={med.frequency}
                            onChange={(e) => updateMolecule(med.id, 'frequency', e.target.value)}
                            className="form-input text-sm"
                          >
                            <option value="1 fois par jour">1 fois par jour</option>
                            <option value="2 fois par jour">2 fois par jour</option>
                            <option value="3 fois par jour">3 fois par jour</option>
                            <option value="Au besoin">Au besoin</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="form-label text-xs">Durée</label>
                          <select
                            value={med.duration}
                            onChange={(e) => updateMolecule(med.id, 'duration', e.target.value)}
                            className="form-input text-sm"
                          >
                            <option value="3 jours">3 jours</option>
                            <option value="7 jours">7 jours</option>
                            <option value="14 jours">14 jours</option>
                            <option value="1 mois">1 mois</option>
                            <option value="3 mois">3 mois</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PrescriptionForm