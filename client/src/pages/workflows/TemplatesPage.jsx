// ============================================================================
// PAGE TEMPLATES - Gestion des templates de workflows
// ============================================================================
// Fichier : client/src/pages/workflows/TemplatesPage.jsx
// Route : /workflows/templates
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import {
  FileText, Plus, Edit, Rocket, LogOut, Users, Building,
  CheckCircle2, Filter, Search, RefreshCw, AlertCircle, XCircle,
  Clock, TrendingUp, Zap
} from 'lucide-react';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { token: authToken } = useAuth();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    department: 'all',
    search: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, [filters.type, filters.department]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = authToken || localStorage.getItem('userToken') || localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.department !== 'all') params.append('department', filters.department);

      const url = `${apiUrl}/api/workflows/templates?${params.toString()}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.templates || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Impossible de charger les templates');
    } finally {
      setLoading(false);
    }
  };

  // Format number with thousands separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Filter templates by search
  const filteredTemplates = templates.filter(template => {
    if (filters.search === '') return true;

    const searchLower = filters.search.toLowerCase();
    return (
      template.name.toLowerCase().includes(searchLower) ||
      template.description?.toLowerCase().includes(searchLower) ||
      template.department?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const stats = {
    total: templates.length,
    onboarding: templates.filter(t => t.type === 'onboarding').length,
    offboarding: templates.filter(t => t.type === 'offboarding').length,
    active: templates.filter(t => t.is_active).length,
    totalTasks: templates.reduce((sum, t) => sum + (parseInt(t.total_tasks) || 0), 0)
  };

  const getTypeBadge = (type) => {
    return type === 'onboarding' ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <Rocket className="w-3 h-3" />
        Onboarding
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
        <LogOut className="w-3 h-3" />
        Offboarding
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Chargement des templates...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Templates de Workflows
              </h1>
              <p className="mt-2 text-gray-600">
                Gérez les modèles de workflows réutilisables
              </p>
            </div>
            <button
              onClick={() => navigate('/workflows/templates/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <Plus className="w-5 h-5" />
              Créer un template
            </button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.total)}</p>
            </div>

            <div className="bg-green-50 rounded-lg shadow-sm border-2 border-green-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-green-600">Onboarding</p>
                <Rocket className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-700">{formatNumber(stats.onboarding)}</p>
            </div>

            <div className="bg-orange-50 rounded-lg shadow-sm border-2 border-orange-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-orange-600">Offboarding</p>
                <LogOut className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-orange-700">{formatNumber(stats.offboarding)}</p>
            </div>

            <div className="bg-blue-50 rounded-lg shadow-sm border-2 border-blue-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-600">Actifs</p>
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-700">{formatNumber(stats.active)}</p>
            </div>

            <div className="bg-purple-50 rounded-lg shadow-sm border-2 border-purple-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-purple-600">Total tâches</p>
                <Zap className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-purple-700">{formatNumber(stats.totalTasks)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Search className="w-4 h-4" />
                  Rechercher
                </label>
                <input
                  type="text"
                  placeholder="Nom, description..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Type filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Filter className="w-4 h-4" />
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="all">Tous les types</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="offboarding">Offboarding</option>
                </select>
              </div>

              {/* Department filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Département
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="all">Tous les départements</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              {/* Refresh button */}
              <button
                onClick={fetchTemplates}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Templates list */}
        {error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-800 font-medium mb-4">{error}</p>
            <button
              onClick={fetchTemplates}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun template trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              {templates.length === 0
                ? "Commencez par créer votre premier template de workflow."
                : "Aucun template ne correspond à vos critères de recherche."}
            </p>
            {templates.length === 0 ? (
              <button
                onClick={() => navigate('/workflows/templates/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Créer mon premier template
              </button>
            ) : (
              <button
                onClick={() => setFilters({ type: 'all', department: 'all', search: '' })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{formatNumber(filteredTemplates.length)}</span> template{filteredTemplates.length > 1 ? 's' : ''} trouvé{filteredTemplates.length > 1 ? 's' : ''}
              {filters.search && ` pour "${filters.search}"`}
            </div>

            {/* Templates grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-6 group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {getTypeBadge(template.type)}
                        {template.is_default && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            Par défaut
                          </span>
                        )}
                        {!template.is_active && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            Inactif
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/workflows/templates/${template.id}/edit`)}
                      className="flex-shrink-0 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Éditer"
                    >
                      <Edit className="w-5 h-5 text-blue-600" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      {template.department && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building className="w-4 h-4" />
                          <span>{template.department}</span>
                        </div>
                      )}
                      {template.job_title && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{template.job_title}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">{formatNumber(template.total_tasks || 0)}</span>
                          <span>tâches</span>
                        </div>
                        {template.automated_tasks > 0 && (
                          <div className="flex items-center gap-2 text-purple-600">
                            <Zap className="w-4 h-4" />
                            <span className="font-medium">{formatNumber(template.automated_tasks)}</span>
                            <span>auto</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tasks by team */}
                    {template.tasks_by_team && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Répartition par équipe :</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          {template.tasks_by_team.IT > 0 && (
                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                              💻 IT: {template.tasks_by_team.IT}
                            </span>
                          )}
                          {template.tasks_by_team.HR > 0 && (
                            <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded">
                              👥 HR: {template.tasks_by_team.HR}
                            </span>
                          )}
                          {template.tasks_by_team.Manager > 0 && (
                            <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
                              👔 Manager: {template.tasks_by_team.Manager}
                            </span>
                          )}
                          {template.tasks_by_team.Finance > 0 && (
                            <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded">
                              💰 Finance: {template.tasks_by_team.Finance}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => navigate(`/workflows/templates/${template.id}/edit`)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier le template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesPage;
