// ============================================================================
// EMPLOYEES PAGE - Liste des employés
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import employeesApi from '../services/employeesApi';

const EmployeesPage = () => {
  const navigate = useNavigate();
  
  // États
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtres
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    department: '',
    search: ''
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });

  // Charger les employés
  useEffect(() => {
    loadEmployees();
  }, [filters]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeesApi.getAll(filters);
      setEmployees(data.employees);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Erreur chargement employés:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gérer les changements de filtres
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset page à 1 quand on change les filtres
    }));
  };

  // Gérer la recherche
  const handleSearch = (e) => {
    handleFilterChange('search', e.target.value);
  };

  // Gérer la pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Formater le statut pour l'affichage
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Actif', className: 'status-active' },
      onboarding: { label: 'Onboarding', className: 'status-onboarding' },
      offboarding: { label: 'Offboarding', className: 'status-offboarding' },
      on_leave: { label: 'En congé', className: 'status-leave' },
      exited: { label: 'Sorti', className: 'status-exited' }
    };
    
    const config = statusConfig[status] || { label: status, className: '' };
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="employees-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>👥 Employés</h1>
          <p className="subtitle">{pagination.total} employé{pagination.total > 1 ? 's' : ''}</p>
        </div>
        <div className="header-right">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/employees/new')}
          >
            + Nouvel employé
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Rechercher un employé..."
            value={filters.search}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <select
          value={filters.department}
          onChange={(e) => handleFilterChange('department', e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les départements</option>
          <option value="IT">IT</option>
          <option value="Marketing">Marketing</option>
          <option value="Sales">Sales</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
        </select>
        
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="onboarding">Onboarding</option>
          <option value="offboarding">Offboarding</option>
          <option value="on_leave">En congé</option>
        </select>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={loadEmployees}>Réessayer</button>
        </div>
      ) : employees.length === 0 ? (
        <div className="empty-state">
          <p>Aucun employé trouvé</p>
          {(filters.search || filters.department || filters.status) && (
            <button 
              onClick={() => setFilters({ page: 1, limit: 20, status: '', department: '', search: '' })}
              className="btn-link"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="employees-table-container">
            <table className="employees-table">
              <thead>
                <tr>
                  <th>N° Matricule</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Poste</th>
                  <th>Département</th>
                  <th>Localisation</th>
                  <th>Date de début</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(employee => (
                  <tr 
                    key={employee.id}
                    onClick={() => navigate(`/employees/${employee.id}`)}
                    className="table-row-clickable"
                  >
                    <td>
                      <span className="employee-number">{employee.employee_number}</span>
                    </td>
                    <td>
                      <div className="employee-name">
                        <strong>{employee.first_name} {employee.last_name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="employee-email">{employee.email}</span>
                    </td>
                    <td>{employee.job_title}</td>
                    <td>
                      <span className="department-badge">{employee.department}</span>
                    </td>
                    <td>{employee.office_location || '-'}</td>
                    <td>{formatDate(employee.start_date)}</td>
                    <td>{getStatusBadge(employee.status)}</td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employees/${employee.id}/edit`);
                        }}
                        className="btn-icon"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-pagination"
              >
                ← Précédent
              </button>
              
              <span className="pagination-info">
                Page {pagination.page} sur {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn-pagination"
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeesPage;