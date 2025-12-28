// client/src/components/DocumentUpload.jsx
// Composant pour uploader des documents avec drag & drop
// ✅ AJOUT : 11 types de documents avec icônes lucide-react

import React, { useState } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import API_URL from '../config/api';
import { useAuth } from '../AuthContext';

const DocumentUpload = ({ contractId, onUploadSuccess }) => {
    const { token } = useAuth();
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [documentType, setDocumentType] = useState('other');

    // Formats acceptés
    const acceptedFormats = {
        'application/pdf': '.pdf',
        'image/jpeg': '.jpg,.jpeg',
        'image/png': '.png',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    };

    const acceptString = Object.values(acceptedFormats).join(',');

    // Vérifier si le fichier est valide
    const isValidFile = (file) => {
        const maxSize = 10 * 1024 * 1024; // 10 MB
        const validTypes = Object.keys(acceptedFormats);

        if (!validTypes.includes(file.type)) {
            setError('Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG, DOC, DOCX');
            return false;
        }

        if (file.size > maxSize) {
            setError('Fichier trop volumineux. Taille maximale : 10 MB');
            return false;
        }

        return true;
    };

    // Gérer la sélection de fichier
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && isValidFile(file)) {
            setSelectedFile(file);
            setError('');
        }
    };

    // Gérer le drag & drop
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && isValidFile(file)) {
            setSelectedFile(file);
            setError('');
        }
    };

    // Uploader le fichier
    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Aucun fichier sélectionné');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('documentType', documentType);

            const response = await fetch(`${API_URL}/api/contracts/${contractId}/documents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'upload');
            }

            setSuccess(`✅ ${selectedFile.name} uploadé avec succès !`);
            setSelectedFile(null);
            
            // Appeler le callback pour rafraîchir la liste
            if (onUploadSuccess) {
                onUploadSuccess(data.document);
            }

            // Effacer le message de succès après 3 secondes
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('Erreur upload:', err);
            setError(err.message || 'Erreur lors de l\'upload');
        } finally {
            setUploading(false);
        }
    };

    // Annuler la sélection
    const handleCancel = () => {
        setSelectedFile(null);
        setError('');
    };

    // Formater la taille du fichier
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📎 Uploader un document</h3>

            {/* Messages d'erreur et succès */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">{success}</span>
                </div>
            )}

            {/* Zone de drag & drop */}
            {!selectedFile && (
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">
                        Glissez-déposez un fichier ici ou
                    </p>
                    <label className="inline-block cursor-pointer">
                        <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                            Parcourir
                        </span>
                        <input
                            type="file"
                            className="hidden"
                            accept={acceptString}
                            onChange={handleFileSelect}
                        />
                    </label>
                    <p className="text-xs text-gray-500 mt-3">
                        Formats acceptés : PDF, JPG, PNG, DOC, DOCX (max 10 MB)
                    </p>
                </div>
            )}

            {/* Fichier sélectionné */}
            {selectedFile && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <File className="w-8 h-8 text-indigo-600" />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="p-1 hover:bg-gray-200 rounded"
                            disabled={uploading}
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Sélecteur de type - ✅ 11 TYPES */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type de document
                        </label>
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            disabled={uploading}
                        >
                            <option value="contract">📄 Contrat</option>
                            <option value="invoice">🧾 Facture</option>
                            <option value="quote">📋 Devis / Proposition</option>
                            <option value="report">📊 Rapport / Analyse</option>
                            <option value="terms">📝 Conditions Générales (CGV/CGU)</option>
                            <option value="payment">💳 Justificatif de paiement</option>
                            <option value="correspondence">📧 Correspondance</option>
                            <option value="amendment">✏️ Avenant / Modification</option>
                            <option value="legal">⚖️ Document légal</option>
                            <option value="appendix">📎 Annexe</option>
                            <option value="other">📂 Autre</option>
                        </select>
                    </div>

                    {/* Bouton d'upload */}
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Upload en cours...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Uploader le fichier
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default DocumentUpload;