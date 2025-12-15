// ============================================================================
// ASSET DETAIL PAGE - Vue détaillée AVEC ICÔNES LUCIDE-REACT
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, Laptop, Smartphone, Monitor, Tablet, Keyboard, Box,
  Plus, ArrowLeft, Edit, Trash2, User, Calendar, FileText,
  CheckCircle, XCircle, Wrench, Archive, AlertCircle, DollarSign,
  MapPin, ShoppingCart, Tag
} from 'lucide-react';
import assetsApi from '../services/assetsApi';
import employeesApi from '../services/employeesApi';

const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [asset, setAsset] = useState(null);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // États pour assignation
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [assignForm, setAssignForm] = useState({
    employee_id: '',
    purpose: '',
    condition_on_assignment: 'good',
    assignment_notes: ''
  });
  const [unassignForm, setUnassignForm] = useState({
    condition_on_return: 'good',
    return_notes: ''
  });

  useEffect(() => {
    loadAsset();
    loadEmployees();
  }, [id]);

  const loadAsset = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assetsApi.getById(id);
      setAsset(data.asset);
      setCurrentAssignment(data.current_assignment);
      setHistory(data.assignment_history);
    } catch (err) {
      setError(err.message);
      console.error('Erreur chargement asset:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await employeesApi.getAll({ limit: 100, status: 'active' });
      setEmployees(data.employees);
    } catch (err) {
      console.error('Erreur chargement employés:', err);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    
    if (!assignForm.employee_id) {
      alert('Veuillez sélectionner un employé');
      return;
    }

    try {
      await assetsApi.assign(id, assignForm);
      alert('Asset assigné avec succès !');
      setShowAssignModal(false);
      loadAsset();
      setAssignForm({
        employee_id: '',
        purpose: '',
        condition_on_assignment: 'good',
        assignment_notes: ''
      });
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleUnassign = async (e) => {
    e.preventDefault();

    if (!window.confirm('Êtes-vous sûr de vouloir retourner cet asset ?')) {
      return;
    }

    try {
      await assetsApi.unassign(id, unassignForm);
      alert('Asset retourné avec succès !');
      setShowUnassignModal(false);
      loadAsset();
      setUnassignForm({
        condition_on_return: 'good',
        return_notes: ''
      });
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer cet asset ?')) {
      return;
    }
    
    try {
      await assetsApi.delete(id);
      alert('Asset marqué comme retiré');
      navigate('/assets');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { label: 'Disponible', className: 'asset-status-available' },
      assigned: { label: 'Assigné', className: 'asset-status-assigned' },
      maintenance: { label: 'Maintenance', className: 'asset-status-maintenance' },
      retired: { label: 'Retiré', className: 'asset-status-retired' },
      lost: { label: 'Perdu', className: 'asset-status-lost' }
    };
    
    const config = statusConfig[status] || { label: status, className: '' };
    return (
      <span className={`status-badge-large ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type, size = "w-12 h-12") => {
    const iconProps = { className: size, strokeWidth: 2 };
    
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
      case 'other':
      default:
        return <Box {...iconProps} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>
          <XCircle className="w-8 h-8 inline mr-2" />
          Erreur
        </h2>
        <p>{error}</p>
        <button onClick={() => navigate('/assets')}>Retour à la liste</button>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="error-page">
        <h2>Asset non trouvé</h2>
        <button onClick={() => navigate('/assets')}>Retour à la liste</button>
      </div>
    );
  }

  return (
    <div className="asset-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button onClick={() => navigate('/assets')} className="btn-back">
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Retour
        </button>
        
        <div className="header-actions">
          <button 
            onClick={() => navigate(`/assets/${id}/edit`)}
            className="btn btn-secondary"
          >
            <Edit className="w-4 h-4 inline mr-1" />
            Modifier
          </button>
          
          {asset.status === 'available' && (
            <button 
              onClick={() => setShowAssignModal(true)}
              className="btn btn-primary"
            >
              <User className="w-4 h-4 inline mr-1" />
              Assigner
            </button>
          )}
          
          {asset.status === 'assigned' && (
            <button 
              onClick={() => setShowUnassignModal(true)}
              className="btn btn-warning"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Retourner
            </button>
          )}
          
          <button 
            onClick={handleDelete}
            className="btn btn-danger"
          >
            <Trash2 className="w-4 h-4 inline mr-1" />
            Retirer
          </button>
        </div>
      </div>

      {/* Carte asset */}
      <div className="asset-card">
        <div className="asset-header">
          <div className="asset-icon">
            {getTypeIcon(asset.asset_type)}
          </div>
          
          <div className="asset-info">
            <h1>{asset.name}</h1>
            <p className="asset-tag-large">{asset.asset_tag}</p>
            <p className="asset-manufacturer">{asset.manufacturer} {asset.model}</p>
          </div>
          
          <div className="asset-status">
            {getStatusBadge(asset.status)}
          </div>
        </div>

        {/* Assignation actuelle */}
        {currentAssignment && (
          <div className="current-assignment">
            <h3>
              <MapPin className="w-5 h-5 inline mr-2" />
              Assignation actuelle
            </h3>
            <div className="assignment-info">
              <div className="assignment-employee">
                <strong>{currentAssignment.employee_name}</strong>
                <span>{currentAssignment.department}</span>
              </div>
              <div className="assignment-details">
                <span>
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Depuis le {formatDate(currentAssignment.assigned_date)}
                </span>
                <span>Objet : {currentAssignment.purpose}</span>
              </div>
            </div>
          </div>
        )}

        <div className="asset-meta">
          <div className="meta-item">
            <span className="meta-label">Type</span>
            <span className="meta-value">
              {getTypeIcon(asset.asset_type, "w-5 h-5 inline mr-1")} 
              {asset.asset_type}
            </span>
          </div>
          
          <div className="meta-item">
            <span className="meta-label">Numéro de série</span>
            <span className="meta-value">{asset.serial_number || '-'}</span>
          </div>
          
          <div className="meta-item">
            <span className="meta-label">Condition</span>
            <span className="meta-value">{asset.condition}</span>
          </div>
          
          <div className="meta-item">
            <span className="meta-label">Localisation</span>
            <span className="meta-value">{asset.location || '-'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Détails
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Historique ({history.length})
        </button>
      </div>

      {/* Contenu tabs */}
      <div className="tab-content">
        {activeTab === 'details' && (
          <div className="info-grid">
            <div className="info-section">
              <h3>
                <FileText className="w-5 h-5 inline mr-2" />
                Informations générales
              </h3>
              <div className="info-rows">
                <div className="info-row">
                  <span className="label">Asset Tag</span>
                  <span className="value">{asset.asset_tag}</span>
                </div>
                <div className="info-row">
                  <span className="label">Nom</span>
                  <span className="value">{asset.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Type</span>
                  <span className="value">{asset.asset_type}</span>
                </div>
                <div className="info-row">
                  <span className="label">Fabricant</span>
                  <span className="value">{asset.manufacturer || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Modèle</span>
                  <span className="value">{asset.model || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Numéro de série</span>
                  <span className="value">{asset.serial_number || '-'}</span>
                </div>
              </div>
            </div>

            {asset.specifications && (
              <div className="info-section">
                <h3>
                  <Wrench className="w-5 h-5 inline mr-2" />
                  Spécifications
                </h3>
                <div className="info-rows">
                  {Object.entries(asset.specifications).map(([key, value]) => (
                    <div className="info-row" key={key}>
                      <span className="label">{key}</span>
                      <span className="value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="info-section">
              <h3>
                <ShoppingCart className="w-5 h-5 inline mr-2" />
                Informations d'achat
              </h3>
              <div className="info-rows">
                <div className="info-row">
                  <span className="label">Date d'achat</span>
                  <span className="value">{formatDate(asset.purchase_date)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Prix</span>
                  <span className="value">
                    {asset.purchase_price ? `${asset.purchase_price} ${asset.currency}` : '-'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Garantie jusqu'au</span>
                  <span className="value">{formatDate(asset.warranty_end_date)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Fournisseur</span>
                  <span className="value">{asset.supplier || '-'}</span>
                </div>
              </div>
            </div>

            {asset.notes && (
              <div className="info-section full-width">
                <h3>
                  <FileText className="w-5 h-5 inline mr-2" />
                  Notes
                </h3>
                <p className="notes">{asset.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-list">
            {history.length === 0 ? (
              <p className="empty-state">Aucun historique d'assignation</p>
            ) : (
              history.map((assignment, index) => (
                <div key={index} className="history-item">
                  <div className="history-header">
                    <span className="history-employee">{assignment.employee_name}</span>
                    <span className={`history-status ${assignment.status}`}>
                      {assignment.status === 'active' ? (
                        <>
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Actif
                        </>
                      ) : (
                        <>
                          <ArrowLeft className="w-4 h-4 inline mr-1" />
                          Retourné
                        </>
                      )}
                    </span>
                  </div>
                  <div className="history-details">
                    <p>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      <strong>Période :</strong> {formatDate(assignment.assigned_date)} 
                      {assignment.actual_return_date && ` → ${formatDate(assignment.actual_return_date)}`}
                    </p>
                    {assignment.purpose && <p><strong>Objet :</strong> {assignment.purpose}</p>}
                    {assignment.assignment_notes && <p><strong>Notes :</strong> {assignment.assignment_notes}</p>}
                    {assignment.return_notes && <p><strong>Notes de retour :</strong> {assignment.return_notes}</p>}
                    {assignment.condition_on_return && (
                      <p><strong>Condition au retour :</strong> {assignment.condition_on_return}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Assignation */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              <User className="w-6 h-6 inline mr-2" />
              Assigner l'asset
            </h2>
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label>Employé *</label>
                <select
                  value={assignForm.employee_id}
                  onChange={(e) => setAssignForm({...assignForm, employee_id: e.target.value})}
                  required
                >
                  <option value="">Sélectionner un employé...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Objet *</label>
                <input
                  type="text"
                  value={assignForm.purpose}
                  onChange={(e) => setAssignForm({...assignForm, purpose: e.target.value})}
                  placeholder="Ex: Primary work laptop"
                  required
                />
              </div>

              <div className="form-group">
                <label>Condition</label>
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
                <label>Notes</label>
                <textarea
                  value={assignForm.assignment_notes}
                  onChange={(e) => setAssignForm({...assignForm, assignment_notes: e.target.value})}
                  rows="3"
                  placeholder="Notes optionnelles..."
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Assigner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Retour */}
      {showUnassignModal && (
        <div className="modal-overlay" onClick={() => setShowUnassignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              <ArrowLeft className="w-6 h-6 inline mr-2" />
              Retourner l'asset
            </h2>
            <form onSubmit={handleUnassign}>
              <div className="form-group">
                <label>Condition au retour</label>
                <select
                  value={unassignForm.condition_on_return}
                  onChange={(e) => setUnassignForm({...unassignForm, condition_on_return: e.target.value})}
                >
                  <option value="new">Neuf</option>
                  <option value="good">Bon</option>
                  <option value="fair">Moyen</option>
                  <option value="poor">Mauvais</option>
                  <option value="damaged">Endommagé</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes de retour</label>
                <textarea
                  value={unassignForm.return_notes}
                  onChange={(e) => setUnassignForm({...unassignForm, return_notes: e.target.value})}
                  rows="3"
                  placeholder="État de l'asset, problèmes rencontrés..."
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowUnassignModal(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-warning">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Confirmer le retour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDetailPage;