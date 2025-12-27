// client/src/components/import/DataPreview.jsx
// Composant pour afficher l'aperçu des données CSV

import { FileText, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

const DataPreview = ({ data, loading, onContinue, onBack }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { stats, preview } = data;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Aperçu des données</h2>
        <p className="text-gray-600">
          Vérifiez que vos données sont correctement détectées avant de continuer
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Lignes détectées</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalRows}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Colonnes détectées</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{stats.totalColumns}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Erreurs</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">
                {stats.hasErrors ? stats.errors.length : 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Colonnes détectées */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Colonnes détectées</h3>
        <div className="flex flex-wrap gap-2">
          {stats.columns.map((col) => (
            <div
              key={col}
              className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
            >
              {col}
              {stats.columnTypes && stats.columnTypes[col] && (
                <span className="ml-2 text-xs text-gray-500">
                  ({stats.columnTypes[col]})
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Erreurs */}
      {stats.hasErrors && stats.errors.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Avertissements détectés</p>
              <ul className="mt-2 space-y-1">
                {stats.errors.slice(0, 5).map((error, index) => (
                  <li key={index} className="text-sm text-yellow-700">
                    • Ligne {error.row}: {error.message}
                  </li>
                ))}
              </ul>
              {stats.errors.length > 5 && (
                <p className="text-sm text-yellow-600 mt-2">
                  ... et {stats.errors.length - 5} autres avertissements
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table preview */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Aperçu ({preview.length} premières lignes)
        </h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                {stats.columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preview.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {index + 1}
                  </td>
                  {stats.columns.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                    >
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continuer vers le mapping
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DataPreview;