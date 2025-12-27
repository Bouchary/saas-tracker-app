// client/src/components/import/FileUpload.jsx
// Composant dropzone pour upload de fichiers CSV/Excel
// ✅ NOUVEAU : Bouton télécharger template CSV

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, Download } from 'lucide-react';

const FileUpload = ({ entityType, onUploadSuccess }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Gestion drag & drop
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  // Upload du fichier
  const handleFileUpload = async (file) => {
    setError(null);
    setUploading(true);

    // Validation type de fichier
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      setError('Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)');
      setUploading(false);
      return;
    }

    // Validation taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Taille maximum : 10MB');
      setUploading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5000/api/import/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      const data = await response.json();
      onUploadSuccess(data.file);
    } catch (err) {
      console.error('Erreur upload:', err);
      setError('Erreur lors de l\'upload du fichier. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  // Sélection fichier via input
  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Télécharger le template CSV
  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/import/template/${entityType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement du template');
      }

      // Créer un blob et télécharger
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${entityType}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erreur téléchargement template:', err);
      setError('Erreur lors du téléchargement du template');
    }
  };

  return (
    <div>
      {/* Bouton télécharger template */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Télécharger le template CSV
        </button>
      </div>

      {/* Dropzone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {uploading ? (
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-16 h-16 text-gray-400" />
          )}
        </div>

        {/* Text */}
        <div className="mb-4">
          <p className="text-lg font-medium text-gray-900 mb-2">
            {uploading ? 'Upload en cours...' : 'Glissez-déposez votre fichier ici'}
          </p>
          <p className="text-sm text-gray-500">
            ou cliquez pour sélectionner un fichier
          </p>
        </div>

        {/* Formats supportés */}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>CSV</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>Excel (.xlsx, .xls)</span>
          </div>
        </div>

        {/* Input caché */}
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
      </div>

      {/* Erreur */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Erreur</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Conseil :</strong> Téléchargez d'abord le template CSV pour voir 
          le format attendu et les colonnes nécessaires. Remplissez-le avec vos données 
          puis importez-le ici.
        </p>
      </div>
    </div>
  );
};

export default FileUpload;