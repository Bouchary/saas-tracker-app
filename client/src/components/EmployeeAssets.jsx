// ============================================================================
// EMPLOYEE ASSETS COMPONENT - Vue matériel employé
// ============================================================================
// Affiche les assets assignés à un employé avec icônes lucide-react
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Laptop, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Keyboard,
  Box,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import employeesApi from '../services/employeesApi';
import assetsApi from '../services/assetsApi';

const EmployeeAssets = ({ employeeId, employeeName }) => {
  const navigate = useNavigate();
  
  const [currentAssets, setCurrentAssets] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Modal assignation
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [assignForm, setAssignForm] = useState({
    asset_id: '',
    purpose: '',
    condition_on_assignment: 'good',
    assignment_notes: ''
  });

  useEffect(() => {
    loadEmployeeAssets();
  }, [employeeId]);

  const loadEmployeeAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeesApi.getEmployeeAssets(employeeId);
      setCurrentAssets(data.current_assets);
      setHistory(data.history);
      setStats(data.stats);
    } catch (err) {
      setError(err.message);
      console.error('Erreur chargement assets employé:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAssets = async () => {
    try {
      const data = await assetsApi.getAll({ status: 'available', limit: 100 });
      setAvailableAssets(data.assets);
    } catch (err) {
      console.error('Erreur chargement assets disponibles:', err);
    }
  };

  const handleOpenAssignModal = () => {
    loadAvailableAssets();
    setShowAssignModal(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    
    if (!assignForm.asset_id) {
      alert('Veuillez sélectionner un asset');
      return;
    }

    try {
      await assetsApi.assign(assignForm.asset_id, {
        employee_id: employeeId,
        purpose: assignForm.purpose,
        condition_on_assignment: assignForm.condition_on_assignment,
        assignment_notes: assignForm.assignment_notes
      });
      
      alert('Asset assigné avec succès !');
      setShowAssignModal(false);
      setAssignForm({
        asset_id: '',
        purpose: '',
        condition_on_assignment: 'good',
        assignment_notes: ''
      });
      loadEmployeeAssets();
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleUnassign = async (assetId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retourner cet asset ?')) {
      return;
    }

    try {
      await assetsApi.unassign(assetId, {
        condition_on_return: 'good',
        return_notes: `Retourné depuis la fiche employé ${employeeName}`
      });
      
      alert('Asset retourné avec succès !');
      loadEmployeeAssets();
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const getAssetIcon = (type) => {
    const iconProps = { className: "w-5 h-5", strokeWidth: 2 };
    
    switch (type) {
      case 'laptop':
        return <Laptop {...iconProps} />;
      case 'phone':
        return <Smartphone {...iconProps} />;
      case 'monitor':
        return <Monitor {...iconProps} />;
      case 'tablet':
        return <Tablet {...iconProps} />;
      case 'accessory':
        return <Keyboard {...iconProps} />;
      default:
        return <Box {...iconProps} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement du matériel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <XCircle className="w-5 h-5 inline mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="employee-assets-section">
      {/* Header avec stats */}
      <div className="assets-header">
        <div className="assets-stats-mini">
          <div className="stat-mini">
            <Package className="w-5 h-5" />
            <div>
              <div className="stat-mini-value">{stats?.total_current || 0}</div>
              <div className="stat-mini-label">Assets actuels</div>
            </div>
          </div>
          
          {stats?.by_type && Object.keys(stats.by_type).length > 0 && (
            <div className="stat-mini-breakdown">
              {Object.entries(stats.by_type).map(([type, count]) => (
                <div key={type} className="stat-mini-item">
                  {getAssetIcon(type)}
                  <span>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button 
          onClick={handleOpenAssignModal}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Assigner un asset
        </button>
      </div>

      {/* Assets actuels */}
      <div className="current-assets">
        <h3 className="section-title">
          <Package className="w-5 h-5" />
          Matériel assigné ({currentAssets.length})
        </h3>

        {currentAssets.length === 0 ? (
          <div className="empty-state">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Aucun matériel assigné</p>
            <button 
              onClick={handleOpenAssignModal}
              className="btn-link mt-4"
            >
              <Plus className="w-4 h-4 inline" />
              Assigner un premier asset
            </button>
          </div>
        ) : (
          <div className="assets-grid">
            {currentAssets.map((asset) => (
              <div key={asset.id} className="asset-card-mini">
                <div className="asset-card-header">
                  <div className="asset-icon-type">
                    {getAssetIcon(asset.asset_type)}
                  </div>
                  <div className="asset-card-info">
                    <h4 
                      className="asset-card-name"
                      onClick={() => navigate(`/assets/${asset.id}`)}
                    >
                      {asset.name}
                    </h4>
                    <p className="asset-card-tag">{asset.asset_tag}</p>
                  </div>
                </div>
                
                <div className="asset-card-details">
                  <div className="asset-card-detail">
                    <Calendar className="w-4 h-4" />
                    <span>Depuis le {formatDate(asset.assigned_date)}</span>
                  </div>
                  {asset.purpose && (
                    <div className="asset-card-detail">
                      <span className="text-gray-600">{asset.purpose}</span>
                    </div>
                  )}
                </div>
                
                <div className="asset-card-actions">
                  <button
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    className="btn btn-secondary btn-sm"
                  >
                    Voir détails
                  </button>
                  <button
                    onClick={() => handleUnassign(asset.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retourner
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historique toggle */}
      {history.length > 0 && (
        <div className="history-toggle">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn btn-secondary"
          >
            <Clock className="w-4 h-4" />
            {showHistory ? 'Masquer' : 'Afficher'} l'historique ({history.length})
          </button>
        </div>
      )}

      {/* Historique */}
      {showHistory && history.length > 0 && (
        <div className="assets-history">
          <h3 className="section-title">
            <Clock className="w-5 h-5" />
            Historique complet
          </h3>
          
          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className="history-item-mini">
                <div className="history-item-header">
                  <div className="history-item-icon">
                    {getAssetIcon(item.asset_type)}
                  </div>
                  <div className="history-item-info">
                    <h4>{item.name}</h4>
                    <p className="text-gray-600">{item.asset_tag}</p>
                  </div>
                  <div className={`history-status ${item.status}`}>
                    {item.status === 'active' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Actif
                      </>
                    ) : (
                      <>
                        <ArrowLeft className="w-4 h-4" />
                        Retourné
                      </>
                    )}
                  </div>
                </div>
                
                <div className="history-item-dates">
                  <span>
                    <Calendar className="w-4 h-4 inline" />
                    {formatDate(item.assigned_date)}
                  </span>
                  {item.actual_return_date && (
                    <>
                      <span className="mx-2">→</span>
                      <span>{formatDate(item.actual_return_date)}</span>
                    </>
                  )}
                </div>
                
                {item.purpose && (
                  <div className="history-item-purpose">
                    <strong>Objet :</strong> {item.purpose}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Assignation */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              <Plus className="w-5 h-5 inline mr-2" />
              Assigner un asset à {employeeName}
            </h2>
            
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label>Asset à assigner *</label>
                <select
                  value={assignForm.asset_id}
                  onChange={(e) => setAssignForm({...assignForm, asset_id: e.target.value})}
                  required
                >
                  <option value="">Sélectionner un asset...</option>
                  {availableAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.asset_tag} - {asset.name}
                    </option>
                  ))}
                </select>
                {availableAssets.length === 0 && (
                  <small className="text-gray-600">
                    Aucun asset disponible. Tous les assets sont déjà assignés.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Objet *</label>
                <input
                  type="text"
                  value={assignForm.purpose}
                  onChange={(e) => setAssignForm({...assignForm, purpose: e.target.value})}
                  placeholder="Ex: Laptop principal, téléphone professionnel..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Condition à l'assignation</label>
                <select
                  value={assignForm.condition_on_assignment}
                  onChange={(e) => setAssignForm({...assignForm, condition_on_assignment: e.target.value})}
                >
                  <option value="new">Neuf</option>
                  <option value="good">Bon</option>
                  <option value="fair">Moyen</option>
                  <option value="poor">Mauvais</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes (optionnel)</label>
                <textarea
                  value={assignForm.assignment_notes}
                  onChange={(e) => setAssignForm({...assignForm, assignment_notes: e.target.value})}
                  rows="3"
                  placeholder="Notes additionnelles..."
                ></textarea>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAssignModal(false)} 
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={availableAssets.length === 0}
                >
                  <CheckCircle className="w-4 h-4" />
                  Assigner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAssets;