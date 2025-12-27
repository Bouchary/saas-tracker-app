// client/src/components/import/ImportResults.jsx
// Composant pour afficher les résultats de l'import

import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ImportResults = ({ results, onRestart }) => {
  const navigate = useNavigate();
  const { total, success, failed, warnings, details } = results.results;

  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Résultats de l'import</h2>
        <p className="text-gray-600">
          Import terminé : {success}/{total} éléments importés avec succès
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{total}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Succès</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{success}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Échecs</p>
              <p className="text-2xl font-bold text-red-900 mt-1">{failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Avertissements</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{warnings}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Taux de réussite</span>
          <span className="text-sm font-medium text-gray-900">{successRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              successRate === 100 ? 'bg-green-600' : successRate >= 50 ? 'bg-yellow-600' : 'bg-red-600'
            }`}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Message global */}
      {success === total && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Import réussi !</p>
            <p className="text-sm text-green-700 mt-1">
              Tous les éléments ont été importés avec succès. Vous pouvez les consulter dans la liste.
            </p>
          </div>
        </div>
      )}

      {failed > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Certains éléments n'ont pas pu être importés</p>
            <p className="text-sm text-red-700 mt-1">
              {failed} ligne{failed > 1 ? 's' : ''} contien{failed > 1 ? 'nent' : 't'} des erreurs. 
              Consultez le détail ci-dessous.
            </p>
          </div>
        </div>
      )}

      {/* Détails ligne par ligne */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Détail ligne par ligne</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {details.map((detail, index) => (
            <div
              key={index}
              className={`
                p-3 rounded-lg border flex items-start gap-3
                ${detail.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
              `}
            >
              {/* Icon */}
              {detail.status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${detail.status === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    Ligne {detail.row}
                    {detail.status === 'success' && detail.name && (
                      <span className="ml-2 font-normal">- {detail.name}</span>
                    )}
                  </p>
                  {detail.status === 'success' && detail.id && (
                    <span className="text-xs text-green-600">ID: {detail.id}</span>
                  )}
                </div>

                {/* Erreurs */}
                {detail.errors && detail.errors.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {detail.errors.map((error, i) => (
                      <li key={i} className="text-sm text-red-700">
                        • {error}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Warnings */}
                {detail.warnings && detail.warnings.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {detail.warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-yellow-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Données (pour les erreurs) */}
                {detail.status === 'error' && detail.data && (
                  <div className="mt-2 text-xs text-red-600 bg-red-100 rounded p-2">
                    <pre className="whitespace-pre-wrap break-all">
                      {JSON.stringify(detail.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Importer un autre fichier
        </button>

        <button
          onClick={() => navigate('/contracts')}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Voir les contrats
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ImportResults;