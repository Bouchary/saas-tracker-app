// client/src/pages/PurchaseRequestsListPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PurchaseRequestsListPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    urgency: '',
    minAmount: '',
    maxAmount: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRequests: 0
  });

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    in_approval: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    converted: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const statusLabels = {
    draft: 'Brouillon',
    pending: 'En attente',
    in_approval: 'En validation',
    approved: 'Approuvée',
    rejected: 'Rejetée',
    converted: 'Convertie',
    cancelled: 'Annulée'
  };

  const urgencyColors = {
    normal: 'text-gray-600',
    urgent: 'text-orange-600',
    critical: 'text-red-600'
  };

  const urgencyIcons = {
    normal: '🟢',
    urgent: '🟠',
    critical: '🔴'
  };

  useEffect(() => {
    loadRequests();
    loadStats();
  }, [filters, pagination.currentPage]);

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: 20,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/purchase-requests?${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRequests(response.data.requests);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/purchase-requests/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      urgency: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  const deleteRequest = async (id) => {
    if (!confirm('Supprimer cette demande ?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/purchase-requests/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadRequests();
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.error || 'Impossible de supprimer'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demandes d'achat</h1>
          <p className="text-gray-600 mt-1">Gérez vos demandes de validation</p>
        </div>
        <Link
          to="/purchase-requests/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          + Nouvelle demande
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total demandes</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total_requests}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Montant total</div>
            <div className="text-3xl font-bold text-gray-900">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }).format(stats.total_amount)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">En attente</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.by_status?.find(s => s.status === 'in_approval')?.count || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Urgentes</div>
            <div className="text-3xl font-bold text-red-600">{stats.urgent_count}</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="in_approval">En validation</option>
            <option value="approved">Approuvée</option>
            <option value="rejected">Rejetée</option>
            <option value="converted">Convertie</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes catégories</option>
            <option value="Équipement informatique">Équipement informatique</option>
            <option value="Logiciels & Licences">Logiciels & Licences</option>
            <option value="Mobilier">Mobilier</option>
            <option value="Services">Services</option>
            <option value="Formation">Formation</option>
            <option value="Fournitures">Fournitures</option>
            <option value="Autre">Autre</option>
          </select>

          <select
            value={filters.urgency}
            onChange={(e) => handleFilterChange('urgency', e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes urgences</option>
            <option value="normal">Normale</option>
            <option value="urgent">Urgente</option>
            <option value="critical">Critique</option>
          </select>

          <input
            type="number"
            placeholder="Montant min"
            value={filters.minAmount}
            onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <button
            onClick={clearFilters}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Demande
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Validation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/purchase-requests/${request.id}`)}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="mr-2">{urgencyIcons[request.urgency]}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {request.request_number}
                      </div>
                      <div className="text-sm text-gray-600">{request.title}</div>
                      <div className="text-xs text-gray-500">{request.category}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: request.currency
                    }).format(request.amount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[request.status]}`}>
                    {statusLabels[request.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {request.status === 'in_approval' && (
                    <div className="text-sm text-gray-600">
                      {request.approved_count || 0} / {request.total_approvers} validations
                    </div>
                  )}
                  {request.status === 'approved' && (
                    <div className="text-sm text-green-600">✓ Validée</div>
                  )}
                  {request.status === 'rejected' && (
                    <div className="text-sm text-red-600">✗ Rejetée</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(request.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                  <Link
                    to={`/purchase-requests/${request.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Voir
                  </Link>
                  {request.status === 'draft' && (
                    <>
                      <Link
                        to={`/purchase-requests/${request.id}/edit`}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Modifier
                      </Link>
                      <button
                        onClick={() => deleteRequest(request.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {requests.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucune demande trouvée
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Précédent
          </button>
          <span className="text-gray-700">
            Page {pagination.currentPage} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequestsListPage;