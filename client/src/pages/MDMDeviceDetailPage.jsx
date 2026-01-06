// ============================================================================
// PAGE DÉTAILS DEVICE MDM
// ============================================================================
// Fichier : client/src/pages/MDMDeviceDetailPage.jsx
// Fiche complète d'un device avec historique et alertes
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';
import {
  ArrowLeft, Monitor, RefreshCw, Calendar, Cpu, MemoryStick,
  HardDrive, Wifi, Shield, AlertTriangle, CheckCircle, XCircle,
  Package, Activity, Clock, Info
} from 'lucide-react';

const MDMDeviceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [device, setDevice] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeviceDetails();
  }, [id]);

  const loadDeviceDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/mdm/devices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        setDevice(data.device);
        setInventory(data.last_inventory);
        setAlerts(data.active_alerts || []);
      }
    } catch (error) {
      console.error('Erreur chargement device:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatus = (lastSeen) => {
    if (!lastSeen) return { color: 'red', text: 'Hors ligne' };
    const diff = Date.now() - new Date(lastSeen).getTime();
    if (diff < 10 * 60 * 1000) return { color: 'green', text: 'En ligne' };
    if (diff < 24 * 60 * 60 * 1000) return { color: 'yellow', text: 'Inactif' };
    return { color: 'red', text: 'Hors ligne' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Device non trouvé</h1>
          <button
            onClick={() => navigate('/mdm/devices')}
            className="text-blue-600 hover:text-blue-800"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getConnectionStatus(device.last_seen);
  const inventoryData = inventory?.inventory_data || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/mdm/devices')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{device.hostname}</h1>
              <p className="text-gray-600">
                {device.manufacturer} {device.model} • {device.os_version}
              </p>
            </div>
            <button
              onClick={loadDeviceDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Carte Statut */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Statut Connexion</h3>
              <div className={`w-3 h-3 rounded-full ${
                statusInfo.color === 'green' ? 'bg-green-500' :
                statusInfo.color === 'yellow' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">{statusInfo.text}</p>
            <p className="text-sm text-gray-600">
              Dernière vue: {device.last_seen
                ? new Date(device.last_seen).toLocaleString('fr-FR')
                : 'Jamais'}
            </p>
          </div>

          {/* Carte CPU */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Processeur</h3>
              <Cpu className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 mb-2">{device.cpu_model}</p>
            <p className="text-2xl font-bold text-gray-900">{device.cpu_cores} cores</p>
            {inventoryData.cpu_usage_percent && (
              <p className="text-sm text-gray-600 mt-2">
                Utilisation: {inventoryData.cpu_usage_percent}%
              </p>
            )}
          </div>

          {/* Carte RAM */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Mémoire RAM</h3>
              <MemoryStick className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{device.ram_gb} GB</p>
            {inventoryData.ram_usage_percent && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${inventoryData.ram_usage_percent}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {inventoryData.ram_usage_percent}% utilisé
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Informations Système */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Informations Système</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Nom d'hôte</p>
                  <p className="font-medium text-gray-900">{device.hostname}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Numéro de série</p>
                  <p className="font-medium text-gray-900">{device.serial_number}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Modèle</p>
                  <p className="font-medium text-gray-900">
                    {device.manufacturer} {device.model}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Système</p>
                  <p className="font-medium text-gray-900">{device.os_version}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Adresse IP</p>
                  <p className="font-medium text-gray-900">
                    {device.ip_local || 'Non disponible'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Dernier démarrage</p>
                  <p className="font-medium text-gray-900">
                    {device.last_boot
                      ? new Date(device.last_boot).toLocaleString('fr-FR')
                      : 'Non disponible'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stockage et Alertes */}
          <div className="space-y-6">
            {/* Stockage */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Stockage</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <HardDrive className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {device.disk_free_gb} GB
                    </p>
                    <p className="text-sm text-gray-600">libre sur {device.disk_total_gb} GB</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{
                      width: `${((device.disk_total_gb - device.disk_free_gb) / device.disk_total_gb * 100).toFixed(1)}%`
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {((device.disk_total_gb - device.disk_free_gb) / device.disk_total_gb * 100).toFixed(1)}% utilisé
                </p>
              </div>
            </div>

            {/* Alertes Actives */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Alertes Actives</h2>
              </div>
              <div className="p-6">
                {alerts.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600">Aucune alerte</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'warning' ? 'text-orange-500' :
                          'text-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{alert.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Logiciels Installés */}
        {inventoryData.installed_software && inventoryData.installed_software.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Logiciels Installés ({inventoryData.installed_software.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {inventoryData.installed_software.map((software, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm">{software.name}</p>
                    <p className="text-xs text-gray-600">Version {software.version}</p>
                    <p className="text-xs text-gray-500">{software.publisher}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MDMDeviceDetailPage;