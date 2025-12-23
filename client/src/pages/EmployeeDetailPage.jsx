// ============================================================================
// EMPLOYEE DETAIL PAGE - COMPLET avec Matériel, Workflows et Création Workflow
// ✅ CORRIGÉ : Noms de champs (office_location, employment_type, manager)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Briefcase, 
  Calendar, User, FileText, Building, Home, Shuffle, XCircle, GitBranch,
  Plus, Users
} from 'lucide-react';
import employeesApi from '../services/employeesApi';
import EmployeeAssets from '../components/EmployeeAssets';
import EmployeeWorkflowsTab from '../components/employees/EmployeeWorkflowsTab';
import CreateWorkflowWithAssignment from '../components/CreateWorkflowWithAssignment';

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('infos');
  const [showCreateWorkflowModal, setShowCreateWorkflowModal] = useState(false);

  // ✅ AJOUTÉ : Labels pour employment_type
  const employmentTypeLabels = {
    'full_time': 'Temps plein',
    'part_time': 'Temps partiel',
    'contractor': 'Contractant',
    'intern': 'Stagiaire',
    'temporary': 'Temporaire'
  };

  // ✅ AJOUTÉ : Labels pour work_mode
  const workModeLabels = {
    'on_site': 'Sur site',
    'remote': 'Remote',
    'hybrid': 'Hybride'
  };

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeesApi.getById(id);
      setEmployee(data.employee);
    } catch (err) {
      setError(err.message);
      console.error('Erreur chargement employé:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir marquer cet employé comme sorti ?')) {
      return;
    }
    
    try {
      await employeesApi.delete(id);
      alert('Employé marqué comme sorti');
      navigate('/employees');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleWorkflowCreated = () => {
    loadEmployee();
    setActiveTab('workflows');
    setShowCreateWorkflowModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Actif', className: 'status-active' },
      onboarding: { label: 'Onboarding', className: 'status-onboarding' },
      offboarding: { label: 'Offboarding', className: 'status-offboarding' },
      on_leave: { label: 'En congé', className: 'status-leave' },
      exited: { label: 'Sorti', className: 'status-exited' }
    };
    
    const config = statusConfig[status] || { label: status, className: '' };
    return (
      <span className={`status-badge-large ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="error-page">
        <XCircle size={64} />
        <h2>Erreur</h2>
        <p>{error || 'Employé non trouvé'}</p>
        <button onClick={() => navigate('/employees')} className="btn-primary">
          <ArrowLeft size={18} />
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <button onClick={() => navigate('/employees')} className="btn-back">
          <ArrowLeft size={20} />
          Retour
        </button>
        
        <div className="header-title">
          <div className="flex items-center gap-4">
            <div className="employee-avatar">
              <User size={40} />
            </div>
            <div>
              <h1 className="page-title">
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="text-gray-600">{employee.job_title || 'Poste non défini'}</p>
            </div>
          </div>
          {getStatusBadge(employee.status)}
        </div>

        <div className="header-actions">
          <button 
            onClick={() => setShowCreateWorkflowModal(true)}
            className="btn-primary"
          >
            <Plus size={18} />
            Créer un workflow
          </button>
          <button onClick={() => navigate(`/employees/${id}/edit`)} className="btn-secondary">
            <Edit size={18} />
            Modifier
          </button>
          <button onClick={handleDelete} className="btn-danger">
            <Trash2 size={18} />
            Sortie
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'infos' ? 'active' : ''}`}
          onClick={() => setActiveTab('infos')}
        >
          <User size={18} />
          Informations
        </button>
        <button
          className={`tab-button ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          <Package size={18} />
          Matériel
        </button>
        <button
          className={`tab-button ${activeTab === 'workflows' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflows')}
        >
          <GitBranch size={18} />
          Workflows
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'infos' && (
          <div className="info-grid">
            {/* Contact Information */}
            <div className="info-card">
              <h3 className="info-card-title">
                <Mail size={20} />
                Informations de contact
              </h3>
              <div className="info-list">
                <div className="info-item">
                  <Mail size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Email professionnel</span>
                    <span className="info-value">{employee.email || '-'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Mail size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Email personnel</span>
                    <span className="info-value">{employee.personal_email || '-'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Phone size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Téléphone</span>
                    <span className="info-value">{employee.phone || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="info-card">
              <h3 className="info-card-title">
                <Briefcase size={20} />
                Informations professionnelles
              </h3>
              <div className="info-list">
                <div className="info-item">
                  <FileText size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Poste</span>
                    <span className="info-value">{employee.job_title || '-'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Building size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Département</span>
                    <span className="info-value">{employee.department || '-'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Users size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Équipe</span>
                    <span className="info-value">{employee.team || '-'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <User size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Manager</span>
                    <span className="info-value">{employee.manager_name || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Localisation */}
            <div className="info-card">
              <h3 className="info-card-title">
                <MapPin size={20} />
                Localisation
              </h3>
              <div className="info-list">
                <div className="info-item">
                  <Building size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Bureau</span>
                    <span className="info-value">{employee.office_location || '-'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <MapPin size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Ville</span>
                    <span className="info-value">{employee.city || '-'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <MapPin size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Pays</span>
                    <span className="info-value">{employee.country || '-'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Home size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Mode de travail</span>
                    <span className="info-value">
                      {employee.work_mode ? workModeLabels[employee.work_mode] : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Information */}
            <div className="info-card">
              <h3 className="info-card-title">
                <FileText size={20} />
                Informations contractuelles
              </h3>
              <div className="info-list">
                <div className="info-item">
                  <Calendar size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Date d'embauche</span>
                    <span className="info-value">{formatDate(employee.hire_date)}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Calendar size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Date de début</span>
                    <span className="info-value">{formatDate(employee.start_date)}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FileText size={16} className="info-icon" />
                  <div>
                    <span className="info-label">Type de contrat</span>
                    <span className="info-value">
                      {employee.employment_type ? employmentTypeLabels[employee.employment_type] : '-'}
                    </span>
                  </div>
                </div>
                {employee.end_date && (
                  <div className="info-item">
                    <Calendar size={16} className="info-icon" />
                    <div>
                      <span className="info-label">Date de sortie</span>
                      <span className="info-value">{formatDate(employee.end_date)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            {employee.notes && (
              <div className="info-card full-width">
                <h3 className="info-card-title">
                  <FileText size={20} />
                  Notes
                </h3>
                <p className="notes-text">{employee.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'equipment' && (
          <EmployeeAssets employeeId={id} employeeName={`${employee.first_name} ${employee.last_name}`} />
        )}

        {activeTab === 'workflows' && (
          <EmployeeWorkflowsTab employeeId={id} />
        )}
      </div>

      {showCreateWorkflowModal && (
        <CreateWorkflowWithAssignment
          employee={employee}
          onClose={() => setShowCreateWorkflowModal(false)}
          onSuccess={handleWorkflowCreated}
        />
      )}

      <style jsx>{`
        .page-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          color: #6b7280;
          cursor: pointer;
          margin-bottom: 1rem;
          transition: all 0.2s;
        }

        .btn-back:hover {
          background: #f9fafb;
          color: #111827;
        }

        .header-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .employee-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .page-title {
          font-size: 2rem;
          font-weight: bold;
          color: #111827;
          margin: 0;
        }

        .status-badge-large {
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .status-active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-onboarding {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-offboarding {
          background: #fed7aa;
          color: #92400e;
        }

        .status-leave {
          background: #fef3c7;
          color: #92400e;
        }

        .status-exited {
          background: #fee2e2;
          color: #991b1b;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-primary, .btn-secondary, .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: white;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .tabs-container {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 2rem;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-weight: 500;
          position: relative;
          transition: all 0.2s;
        }

        .tab-button:hover {
          color: #3b82f6;
        }

        .tab-button.active {
          color: #3b82f6;
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: #3b82f6;
        }

        .tab-content {
          min-height: 400px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .info-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
        }

        .info-card.full-width {
          grid-column: 1 / -1;
        }

        .info-card-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 1.5rem;
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          gap: 1rem;
        }

        .info-icon {
          color: #6b7280;
          flex-shrink: 0;
        }

        .info-label {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .info-value {
          display: block;
          font-weight: 500;
          color: #111827;
        }

        .notes-text {
          color: #4b5563;
          line-height: 1.6;
        }

        .loading-page, .error-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
        }

        .loading-spinner {
          width: 64px;
          height: 64px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDetailPage;