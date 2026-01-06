// ============================================================================
// PAGE LISTE ALERTES MDM
// ============================================================================
// Fichier : client/src/pages/MDMAlertsPage.jsx
// Liste complète des alertes avec filtres et résolution
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';
import {
  AlertTriangle, AlertCircle, Info, CheckCircle, XCircle,
  RefreshCw, Filter, Calendar, Eye, Check
} from 'lucide-react';

const MDMAlertsPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    resolved: 'false',
    severity: ''
  });

  useEffect(() => {
    loadAlerts();
  }, [filters]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.resolved) params.append('resolved', filters.resolved);
      if (filters.severity) params.append('severity', filters.severity);
      params.append('limit', '100');

      const response = await fetch(`${API_URL}/api/mdm/alerts?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId) => {
    if (!window.confirm('Marquer cette alerte comme résolue ?')) return;

    try {
      const response = await fetch(`${API_URL}/api/mdm/alerts/${alertId}/resolve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolution_note: 'Résolu manuellement' })
      });

      if (response.ok) {
        loadAlerts();
      }
    } catch (error) {
      console.error('Erreur résolution alerte:', error);
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      critical: {
        label: 'Critique',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
      },
      warning: {
        label: 'Avertissement',
        color: 'bg-orange-100 text-orange-800',
        icon: AlertTriangle
      },
      info: {
        label: 'Info',
        color: 'bg-blue-100 text-blue-800',
        icon: Info
      }
    };
    const badge = badges[severity] || badges.info;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getAlertTypeLabel = (type) => {
    const types = {
      new_device: 'Nouveau matériel',
      low_disk: 'Espace disque',
      hardware_change: 'Changement matériel',
      software_change: 'Logiciels modifiés',
      os_update: 'Mise à jour OS',
      offline: 'Hors ligne'
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Alertes MDM</h1>
            <p className="text-gray-600">Liste complète des alertes système</p>
          </div>
          <button
            onClick={loadAlerts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filters.resolved}
                onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="false">Non résolues</option>
                <option value="true">Résolues</option>
                <option value="">Toutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sévérité
              </label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes</option>
                <option value="critical">Critique</option>
                <option value="warning">Avertissement</option>
                <option value="info">Information</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critiques</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.severity === 'critical' && !a.resolved).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avertissements</p>
                <p className="text-2xl font-bold text-orange-600">
                  {alerts.filter(a => a.severity === 'warning' && !a.resolved).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Infos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {alerts.filter(a => a.severity === 'info' && !a.resolved).length}
                </p>
              </div>
              <Info className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucune alerte</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Alerte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sévérité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className={`hover:bg-gray-50 ${alert.resolved ? 'opacity-60' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                        {getAlertTypeLabel(alert.alert_type)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </td>

                    <td className="px-6 py-4">
                      {alert.hostname ? (
                        <button
                          onClick={() => navigate(`/mdm/devices/${alert.device_id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {alert.hostname}
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {getSeverityBadge(alert.severity)}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(alert.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.created_at).toLocaleTimeString('fr-FR')}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {!alert.resolved && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Résoudre"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {alert.resolved && (
                        <span className="text-xs text-green-600 font-medium">
                          ✓ Résolue
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MDMAlertsPage;