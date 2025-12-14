// ============================================================================
// EMPLOYEE DETAIL PAGE - Vue 360° d'un employé
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import employeesApi from '../services/employeesApi';

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('infos');

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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Actif', className: 'status-active', icon: '✅' },
      onboarding: { label: 'Onboarding', className: 'status-onboarding', icon: '🚀' },
      offboarding: { label: 'Offboarding', className: 'status-offboarding', icon: '👋' },
      on_leave: { label: 'En congé', className: 'status-leave', icon: '🏖️' },
      exited: { label: 'Sorti', className: 'status-exited', icon: '❌' }
    };
    
    const config = statusConfig[status] || { label: status, className: '', icon: '' };
    return (
      <span className={`status-badge-large ${config.className}`}>
        {config.icon} {config.label}
      </span>
    );
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
        <h2>❌ Erreur</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/employees')}>Retour à la liste</button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="error-page">
        <h2>Employé non trouvé</h2>
        <button onClick={() => navigate('/employees')}>Retour à la liste</button>
      </div>
    );
  }

  return (
    <div className="employee-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button onClick={() => navigate('/employees')} className="btn-back">
          ← Retour
        </button>
        
        <div className="header-actions">
          <button 
            onClick={() => navigate(`/employees/${id}/edit`)}
            className="btn btn-secondary"
          >
            ✏️ Modifier
          </button>
          <button 
            onClick={handleDelete}
            className="btn btn-danger"
          >
            🗑️ Marquer comme sorti
          </button>
        </div>
      </div>

      {/* Carte employé */}
      <div className="employee-card">
        <div className="employee-header">
          <div className="employee-avatar">
            {employee.profile_photo_url ? (
              <img src={employee.profile_photo_url} alt={employee.first_name} />
            ) : (
              <div className="avatar-placeholder">
                {employee.first_name[0]}{employee.last_name[0]}
              </div>
            )}
          </div>
          
          <div className="employee-info">
            <h1>{employee.first_name} {employee.last_name}</h1>
            <p className="job-title">{employee.job_title}</p>
            <p className="employee-number">#{employee.employee_number}</p>
          </div>
          
          <div className="employee-status">
            {getStatusBadge(employee.status)}
          </div>
        </div>

        <div className="employee-meta">
          <div className="meta-item">
            <span className="meta-label">📧 Email</span>
            <span className="meta-value">
              <a href={`mailto:${employee.email}`}>{employee.email}</a>
            </span>
          </div>
          
          {employee.phone && (
            <div className="meta-item">
              <span className="meta-label">📞 Téléphone</span>
              <span className="meta-value">{employee.phone}</span>
            </div>
          )}
          
          <div className="meta-item">
            <span className="meta-label">🏢 Département</span>
            <span className="meta-value">{employee.department}</span>
          </div>
          
          <div className="meta-item">
            <span className="meta-label">📍 Localisation</span>
            <span className="meta-value">{employee.office_location || '-'}</span>
          </div>
          
          <div className="meta-item">
            <span className="meta-label">💼 Mode de travail</span>
            <span className="meta-value">
              {employee.work_mode === 'remote' ? '🏠 Remote' :
               employee.work_mode === 'hybrid' ? '🔀 Hybride' :
               '🏢 Sur site'}
            </span>
          </div>
          
          <div className="meta-item">
            <span className="meta-label">📅 Date de début</span>
            <span className="meta-value">{formatDate(employee.start_date)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'infos' ? 'active' : ''}`}
          onClick={() => setActiveTab('infos')}
        >
          Informations
        </button>
        <button
          className={`tab ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          Matériel (À venir)
        </button>
        <button
          className={`tab ${activeTab === 'workflows' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflows')}
        >
          Workflows (À venir)
        </button>
      </div>

      {/* Contenu tabs */}
      <div className="tab-content">
        {activeTab === 'infos' && (
          <div className="info-grid">
            <div className="info-section">
              <h3>📋 Informations générales</h3>
              <div className="info-rows">
                <div className="info-row">
                  <span className="label">Matricule</span>
                  <span className="value">{employee.employee_number}</span>
                </div>
                <div className="info-row">
                  <span className="label">Poste</span>
                  <span className="value">{employee.job_title}</span>
                </div>
                <div className="info-row">
                  <span className="label">Département</span>
                  <span className="value">{employee.department}</span>
                </div>
                {employee.team && (
                  <div className="info-row">
                    <span className="label">Équipe</span>
                    <span className="value">{employee.team}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="label">Type de contrat</span>
                  <span className="value">
                    {employee.employment_type === 'full_time' ? 'Temps plein' :
                     employee.employment_type === 'part_time' ? 'Temps partiel' :
                     employee.employment_type === 'contractor' ? 'Contractant' :
                     employee.employment_type === 'intern' ? 'Stagiaire' :
                     employee.employment_type}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>📅 Dates importantes</h3>
              <div className="info-rows">
                <div className="info-row">
                  <span className="label">Date d'embauche</span>
                  <span className="value">{formatDate(employee.hire_date)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Date de début</span>
                  <span className="value">{formatDate(employee.start_date)}</span>
                </div>
                {employee.probation_end_date && (
                  <div className="info-row">
                    <span className="label">Fin période d'essai</span>
                    <span className="value">{formatDate(employee.probation_end_date)}</span>
                  </div>
                )}
                {employee.end_date && (
                  <div className="info-row">
                    <span className="label">Date de fin</span>
                    <span className="value">{formatDate(employee.end_date)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="info-section">
              <h3>📍 Localisation</h3>
              <div className="info-rows">
                <div className="info-row">
                  <span className="label">Bureau</span>
                  <span className="value">{employee.office_location || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Ville</span>
                  <span className="value">{employee.city || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Pays</span>
                  <span className="value">{employee.country || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Mode de travail</span>
                  <span className="value">
                    {employee.work_mode === 'remote' ? 'Remote' :
                     employee.work_mode === 'hybrid' ? 'Hybride' :
                     'Sur site'}
                  </span>
                </div>
              </div>
            </div>

            {employee.notes && (
              <div className="info-section full-width">
                <h3>📝 Notes</h3>
                <p className="notes">{employee.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="placeholder">
            <p>🚧 Module Matériel à venir (Phase 2)</p>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="placeholder">
            <p>🚧 Module Workflows à venir (Phase 3)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailPage;