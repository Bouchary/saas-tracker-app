// ============================================================================
// COMPOSANT : ExportExcelButton.jsx
// ============================================================================
// Fichier : client/src/components/ExportExcelButton.jsx
// Bouton pour exporter les contrats en Excel avec les filtres appliqués
// ============================================================================

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import API_URL from '../config/api';

const ExportExcelButton = ({ filters = {} }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      // Construire l'URL avec les filtres
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.provider) params.append('provider', filters.provider);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const queryString = params.toString();
      const url = `${API_URL}/api/contracts/export-excel${queryString ? '?' + queryString : ''}`;

      // Récupérer le token d'authentification
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');

      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      // Faire la requête pour télécharger le fichier
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      // Récupérer le nom du fichier depuis les headers (si disponible)
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'contrats_export.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Créer un blob et déclencher le téléchargement
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log('✅ Export Excel réussi:', filename);

    } catch (err) {
      console.error('❌ Erreur export Excel:', err);
      setError(err.message || 'Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <Download className={`w-5 h-5 ${loading ? 'animate-bounce' : ''}`} />
        <span className="font-medium">
          {loading ? 'Export en cours...' : 'Exporter Excel'}
        </span>
      </button>

      {/* Message d'erreur */}
      {error && (
        <div className="absolute top-full mt-2 right-0 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-lg z-10 min-w-max">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ExportExcelButton;