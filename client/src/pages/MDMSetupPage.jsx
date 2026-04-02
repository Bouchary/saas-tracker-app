// ============================================================================
// PAGE SETUP MDM - Téléchargement et Installation Agents
// ============================================================================
// Fichier : client/src/pages/MDMSetupPage.jsx
// Page pour télécharger agents et obtenir token organisation
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';
import {
  Download, Copy, Check, AlertCircle, Monitor, Apple,
  Terminal, Shield, Clock, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

const MDMSetupPage = () => {
  const { token } = useAuth();
  const [organizationToken, setOrganizationToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedOS, setExpandedOS] = useState('windows');

  useEffect(() => {
    loadOrganizationToken();
  }, []);

  const loadOrganizationToken = async () => {
    try {
      // Pour l'instant, utiliser l'ID organisation comme token
      // TODO: Implémenter système de tokens sécurisés
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok && data.user) {
        // Utiliser organization_id comme token temporaire
        setOrganizationToken(data.user.organization_id?.toString() || '1');
      }
    } catch (error) {
      console.error('Erreur chargement token:', error);
      setOrganizationToken('1'); // Fallback
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAgent = (os) => {
    const files = {
      windows: 'mdm-agent-windows.ps1',
      windowsInstall: 'install-windows.ps1',
      unix: 'mdm-agent-unix.sh',
      unixInstall: 'install-unix.sh'
    };
    
    // TODO: Servir fichiers depuis backend
    // Pour l'instant, afficher message
    alert(`Téléchargement de ${files[os]}.\n\nCes fichiers doivent être hébergés sur votre serveur dans /public/agents/`);
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
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration MDM</h1>
          <p className="text-gray-600">
            Installez l'agent MDM sur vos devices pour collecter automatiquement les informations système
          </p>
        </div>

        {/* Token Organisation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Token d'Organisation</h3>
              <p className="text-sm text-blue-800 mb-3">
                Ce token est requis pour enregistrer les devices. Conservez-le en sécurité.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-4 py-2 rounded border border-blue-200 font-mono text-sm">
                  {organizationToken}
                </code>
                <button
                  onClick={() => copyToClipboard(organizationToken)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Générales */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Téléchargez l'agent</p>
                <p className="text-sm text-gray-600">Choisissez l'agent correspondant à votre OS</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Exécutez l'installeur</p>
                <p className="text-sm text-gray-600">Droits administrateur requis (Windows) ou sudo (macOS/Linux)</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Configuration automatique</p>
                <p className="text-sm text-gray-600">Le device apparaîtra dans le dashboard sous 1 minute</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Heartbeat automatique</p>
                <p className="text-sm text-gray-600">Les données sont envoyées toutes les 4 heures automatiquement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Agents par OS */}
        <div className="space-y-4">
          {/* Windows */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => setExpandedOS(expandedOS === 'windows' ? '' : 'windows')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-4">
                <Monitor className="w-8 h-8 text-blue-600" />
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">Windows</h3>
                  <p className="text-sm text-gray-600">Windows 10, 11, Server 2016+</p>
                </div>
              </div>
              {expandedOS === 'windows' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedOS === 'windows' && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Installation Rapide (Recommandé)</h4>
                    <button
                      onClick={() => downloadAgent('windowsInstall')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger install-windows.ps1
                    </button>
                    <p className="text-sm text-gray-600 mt-2">
                      Double-clic puis "Exécuter avec PowerShell" (clic droit → Exécuter en tant qu'administrateur)
                    </p>
                  </div>

                  <div className="border-t border-gray-300 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Installation Manuelle</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => downloadAgent('windows')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger mdm-agent-windows.ps1
                      </button>
                      
                      <div className="bg-gray-900 rounded-lg p-4 mt-3">
                        <p className="text-xs text-gray-400 mb-2">PowerShell (Administrateur):</p>
                        <code className="text-sm text-green-400 block">
                          .\mdm-agent-windows.ps1 -Register -OrganizationToken {organizationToken}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-900 font-medium">Prérequis Windows</p>
                        <ul className="text-sm text-blue-800 mt-1 space-y-1">
                          <li>• PowerShell 5.1+ (inclus dans Windows 10/11)</li>
                          <li>• Droits administrateur</li>
                          <li>• Connexion internet</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* macOS */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => setExpandedOS(expandedOS === 'macos' ? '' : 'macos')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-4">
                <Apple className="w-8 h-8 text-gray-800" />
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">macOS</h3>
                  <p className="text-sm text-gray-600">macOS 10.15+</p>
                </div>
              </div>
              {expandedOS === 'macos' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedOS === 'macos' && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Installation Rapide (Recommandé)</h4>
                    <button
                      onClick={() => downloadAgent('unixInstall')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger install-unix.sh
                    </button>
                    
                    <div className="bg-gray-900 rounded-lg p-4 mt-3">
                      <p className="text-xs text-gray-400 mb-2">Terminal:</p>
                      <code className="text-sm text-green-400 block">
                        chmod +x install-unix.sh<br/>
                        sudo ./install-unix.sh
                      </code>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-900 font-medium">Prérequis macOS</p>
                        <ul className="text-sm text-blue-800 mt-1 space-y-1">
                          <li>• curl et jq (installés automatiquement via Homebrew si manquants)</li>
                          <li>• Droits sudo</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Linux */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => setExpandedOS(expandedOS === 'linux' ? '' : 'linux')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-4">
                <Terminal className="w-8 h-8 text-orange-600" />
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">Linux</h3>
                  <p className="text-sm text-gray-600">Ubuntu, Debian, CentOS, RHEL</p>
                </div>
              </div>
              {expandedOS === 'linux' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedOS === 'linux' && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Installation Rapide (Recommandé)</h4>
                    <button
                      onClick={() => downloadAgent('unixInstall')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger install-unix.sh
                    </button>
                    
                    <div className="bg-gray-900 rounded-lg p-4 mt-3">
                      <p className="text-xs text-gray-400 mb-2">Terminal:</p>
                      <code className="text-sm text-green-400 block">
                        chmod +x install-unix.sh<br/>
                        sudo ./install-unix.sh
                      </code>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-900 font-medium">Prérequis Linux</p>
                        <ul className="text-sm text-blue-800 mt-1 space-y-1">
                          <li>• curl et jq (installés automatiquement si manquants)</li>
                          <li>• Droits sudo</li>
                          <li>• Cron (généralement préinstallé)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Aide */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Besoin d'aide ?
          </h3>
          <p className="text-sm text-yellow-800 mb-3">
            Si l'installation échoue, vérifiez:
          </p>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• L'URL de l'API est correcte dans le fichier agent</li>
            <li>• Le token d'organisation est valide</li>
            <li>• Le device a accès à internet</li>
            <li>• Les droits administrateur/sudo sont accordés</li>
          </ul>
          <p className="text-sm text-yellow-800 mt-3">
            Logs: Windows: <code>C:\ProgramData\SaaSTracker\mdm-agent.log</code> | 
            Unix: <code>/var/log/saas-tracker-mdm.log</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MDMSetupPage;
