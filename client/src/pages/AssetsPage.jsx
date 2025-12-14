// ============================================================================
// ASSETS PAGE - Liste des assets
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import assetsApi from '../services/assetsApi';

const AssetsPage = () => {
  const navigate = useNavigate();
  
  // États
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Filtres
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    asset_type: '',
    status: '',
    manufacturer: '',
    search: ''
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });

  // Charger les assets et stats
  useEffect(() => {
    loadAssets();
    loadStats();
  }, [filters]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assetsApi.getAll(filters);
      setAssets(data.assets);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Erreur chargement assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await assetsApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  };

  // Gérer les changements de filtres
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1
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
      available: { label: 'Disponible', className: 'asset-status-available' },
      assigned: { label: 'Assigné', className: 'asset-status-assigned' },
      maintenance: { label: 'Maintenance', className: 'asset-status-maintenance' },
      retired: { label: 'Retiré', className: 'asset-status-retired' },
      lost: { label: 'Perdu', className: 'asset-status-lost' }
    };
    
    const config = statusConfig[status] || { label: status, className: '' };
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  // Formater le type pour l'affichage
  const getTypeIcon = (type) => {
    const icons = {
      laptop: '💻',
      phone: '📱',
      monitor: '🖥️',
      tablet: '📱',
      accessory: '⌨️',
      other: '📦'
    };
    return icons[type] || '📦';
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="assets-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>💻 Matériel IT</h1>
          <p className="subtitle">{pagination.total} asset{pagination.total > 1 ? 's' : ''}</p>
        </div>
        <div className="header-right">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/assets/new')}
          >
            + Nouvel asset
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_assets}</div>
              <div className="stat-label">Total Assets</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.by_status?.available || 0}</div>
              <div className="stat-label">Disponibles</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <div className="stat-value">{stats.by_status?.assigned || 0}</div>
              <div className="stat-label">Assignés</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔧</div>
            <div className="stat-content">
              <div className="stat-value">{stats.by_status?.maintenance || 0}</div>
              <div className="stat-label">En maintenance</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Rechercher (tag, nom, modèle, série)..."
            value={filters.search}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <select
          value={filters.asset_type}
          onChange={(e) => handleFilterChange('asset_type', e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les types</option>
          <option value="laptop">💻 Laptop</option>
          <option value="phone">📱 Phone</option>
          <option value="monitor">🖥️ Monitor</option>
          <option value="tablet">📱 Tablet</option>
          <option value="accessory">⌨️ Accessory</option>
          <option value="other">📦 Other</option>
        </select>
        
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les statuts</option>
          <option value="available">Disponible</option>
          <option value="assigned">Assigné</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retiré</option>
        </select>

        <select
          value={filters.manufacturer}
          onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les fabricants</option>
          <option value="Apple">Apple</option>
          <option value="Dell">Dell</option>
          <option value="Lenovo">Lenovo</option>
          <option value="Samsung">Samsung</option>
          <option value="HP">HP</option>
          <option value="LG">LG</option>
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
          <button onClick={loadAssets}>Réessayer</button>
        </div>
      ) : assets.length === 0 ? (
        <div className="empty-state">
          <p>Aucun asset trouvé</p>
          {(filters.search || filters.asset_type || filters.status || filters.manufacturer) && (
            <button 
              onClick={() => setFilters({ page: 1, limit: 20, asset_type: '', status: '', manufacturer: '', search: '' })}
              className="btn-link"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="assets-table-container">
            <table className="assets-table">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Type</th>
                  <th>Nom</th>
                  <th>Fabricant</th>
                  <th>Modèle</th>
                  <th>Assigné à</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr 
                    key={asset.id}
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    className="table-row-clickable"
                  >
                    <td>
                      <span className="asset-tag">{asset.asset_tag}</span>
                    </td>
                    <td>
                      <span className="asset-type-icon">
                        {getTypeIcon(asset.asset_type)} {asset.asset_type}
                      </span>
                    </td>
                    <td>
                      <div className="asset-name">
                        <strong>{asset.name}</strong>
                      </div>
                    </td>
                    <td>{asset.manufacturer || '-'}</td>
                    <td className="asset-model">{asset.model || '-'}</td>
                    <td>
                      {asset.assigned_to_name ? (
                        <div className="assigned-info">
                          <span className="assigned-name">{asset.assigned_to_name}</span>
                          <span className="assigned-dept">{asset.assigned_to_department}</span>
                        </div>
                      ) : (
                        <span className="not-assigned">-</span>
                      )}
                    </td>
                    <td>{getStatusBadge(asset.status)}</td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/assets/${asset.id}/edit`);
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

export default AssetsPage;