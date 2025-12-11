// client/src/pages/Profile.jsx

import { useState, useEffect } from 'react';
import { User, Bell, Mail, Calendar, DollarSign, FileText, Save, CheckCircle, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';

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

  // États pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // États pour afficher/masquer les mots de passe
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Charger les données du profil
  useEffect(() => {
    fetchProfile();
    fetchNotificationHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
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
      const response = await fetch(`${API_URL}/api/profile/notifications/history?limit=10`, {
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
      const response = await fetch(`${API_URL}/api/profile/notifications`, {
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont requis');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch(`${API_URL}/api/profile/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('✅ Mot de passe changé avec succès !');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 5000);
      } else {
        setPasswordError(data.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      setPasswordError('Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  // Calculer la force du mot de passe
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    
    // Longueur
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    
    // Caractères variés
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Déterminer le niveau
    if (score <= 2) return { score: 1, label: 'Faible', color: 'bg-red-500' };
    if (score <= 4) return { score: 2, label: 'Moyen', color: 'bg-orange-500' };
    if (score <= 5) return { score: 3, label: 'Bon', color: 'bg-yellow-500' };
    return { score: 4, label: 'Excellent', color: 'bg-green-500' };
  };

  // Vérifier les exigences du mot de passe
  const getPasswordRequirements = (password) => {
    return [
      { label: 'Au moins 6 caractères', met: password.length >= 6 },
      { label: 'Une lettre minuscule', met: /[a-z]/.test(password) },
      { label: 'Une lettre majuscule', met: /[A-Z]/.test(password) },
      { label: 'Un chiffre', met: /[0-9]/.test(password) },
      { label: 'Un caractère spécial', met: /[^A-Za-z0-9]/.test(password) }
    ];
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordRequirements = getPasswordRequirements(newPassword);

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

            {/* Sécurité - Changement de mot de passe */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Lock className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Sécurité</h2>
              </div>

              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  {/* Message d'erreur */}
                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                      {passwordError}
                    </div>
                  )}

                  {/* Message de succès */}
                  {passwordSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                      <CheckCircle className="w-5 h-5" />
                      {passwordSuccess}
                    </div>
                  )}

                  {/* Ancien mot de passe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe actuel
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Entrez votre mot de passe actuel"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Nouveau mot de passe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Minimum 6 caractères"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Barre de force du mot de passe */}
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">Force du mot de passe</span>
                          <span className={`font-semibold ${
                            passwordStrength.score === 1 ? 'text-red-600' :
                            passwordStrength.score === 2 ? 'text-orange-600' :
                            passwordStrength.score === 3 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Exigences du mot de passe */}
                    {newPassword && (
                      <div className="mt-3 space-y-1">
                        {passwordRequirements.map((req, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <CheckCircle className={`w-4 h-4 ${req.met ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className={req.met ? 'text-green-700' : 'text-gray-500'}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirmer nouveau mot de passe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Confirmez le nouveau mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Indicateur de correspondance */}
                    {confirmPassword && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        {newPassword === confirmPassword ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-700">Les mots de passe correspondent</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-700">Les mots de passe ne correspondent pas</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bouton changer */}
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {changingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Changement en cours...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Changer le mot de passe
                      </>
                    )}
                  </button>
                </div>
              </form>
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