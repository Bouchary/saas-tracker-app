// ============================================================================
// PAGE DASHBOARD MDM - PHASE B (VERSION FETCH)
// ============================================================================
// Fichier : client/src/pages/MDMDashboardPage.jsx
// Dashboard principal MDM avec stats et liste devices
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';
import {
  Monitor, Server, AlertTriangle, Activity, Clock,
  TrendingUp, Cpu, HardDrive, MemoryStick, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Eye
} from 'lucide-react';

const MDMDashboardPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Rafraîchir chaque minute
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, devicesRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/api/mdm/stats`, { headers }),
        fetch(`${API_URL}/api/mdm/devices?limit=10`, { headers }),
        fetch(`${API_URL}/api/mdm/alerts?resolved=false&limit=5`, { headers })
      ]);

      const statsData = await statsRes.json();
      const devicesData = await devicesRes.json();
      const alertsData = await alertsRes.json();

      setStats(statsData.stats || statsData);
      setDevices(devicesData.devices || []);
      setAlerts(alertsData.alerts || []);
    } catch (error) {
      console.error('Erreur chargement données MDM:', error);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard MDM</h1>
            <p className="text-gray-600">Monitoring en temps réel de votre parc informatique</p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Stats Cards */}
        {stats && stats.devices && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Devices</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.devices.total_devices || 0}
                  </p>
                </div>
                <Monitor className="w-12 h-12 text-blue-500" />
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span>Windows: {stats.devices.windows_devices || 0}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">En Ligne</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.devices.online_devices || 0}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {stats.devices.active_devices || 0} actifs
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hors Ligne</p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.devices.offline_devices || 0}
                  </p>
                </div>
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Nécessite attention
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Alertes Actives</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats.alerts?.unresolved_alerts || 0}
                  </p>
                </div>
                <AlertTriangle className="w-12 h-12 text-orange-500" />
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {stats.alerts?.critical_alerts || 0} critiques
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Devices List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Devices Récents</h2>
                <button
                  onClick={() => navigate('/mdm/devices')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Voir tout →
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {devices.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    Aucun device enregistré
                  </div>
                ) : (
                  devices.map((device) => {
                    const statusInfo = getConnectionStatus(device.last_seen);
                    return (
                      <div
                        key={device.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/mdm/devices/${device.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-3 h-3 rounded-full ${
                              statusInfo.color === 'green' ? 'bg-green-500' :
                              statusInfo.color === 'yellow' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{device.hostname}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                  statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {statusInfo.text}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {device.manufacturer} {device.model} • {device.os_version}
                              </p>
                              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Cpu className="w-3 h-3" />
                                  {device.cpu_cores} cores
                                </span>
                                <span className="flex items-center gap-1">
                                  <MemoryStick className="w-3 h-3" />
                                  {device.ram_gb}GB RAM
                                </span>
                                <span className="flex items-center gap-1">
                                  <HardDrive className="w-3 h-3" />
                                  {device.disk_free_gb}GB libre
                                </span>
                              </div>
                            </div>
                          </div>
                          <Eye className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Alerts Panel */}
          <div>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Alertes Récentes</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    Aucune alerte active
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className={`w-5 h-5 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'warning' ? 'text-orange-500' :
                          'text-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{alert.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'warning' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(alert.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MDMDashboardPage;