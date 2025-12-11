// client/src/pages/Profile.jsx

import { useState, useEffect } from 'react';
import { User, Bell, Mail, Calendar, DollarSign, FileText, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Profile() {
  const { token } = useAuth(); // ✅ Utiliser le hook useAuth
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // États pour les paramètres
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [notificationDays, setNotificationDays] = useState([30, 14, 7, 3, 1]);

  // Charger les données du profil
  useEffect(() => {
    fetchProfile();
    fetchNotificationHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setStats(data.stats);
        setNotificationEmail(data.profile.notification_email);
        setNotificationDays(data.profile.notification_days || [30, 14, 7, 3, 1]);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/profile/notifications/history?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setSuccessMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/profile/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notification_email: notificationEmail,
          notification_days: notificationDays
        })
      });

      if (response.ok) {
        setSuccessMessage('✅ Préférences enregistrées avec succès !');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotificationDay = (day) => {
    if (notificationDays.includes(day)) {
      setNotificationDays(notificationDays.filter(d => d !== day));
    } else {
      setNotificationDays([...notificationDays, day].sort((a, b) => b - a));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
          <p className="text-gray-600">Gérez vos informations et préférences de notification</p>
        </div>

        {/* Message de succès */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Colonne gauche : Infos personnelles + Stats */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Informations personnelles */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Informations</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Email</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{profile?.email}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">Membre depuis</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(profile?.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistiques</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">Contrats actifs</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{stats?.active_contracts || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Coût mensuel</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {parseFloat(stats?.total_monthly_cost || 0).toFixed(2)} €
                  </span>
                </div>

                {stats?.next_renewal && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Prochain renouvellement</div>
                    <div className="font-semibold text-purple-600">
                      {new Date(stats.next_renewal).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne droite : Préférences + Historique */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Paramètres de notification */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Bell className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Préférences de notification</h2>
              </div>

              {/* Toggle emails */}
              <div className="mb-6">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="text-gray-900 font-medium">Activer les emails de notification</span>
                    <p className="text-sm text-gray-500">Recevoir des alertes par email avant l'expiration des préavis</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.checked)}
                    />
                    <div className={`w-14 h-8 rounded-full transition-colors ${
                      notificationEmail ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        notificationEmail ? 'transform translate-x-6' : ''
                      }`}></div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Sélection des jours */}
              <div className="mb-6">
                <label className="block text-gray-900 font-medium mb-3">
                  Jours d'alerte avant expiration du préavis
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Sélectionnez les moments où vous souhaitez recevoir des alertes
                </p>
                <div className="flex flex-wrap gap-3">
                  {[60, 30, 14, 7, 3, 1].map(day => (
                    <button
                      key={day}
                      onClick={() => toggleNotificationDay(day)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        notificationDays.includes(day)
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day} jour{day > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bouton sauvegarder */}
              <button
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer les préférences
                  </>
                )}
              </button>
            </div>

            {/* Historique des notifications */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Historique des notifications</h2>
              
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune notification envoyée pour le moment</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notif => (
                    <div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{notif.message}</p>
                        {notif.contract_name && (
                          <p className="text-sm text-gray-600">Contrat : {notif.contract_name}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.sent_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}