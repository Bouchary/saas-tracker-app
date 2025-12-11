// client/src/components/DocumentList.jsx
// Composant pour afficher la liste des documents d'un contrat

import React, { useState, useEffect } from 'react';
import { Download, Trash2, File, FileText, Receipt, Paperclip, AlertCircle } from 'lucide-react';
import API_URL from '../config/api';
import { useAuth } from '../AuthContext';

const DocumentList = ({ contractId, refreshTrigger }) => {
    const { token } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(null);

    // Charger les documents
    const fetchDocuments = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/contracts/${contractId}/documents`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des documents');
            }

            const data = await response.json();
            setDocuments(data.documents || []);

        } catch (err) {
            console.error('Erreur chargement documents:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Charger au montage et quand refreshTrigger change
    useEffect(() => {
        fetchDocuments();
    }, [contractId, refreshTrigger]);

    // Télécharger un document
    const handleDownload = async (documentId, filename) => {
        try {
            const response = await fetch(`${API_URL}/api/documents/${documentId}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement');
            }

            // Créer un blob et déclencher le téléchargement
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            console.log(`✅ Téléchargement : ${filename}`);

        } catch (err) {
            console.error('Erreur téléchargement:', err);
            alert('Erreur lors du téléchargement du fichier');
        }
    };

    // Supprimer un document
    const handleDelete = async (documentId, filename) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${filename}" ?`)) {
            return;
        }

        setDeleting(documentId);

        try {
            const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression');
            }

            console.log(`✅ Document supprimé : ${filename}`);
            
            // Rafraîchir la liste
            fetchDocuments();

        } catch (err) {
            console.error('Erreur suppression:', err);
            alert('Erreur lors de la suppression du fichier');
        } finally {
            setDeleting(null);
        }
    };

    // Icône selon le type de document
    const getDocumentIcon = (type, mimeType) => {
        if (type === 'contract') return <FileText className="w-5 h-5 text-blue-600" />;
        if (type === 'invoice') return <Receipt className="w-5 h-5 text-green-600" />;
        if (mimeType.startsWith('image/')) return <File className="w-5 h-5 text-purple-600" />;
        return <Paperclip className="w-5 h-5 text-gray-600" />;
    };

    // Badge selon le type
    const getTypeBadge = (type) => {
        const badges = {
            contract: { label: 'Contrat', color: 'bg-blue-100 text-blue-800' },
            invoice: { label: 'Facture', color: 'bg-green-100 text-green-800' },
            other: { label: 'Autre', color: 'bg-gray-100 text-gray-800' }
        };

        const badge = badges[type] || badges.other;
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    // Formater la taille
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Formater la date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Chargement des documents...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    📁 Documents ({documents.length})
                </h3>
            </div>

            {documents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <File className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>Aucun document uploadé pour ce contrat</p>
                    <p className="text-sm mt-1">Commencez par uploader un fichier ci-dessus</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-200">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="p-4 hover:bg-gray-50 transition flex items-center gap-4"
                        >
                            {/* Icône */}
                            <div className="flex-shrink-0">
                                {getDocumentIcon(doc.document_type, doc.mime_type)}
                            </div>

                            {/* Infos */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-gray-900 truncate">
                                        {doc.original_filename}
                                    </p>
                                    {getTypeBadge(doc.document_type)}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <span>{formatFileSize(doc.file_size)}</span>
                                    <span>•</span>
                                    <span>{formatDate(doc.uploaded_at)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {/* Bouton Download */}
                                <button
                                    onClick={() => handleDownload(doc.id, doc.original_filename)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                    title="Télécharger"
                                >
                                    <Download className="w-5 h-5" />
                                </button>

                                {/* Bouton Delete */}
                                <button
                                    onClick={() => handleDelete(doc.id, doc.original_filename)}
                                    disabled={deleting === doc.id}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                    title="Supprimer"
                                >
                                    {deleting === doc.id ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                                    ) : (
                                        <Trash2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentList;