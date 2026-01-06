// ============================================================================
// PAGE LISTE DEVICES MDM COMPLÈTE
// ============================================================================
// Fichier : client/src/pages/MDMDevicesListPage.jsx
// Liste complète des devices avec pagination, filtres, recherche
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';
import {
  Monitor, Search, Filter, RefreshCw, Eye, Trash2,
  CheckCircle, XCircle, AlertCircle, Cpu, MemoryStick,
  HardDrive, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';

const MDMDevicesListPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    os_type: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadDevices();
  }, [filters]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.os_type) params.append('os_type', filters.os_type);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await fetch(`${API_URL}/api/mdm/devices?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        setDevices(data.devices || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Erreur chargement devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatus = (lastSeen) => {
    if (!lastSeen) return { status: 'offline', color: 'red', text: 'Hors ligne' };
    const diff = Date.now() - new Date(lastSeen).getTime();
    if (diff < 10 * 60 * 1000) return { status: 'online', color: 'green', text: 'En ligne' };
    if (diff < 24 * 60 * 60 * 1000) return { status: 'inactive', color: 'yellow', text: 'Inactif' };
    return { status: 'offline', color: 'red', text: 'Hors ligne' };
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactif', color: 'bg-gray-100 text-gray-800' },
      decommissioned: { label: 'Désactivé', color: 'bg-red-100 text-red-800' }
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Devices MDM</h1>
            <p className="text-gray-600">Liste complète de tous les appareils</p>
          </div>
          <button
            onClick={loadDevices}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par hostname, serial..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>

            <div>
              <select
                value={filters.os_type}
                onChange={(e) => setFilters({ ...filters, os_type: e.target.value, page: 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les OS</option>
                <option value="windows">Windows</option>
                <option value="macos">macOS</option>
                <option value="linux">Linux</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : devices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucun device trouvé</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière vue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alertes</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {devices.map((device) => {
                    const statusInfo = getConnectionStatus(device.last_seen);
                    return (
                      <tr key={device.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              statusInfo.color === 'green' ? 'bg-green-500' :
                              statusInfo.color === 'yellow' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            <div>
                              <p className="font-medium text-gray-900">{device.hostname}</p>
                              <p className="text-sm text-gray-500">
                                {device.manufacturer} {device.model}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {getStatusBadge(device.status)}
                          <p className="text-xs text-gray-500 mt-1">{statusInfo.text}</p>
                        </td>

                        <td className="px-6 py-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Cpu className="w-3 h-3" />
                              {device.cpu_cores} cores
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <MemoryStick className="w-3 h-3" />
                              {device.ram_gb}GB RAM
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <HardDrive className="w-3 h-3" />
                              {device.disk_free_gb}GB libre
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {device.last_seen
                              ? new Date(device.last_seen).toLocaleDateString('fr-FR')
                              : 'Jamais'}
                          </div>
                          <p className="text-xs text-gray-500">
                            {device.last_seen
                              ? new Date(device.last_seen).toLocaleTimeString('fr-FR')
                              : ''}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          {device.unresolved_alerts_count > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {device.unresolved_alerts_count}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">Aucune</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(`/mdm/devices/${device.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-gray-600">
                  Page {pagination.page} sur {pagination.pages} ({pagination.total} devices)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Précédent
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MDMDevicesListPage;