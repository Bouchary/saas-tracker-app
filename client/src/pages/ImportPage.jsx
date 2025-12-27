// client/src/pages/ImportPage.jsx
// Page d'import CSV/Excel avec workflow complet

import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import FileUpload from '../components/import/FileUpload';
import DataPreview from '../components/import/DataPreview';
import ColumnMapping from '../components/import/ColumnMapping';
import ImportResults from '../components/import/ImportResults';

const ImportPage = () => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Mapping, 4: Results
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [importResults, setImportResults] = useState(null);
  const [entityType, setEntityType] = useState('contracts');
  const [loading, setLoading] = useState(false);

  // Étape 1 : Upload réussi
  const handleUploadSuccess = (file) => {
    setUploadedFile(file);
    setStep(2);
    // Automatiquement charger le preview
    loadPreview(file.filename);
  };

  // Charger le preview du fichier
  const loadPreview = async (filename) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/import/preview/${filename}?entity_type=${entityType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du preview');
      }

      const data = await response.json();
      setPreviewData(data);
      
      // Utiliser le mapping suggéré si disponible
      if (data.suggestedMapping) {
        setMapping(data.suggestedMapping);
      }
    } catch (error) {
      console.error('Erreur preview:', error);
      alert('Erreur lors du chargement du preview');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 → 3 : Passer au mapping
  const handleContinueToMapping = () => {
    setStep(3);
  };

  // Étape 3 → 4 : Lancer l'import
  const handleStartImport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/import/contracts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: uploadedFile.filename,
          mapping: mapping
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'import');
      }

      const results = await response.json();
      setImportResults(results);
      setStep(4);
    } catch (error) {
      console.error('Erreur import:', error);
      alert('Erreur lors de l\'import');
    } finally {
      setLoading(false);
    }
  };

  // Recommencer
  const handleRestart = () => {
    setStep(1);
    setUploadedFile(null);
    setPreviewData(null);
    setMapping({});
    setImportResults(null);
  };

  // Stepper visuel
  const steps = [
    { number: 1, name: 'Upload', icon: Upload },
    { number: 2, name: 'Preview', icon: FileText },
    { number: 3, name: 'Mapping', icon: CheckCircle },
    { number: 4, name: 'Résultats', icon: AlertCircle }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Import de données</h1>
        <p className="mt-2 text-gray-600">
          Importez vos contrats, assets ou employés depuis un fichier CSV ou Excel
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isActive = step === s.number;
            const isCompleted = step > s.number;

            return (
              <div key={s.number} className="flex items-center flex-1">
                {/* Step */}
                <div className="flex items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                      ${isActive ? 'border-blue-600 bg-blue-600 text-white' : ''}
                      ${isCompleted ? 'border-green-600 bg-green-600 text-white' : ''}
                      ${!isActive && !isCompleted ? 'border-gray-300 bg-white text-gray-400' : ''}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`
                      ml-2 text-sm font-medium
                      ${isActive ? 'text-blue-600' : ''}
                      ${isCompleted ? 'text-green-600' : ''}
                      ${!isActive && !isCompleted ? 'text-gray-400' : ''}
                    `}
                  >
                    {s.name}
                  </span>
                </div>

                {/* Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                      flex-1 h-0.5 mx-4 transition-colors
                      ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sélection type d'entité */}
      {step === 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de données à importer
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="contracts">Contrats</option>
            <option value="assets">Assets</option>
            <option value="employees">Employés</option>
          </select>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {step === 1 && (
          <FileUpload
            entityType={entityType}
            onUploadSuccess={handleUploadSuccess}
          />
        )}

        {step === 2 && previewData && (
          <DataPreview
            data={previewData}
            loading={loading}
            onContinue={handleContinueToMapping}
            onBack={handleRestart}
          />
        )}

        {step === 3 && previewData && (
          <ColumnMapping
            columns={previewData.stats.columns}
            data={previewData.preview}
            mapping={mapping}
            entityType={entityType}
            onMappingChange={setMapping}
            onImport={handleStartImport}
            onBack={() => setStep(2)}
            loading={loading}
          />
        )}

        {step === 4 && importResults && (
          <ImportResults
            results={importResults}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
};

export default ImportPage;