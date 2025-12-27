// client/src/components/import/ColumnMapping.jsx
// Composant pour mapper les colonnes CSV aux colonnes de la base de données

import { useState } from 'react';
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Info } from 'lucide-react';

const ColumnMapping = ({ 
  columns, 
  data, 
  mapping, 
  entityType, 
  onMappingChange, 
  onImport, 
  onBack,
  loading 
}) => {
  // Définir les champs cibles selon le type d'entité
  const targetFields = {
    contracts: [
      { key: 'name', label: 'Nom du contrat', required: true },
      { key: 'provider', label: 'Fournisseur', required: true },
      { key: 'monthly_cost', label: 'Coût mensuel', required: false },
      { key: 'renewal_date', label: 'Date de renouvellement', required: false },
      { key: 'status', label: 'Statut', required: false },
      { key: 'license_count', label: 'Nombre de licences', required: false },
      { key: 'pricing_model', label: 'Modèle de tarification', required: false },
      { key: 'notice_period_days', label: 'Période de préavis (jours)', required: false },
      { key: 'description', label: 'Description', required: false },
      { key: 'contract_number', label: 'Numéro de contrat', required: false },
    ],
    assets: [
      { key: 'name', label: 'Nom de l\'asset', required: true },
      { key: 'asset_tag', label: 'Tag/Référence', required: false },
      { key: 'asset_type', label: 'Type', required: false },
      { key: 'manufacturer', label: 'Fabricant', required: false },
      { key: 'model', label: 'Modèle', required: false },
      { key: 'serial_number', label: 'Numéro de série', required: false },
      { key: 'status', label: 'Statut', required: false },
      { key: 'purchase_date', label: 'Date d\'achat', required: false },
      { key: 'purchase_price', label: 'Prix d\'achat', required: false },
    ],
    employees: [
      { key: 'first_name', label: 'Prénom', required: true },
      { key: 'last_name', label: 'Nom', required: true },
      { key: 'email', label: 'Email', required: true },
      { key: 'department', label: 'Département', required: false },
      { key: 'job_title', label: 'Poste', required: false },
      { key: 'phone', label: 'Téléphone', required: false },
      { key: 'start_date', label: 'Date d\'embauche', required: false },
      { key: 'status', label: 'Statut', required: false },
    ]
  };

  const fields = targetFields[entityType] || targetFields.contracts;

  // Vérifier si le mapping est valide
  const isValid = () => {
    const requiredFields = fields.filter(f => f.required);
    return requiredFields.every(f => mapping[f.key] && mapping[f.key] !== '');
  };

  // Gérer le changement de mapping
  const handleMappingChange = (targetField, sourceColumn) => {
    const newMapping = { ...mapping };
    if (sourceColumn === '') {
      delete newMapping[targetField];
    } else {
      newMapping[targetField] = sourceColumn;
    }
    onMappingChange(newMapping);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Mapping des colonnes</h2>
        <p className="text-gray-600">
          Associez les colonnes de votre fichier aux champs de la base de données
        </p>
      </div>

      {/* Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800">
            Les champs marqués d'un <strong className="text-blue-900">*</strong> sont obligatoires. 
            Le mapping suggéré a été détecté automatiquement, vous pouvez le modifier si nécessaire.
          </p>
        </div>
      </div>

      {/* Mapping table */}
      <div className="space-y-4 mb-6">
        {fields.map((field) => {
          const currentMapping = mapping[field.key] || '';
          const isMapped = currentMapping !== '';

          return (
            <div
              key={field.key}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Champ cible */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {field.label}
                  </span>
                  {field.required && (
                    <span className="text-red-500 text-sm">*</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{field.key}</span>
              </div>

              {/* Flèche */}
              <ArrowRight className={`w-5 h-5 ${isMapped ? 'text-green-600' : 'text-gray-400'}`} />

              {/* Sélecteur colonne source */}
              <div className="flex-1">
                <select
                  value={currentMapping}
                  onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  className={`
                    w-full px-3 py-2 rounded-lg border transition-colors
                    ${field.required && !isMapped ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  `}
                >
                  <option value="">-- Ne pas importer --</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div className="w-6">
                {field.required && !isMapped && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                {isMapped && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Aperçu données mappées */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Aperçu avec mapping</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {fields
                  .filter(f => mapping[f.key])
                  .map((field) => (
                    <th
                      key={field.key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {field.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.slice(0, 3).map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {fields
                    .filter(f => mapping[f.key])
                    .map((field) => (
                      <td
                        key={field.key}
                        className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                      >
                        {row[mapping[field.key]] !== null && row[mapping[field.key]] !== undefined
                          ? String(row[mapping[field.key]])
                          : '-'}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation */}
      {!isValid() && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Champs obligatoires manquants</p>
            <p className="text-sm text-red-700 mt-1">
              Veuillez mapper tous les champs marqués d'un <strong>*</strong> avant de continuer.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <button
          onClick={onImport}
          disabled={!isValid() || loading}
          className={`
            flex items-center gap-2 px-6 py-2 rounded-lg transition-colors
            ${isValid() && !loading
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
          `}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Import en cours...
            </>
          ) : (
            <>
              Lancer l'import
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ColumnMapping;