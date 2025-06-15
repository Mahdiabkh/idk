import React, { createContext, useContext, useState, useEffect } from 'react'

const DataContext = createContext()

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  // Initialize with empty arrays instead of sample data
  const [patients, setPatients] = useState([])
  const [consultations, setConsultations] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [molecules, setMolecules] = useState([])
  const [diagnostics, setDiagnostics] = useState([])
  const [allergies, setAllergies] = useState([])
  const [indications, setIndications] = useState([])
  const [precautions, setPrecautions] = useState([])
  const [commercialNames, setCommercialNames] = useState([])
  const [interactions, setInteractions] = useState([])
  const [medicalClasses, setMedicalClasses] = useState([])
  const [antecedentsMedicaux, setAntecedentsMedicaux] = useState([])

  // Extract unique values from molecules dataset
  const getUniqueValuesFromMolecules = (field) => {
    const allValues = molecules.flatMap(molecule => {
      const values = molecule[field]
      if (Array.isArray(values)) {
        return values
      } else if (typeof values === 'string') {
        return values.split(',').map(v => v.trim()).filter(v => v)
      }
      return []
    })
    
    // Remove duplicates and create objects with id and name
    const uniqueValues = [...new Set(allValues)]
    return uniqueValues.map((value, index) => ({
      id: `${field}_${index}`,
      name: value
    }))
  }

  // Update derived data when molecules change
  useEffect(() => {
    if (molecules.length > 0) {
      

      // Extract unique allergies from molecules
      const uniqueAllergies = getUniqueValuesFromMolecules('allergies_ids')
      if (uniqueAllergies.length > 0 && allergies.length === 0) {
        setAllergies(uniqueAllergies)
      }

      // Extract unique indications from molecules
      const uniqueIndications = getUniqueValuesFromMolecules('indications_ids')
      if (uniqueIndications.length > 0 && indications.length === 0) {
        setIndications(uniqueIndications)
      }

      // Extract unique antecedents medicaux from molecules
      const uniqueAntecedents = getUniqueValuesFromMolecules('antecedents_medicaux_ids')
      if (uniqueAntecedents.length > 0 && antecedentsMedicaux.length === 0) {
        setAntecedentsMedicaux(uniqueAntecedents)
      }

     

      // Extract unique medical classes from molecules
      const uniqueMedicalClasses = getUniqueValuesFromMolecules('classes_medicales_ids')
      if (uniqueMedicalClasses.length > 0 && medicalClasses.length === 0) {
        setMedicalClasses(uniqueMedicalClasses)
      }
    }
  }, [molecules])

  // Patient management
  const addPatient = (patient) => {
    const newPatient = {
      ...patient,
      id: Date.now()
    }
    setPatients(prev => [...prev, newPatient])
    return newPatient
  }

  const updatePatient = (id, updates) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  // Consultation management
  const addConsultation = (consultation) => {
    const newConsultation = {
      ...consultation,
      id: Date.now(),
      date_consultation: new Date().toISOString().split('T')[0]
    }
    setConsultations(prev => [...prev, newConsultation])
    return newConsultation
  }

  const updateConsultation = (id, updates) => {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  // Prescription management
  const addPrescription = (prescription) => {
    const newPrescription = {
      ...prescription,
      id: Date.now(),
      name: `ORD-${Date.now()}`
    }
    setPrescriptions(prev => [...prev, newPrescription])
    return newPrescription
  }

  // Enhanced molecule scoring algorithm
  const scoreMolecules = (consultationData) => {
    const {
      diagnostics_ids = [],
      indications_ids = [],
      allergies_ids = [],
      antecedents_medicaux_ids = [],
      medicament_actuels_ids = [],
      precaution_ids = [],
      femme_enceinte = false,
      femme_allaitante = false
    } = consultationData

    // Step 1: Get medical classes from selected diagnostics
    const selectedDiagnostics = diagnostics.filter(d => diagnostics_ids.includes(d.id))
    const relevantClassIds = selectedDiagnostics.flatMap(d => d.classe_medicale_ids || [])
    
    if (relevantClassIds.length === 0) {
      return []
    }

    // Step 2: Get molecules belonging to these medical classes
    const relevantMolecules = molecules.filter(molecule => 
      molecule.classes_medicales_ids?.some(classId => relevantClassIds.includes(classId))
    )

    const scoredMolecules = []

    // Step 3: Score each molecule
    relevantMolecules.forEach(molecule => {
      let score = 0
      let excluded = false

      // Check contraindications (exclusion criteria)
      // Allergies
      if (molecule.allergies_ids?.some(allergyId => allergies_ids.includes(allergyId))) {
        excluded = true
      }

      // Antecedents in contraindications
      if (molecule.antecedents_medicaux_ids?.some(antId => antecedents_medicaux_ids.includes(antId))) {
        excluded = true
      }

      // Current medications contraindications
      if (molecule.medicaments_actuels_ids?.some(medId => medicament_actuels_ids.includes(medId))) {
        excluded = true
      }

      // Pregnancy contraindication
      if (femme_enceinte && molecule.grossesse) {
        excluded = true
      }

      // Breastfeeding contraindication
      if (femme_allaitante && molecule.allaitement) {
        excluded = true
      }

      // If excluded, skip this molecule
      if (excluded) {
        return
      }

      // Step 4: Calculate score for non-excluded molecules
      // +2 for matching indications
      if (molecule.indications_ids?.some(indId => indications_ids.includes(indId))) {
        score += 2
      }

      // -1 for precautions
      if (molecule.precaution_ids?.some(precId => precaution_ids.includes(precId))) {
        score -= 1
      }

      // Only include molecules with positive score
      if (score > 0) {
        // Get commercial names for this molecule
        const moleculeCommercialNames = commercialNames.filter(cn => cn.molecule_id === molecule.id)
        
        scoredMolecules.push({
          ...molecule,
          score,
          commercial_names: moleculeCommercialNames,
          indications: molecule.indications_ids?.map(id => 
            indications.find(ind => ind.id === id)?.name
          ).filter(Boolean).join(', ') || '',
          precautions: molecule.precaution_ids?.map(id => 
            precautions.find(prec => prec.id === id)?.name
          ).filter(Boolean).join(', ') || '',
          medical_classes: molecule.classes_medicales_ids?.map(id => 
            medicalClasses.find(mc => mc.id === id)?.name
          ).filter(Boolean).join(', ') || ''
        })
      }
    })

    // Step 5: Sort by score (highest first) and return
    return scoredMolecules.sort((a, b) => b.score - a.score)
  }

  const value = {
    patients,
    consultations,
    prescriptions,
    molecules,
    diagnostics,
    allergies,
    indications,
    precautions,
    commercialNames,
    interactions,
    medicalClasses,
    antecedentsMedicaux,
    addPatient,
    updatePatient,
    addConsultation,
    updateConsultation,
    addPrescription,
    scoreMolecules,
    setMolecules,
    setDiagnostics,
    setAllergies,
    setIndications,
    setPrecautions,
    setCommercialNames,
    setInteractions,
    setMedicalClasses,
    setAntecedentsMedicaux
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}
