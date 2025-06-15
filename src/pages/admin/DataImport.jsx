import React, { useState } from 'react'
import { useData } from '../../contexts/DataContext'
import { Upload, FileText, CheckCircle, AlertCircle, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'

const DataImport = () => {
  const {
    setMolecules,
    setDiagnostics,
    setAllergies,
    setIndications,
    setPrecautions,
    setCommercialNames,
    setInteractions,
    molecules,
    diagnostics,
    allergies,
    indications,
    precautions,
    commercialNames,
    interactions
  } = useData()

  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState([])
  const [viewingData, setViewingData] = useState(null)
  const [expandedView, setExpandedView] = useState(false)

  const importTypes = [
    {
      id: 'molecules',
      name: 'Molécules',
      description: 'Import des molécules avec leurs propriétés',
      expectedColumns: ['Nom de la molécule', 'Indications principales', 'Classes thérapeutiques', 'Allergies', 'Antécédents médicaux', 'Médicaments actuels', 'Catégories d\'âge', 'Grossesse', 'Allaitement', 'Précautions', 'Effets secondaires majeurs'],
      data: molecules,
      count: molecules.length
    },
    {
      id: 'diagnostics',
      name: 'Diagnostics',
      description: 'Import des diagnostics et classes médicales',
      expectedColumns: ['Diagnostic', 'Classe médicale'],
      data: diagnostics,
      count: diagnostics.length
    },
    {
      id: 'commercial_names',
      name: 'Noms Commerciaux',
      description: 'Import des noms commerciaux des médicaments',
      expectedColumns: ['DCI (Dénomination Commune Internationale)', 'Nom Commercial', 'Dosage', 'Forme Pharmaceutique', 'Conditionnement'],
      data: commercialNames,
      count: commercialNames.length
    },
    {
      id: 'interactions',
      name: 'Interactions',
      description: 'Import des interactions médicamenteuses',
      expectedColumns: ['Médicaments 1', 'Classe', 'Médicaments', 'Type d\'Interaction'],
      data: interactions,
      count: interactions.length
    },
    {
      id: 'precautions',
      name: 'Précautions',
      description: 'Import des précautions médicamenteuses',
      expectedColumns: ['Nom de la précaution'],
      data: precautions,
      count: precautions.length
    }
  ]

  const parseCSV = (text) => {
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const row = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        data.push(row)
      }
    }

    return { headers, data }
  }

  const splitValues = (text, separator = '/') => {
    if (!text) return []
    return text.split(separator).map(v => v.trim()).filter(v => v)
  }

  const handleFileImport = async (file, importType) => {
    setImporting(true)
    
    try {
      const text = await file.text()
      const { headers, data } = parseCSV(text)
      
      let importedCount = 0
      
      switch (importType) {
        case 'molecules':
          importedCount = await importMolecules(data)
          break
        case 'diagnostics':
          importedCount = await importDiagnostics(data)
          break
        case 'commercial_names':
          importedCount = await importCommercialNames(data)
          break
        case 'interactions':
          importedCount = await importInteractions(data)
          break
        case 'precautions':
          importedCount = await importPrecautions(data)
          break
        default:
          throw new Error('Type d\'import non supporté')
      }

      const result = {
        type: importType,
        success: true,
        count: importedCount,
        message: `${importedCount} éléments importés avec succès`
      }
      
      setImportResults(prev => [...prev, result])
      toast.success(result.message)
      
    } catch (error) {
      const result = {
        type: importType,
        success: false,
        message: `Erreur: ${error.message}`
      }
      
      setImportResults(prev => [...prev, result])
      toast.error(result.message)
    } finally {
      setImporting(false)
    }
  }

  const importMolecules = async (data) => {
    const molecules = data.map((row, index) => ({
      id: Date.now() + index,
      name: row['Nom de la molécule'] || '',
      grossesse: row['Grossesse']?.toLowerCase() === 'true',
      allaitement: row['Allaitement']?.toLowerCase() === 'true',
      effet_majeurs: row['Effets secondaires majeurs'] || '',
      indications_ids: splitValues(row['Indications principales']),
      allergies_ids: splitValues(row['Allergies']),
      antecedents_medicaux_ids: splitValues(row['Antécédents médicaux']),
      medicaments_actuels_ids: splitValues(row['Médicaments actuels']),
      classes_medicales_ids: splitValues(row['Classes thérapeutiques']),
      precaution_ids: splitValues(row['Précautions']),
      categories_age_id: row['Catégories d\'âge'] || ''
    })).filter(m => m.name)

    setMolecules(prev => [...prev, ...molecules])
    return molecules.length
  }

  const importDiagnostics = async (data) => {
    const diagnostics = data.map((row, index) => ({
      id: Date.now() + index,
      name: row['Diagnostic'] || '',
      classe_medicale_ids: splitValues(row['Classe médicale'])
    })).filter(d => d.name)

    setDiagnostics(prev => [...prev, ...diagnostics])
    return diagnostics.length
  }

  const importCommercialNames = async (data) => {
    const commercialNames = data.map((row, index) => ({
      id: Date.now() + index,
      name: row['Nom Commercial'] || '',
      molecule_name: row['DCI (Dénomination Commune Internationale)'] || '',
      molecule_id: null, // Would need to match with existing molecules
      dosage: row['Dosage'] || '',
      forme_pharmaceutique: row['Forme Pharmaceutique'] || '',
      conditionnement: row['Conditionnement'] || ''
    })).filter(c => c.name)

    setCommercialNames(prev => [...prev, ...commercialNames])
    return commercialNames.length
  }

  const importInteractions = async (data) => {
    const interactions = data.map((row, index) => ({
      id: Date.now() + index,
      medicament_1_name: row['Médicaments 1'] || '',
      medicament_2_names: splitValues(row['Médicaments']),
      classe_medicale: row['Classe'] || '',
      type_interaction: row['Type d\'Interaction'] || ''
    })).filter(i => i.medicament_1_name && i.type_interaction)

    setInteractions(prev => [...prev, ...interactions])
    return interactions.length
  }

  const importPrecautions = async (data) => {
    const precautions = data.map((row, index) => ({
      id: Date.now() + index,
      name: row['Nom de la précaution'] || row[Object.keys(row)[0]] || ''
    })).filter(p => p.name)

    setPrecautions(prev => [...prev, ...precautions])
    return precautions.length
  }

  const DataViewer = ({ data, type, onClose }) => {
    const itemsToShow = expandedView ? data.length : 50

    const renderMoleculeData = (molecules) => (
      <div className="space-y-4">
        {molecules.slice(0, itemsToShow).map((molecule) => (
          <div key={molecule.id} className="border rounded-lg p-4">
            <h3 className="font-bold text-lg">{molecule.name}</h3>
            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <span className="font-medium">Grossesse:</span> {molecule.grossesse ? 'Oui' : 'Non'}
              </div>
              <div>
                <span className="font-medium">Allaitement:</span> {molecule.allaitement ? 'Oui' : 'Non'}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Indications:</span> {Array.isArray(molecule.indications_ids) ? molecule.indications_ids.join(', ') : molecule.indications_ids}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Classes thérapeutiques:</span> {Array.isArray(molecule.classes_medicales_ids) ? molecule.classes_medicales_ids.join(', ') : molecule.classes_medicales_ids}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Effets majeurs:</span> {molecule.effet_majeurs}
              </div>
            </div>
          </div>
        ))}
        {data.length > itemsToShow && (
          <div className="text-center">
            <button
              onClick={() => setExpandedView(!expandedView)}
              className="btn btn-secondary px-4 py-2"
            >
              {expandedView ? 'Voir moins' : `Voir tous les ${data.length} éléments`}
            </button>
          </div>
        )}
      </div>
    )

    const renderCommercialNamesData = (names) => (
      <div className="space-y-4">
        {names.slice(0, itemsToShow).map((name) => (
          <div key={name.id} className="border rounded-lg p-4">
            <h3 className="font-bold text-lg">{name.name}</h3>
            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <span className="font-medium">Molécule:</span> {name.molecule_name}
              </div>
              <div>
                <span className="font-medium">Dosage:</span> {name.dosage}
              </div>
              <div>
                <span className="font-medium">Forme:</span> {name.forme_pharmaceutique}
              </div>
              <div>
                <span className="font-medium">Conditionnement:</span> {name.conditionnement}
              </div>
            </div>
          </div>
        ))}
        {names.length > itemsToShow && (
          <div className="text-center">
            <button
              onClick={() => setExpandedView(!expandedView)}
              className="btn btn-secondary px-4 py-2"
            >
              {expandedView ? 'Voir moins' : `Voir tous les ${names.length} éléments`}
            </button>
          </div>
        )}
      </div>
    )

    const renderInteractionsData = (interactions) => (
      <div className="space-y-4">
        {interactions.slice(0, itemsToShow).map((interaction) => (
          <div key={interaction.id} className="border rounded-lg p-4">
            <h3 className="font-bold text-lg">{interaction.medicament_1_name}</h3>
            <div className="grid grid-cols-1 gap-2 mt-2 text-sm">
              <div>
                <span className="font-medium">Classe:</span> {interaction.classe_medicale}
              </div>
              <div>
                <span className="font-medium">Médicaments en interaction:</span> {Array.isArray(interaction.medicament_2_names) ? interaction.medicament_2_names.join(', ') : interaction.medicament_2_names}
              </div>
              <div>
                <span className="font-medium">Type d'interaction:</span> {interaction.type_interaction}
              </div>
            </div>
          </div>
        ))}
        {interactions.length > itemsToShow && (
          <div className="text-center">
            <button
              onClick={() => setExpandedView(!expandedView)}
              className="btn btn-secondary px-4 py-2"
            >
              {expandedView ? 'Voir moins' : `Voir tous les ${interactions.length} éléments`}
            </button>
          </div>
        )}
      </div>
    )

    const renderGenericData = (items, nameField = 'name') => (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.slice(0, itemsToShow).map((item) => (
            <div key={item.id} className="border rounded-lg p-3">
              <h3 className="font-medium">{item[nameField]}</h3>
              {item.classe_medicale_ids && (
                <p className="text-sm text-gray-600 mt-1">
                  Classes: {Array.isArray(item.classe_medicale_ids) ? item.classe_medicale_ids.join(', ') : item.classe_medicale_ids}
                </p>
              )}
            </div>
          ))}
        </div>
        {items.length > itemsToShow && (
          <div className="text-center">
            <button
              onClick={() => setExpandedView(!expandedView)}
              className="btn btn-secondary px-4 py-2"
            >
              {expandedView ? 'Voir moins' : `Voir tous les ${items.length} éléments`}
            </button>
          </div>
        )}
      </div>
    )

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Données existantes - {importTypes.find(t => t.id === type)?.name} ({data.length} éléments)
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            {type === 'molecules' && renderMoleculeData(data)}
            {type === 'commercial_names' && renderCommercialNamesData(data)}
            {type === 'interactions' && renderInteractionsData(data)}
            {(type === 'diagnostics' || type === 'precautions') && renderGenericData(data)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import de Données</h1>
        <p className="text-gray-600">Importez des fichiers CSV pour alimenter la base de données</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Types */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Types d'Import Disponibles</h2>
          
          {importTypes.map((type) => (
            <div key={type.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{type.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {type.count} éléments
                      </span>
                      {type.count > 0 && (
                        <button
                          onClick={() => {
                            setViewingData(type.id)
                            setExpandedView(false)
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Voir les données existantes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Colonnes attendues:</p>
                    <div className="flex flex-wrap gap-1">
                      {type.expectedColumns.map((col) => (
                        <span key={col} className="inline-block bg-gray-100 text-xs px-2 py-1 rounded">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  <label className="btn btn-primary px-4 py-2 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Importer
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          handleFileImport(file, type.id)
                        }
                      }}
                      disabled={importing}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Import Results */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Résultats d'Import</h2>
          
          {importing && (
            <div className="card p-6 mb-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-3"></div>
                <span className="text-gray-600">Import en cours...</span>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {importResults.map((result, index) => (
              <div key={index} className="card p-4">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {importTypes.find(t => t.id === result.type)?.name}
                    </p>
                    <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {importResults.length === 0 && !importing && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun import effectué</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Viewer Modal */}
      {viewingData && (
        <DataViewer
          data={importTypes.find(t => t.id === viewingData)?.data || []}
          type={viewingData}
          onClose={() => setViewingData(null)}
        />
      )}

      {/* Instructions */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Instructions d'Import</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>• Les fichiers doivent être au format CSV avec des virgules comme séparateurs</p>
          <p>• La première ligne doit contenir les en-têtes de colonnes</p>
          <p>• Les noms des colonnes doivent correspondre exactement aux colonnes attendues</p>
          <p>• Les valeurs booléennes doivent être 'true' ou 'false'</p>
          <p>• Utilisez "/" pour indiquer OR dans les datasets</p>
          <p>• Utilisez "," pour indiquer AND dans les datasets</p>
          <p>• Les cellules vides sont autorisées et seront ignorées</p>
          <p><strong>• Pour les interactions:</strong> L'ordre des colonnes doit être: Médicaments 1, Classe, Médicaments, Type d'Interaction</p>
        </div>
      </div>
    </div>
  )
}

export default DataImport