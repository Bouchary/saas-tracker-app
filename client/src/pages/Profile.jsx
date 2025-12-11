// client/src/pages/Profile.jsx
// Version MODERNE avec design amélioré - LOGIQUE ORIGINALE CONSERVÉE

import { useState, useEffect } from 'react';
import { User, Bell, Mail, Calendar, DollarSign, FileText, Save, CheckCircle, Lock, Eye, EyeOff, AlertCircle, Shield, TrendingUp } from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_URL from '../config/api';

export default function Profile() {
  const { token } = useAuth();
  
  // ✅ ÉTATS ORIGINAUX CONSERVÉS
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

  // ✅ USEEFFECT ORIGINAL CONSERVÉ
  useEffect(() => {
    fetchProfile();
    fetchNotificationHistory();
  }, []);

  // ✅ TOUTES LES FONCTIONS ORIGINALES CONSERVÉES
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
    
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { score: 1, label: 'Faible', color: 'bg-red-500' };
    if (score <= 4) return { score: 2, label: 'Moyen', color: 'bg-orange-500' };
    if (score <= 5) return { score: 3, label: 'Bon', color: 'bg-yellow-500' };
    return { score: 4, label: 'Excellent', color: 'bg-green-500' };
  };

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

  // ✨ LOADING STATE MODERNISÉ
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-12">
      {/* ✨ HEADER MODERNE AVEC GRADIENT */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-8 mb-8 shadow-lg">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Mon Profil</h1>
          <p className="text-indigo-100 text-lg">Gérez vos informations et préférences</p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-6xl">
        {/* ✨ MESSAGE SUCCÈS MODERNISÉ */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3 shadow-md animate-slide-down -mt-16">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 -mt-16">
          
          {/* ✨ COLONNE GAUCHE MODERNISÉE */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Informations personnelles */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Informations</h2>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <label className="text-xs text-indigo-600 font-semibold block mb-1">Email</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium">{profile?.email}</span>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <label className="text-xs text-purple-600 font-semibold block mb-1">Membre depuis</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">{new Date(profile?.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ✨ STATISTIQUES MODERNISÉES */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Statistiques</h2>
              </div>
              
              <div className="space-y-4">
                <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">Contrats actifs</span>
                    </div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {stats?.active_contracts || 0}
                    </span>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">Coût mensuel</span>
                    </div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {parseFloat(stats?.total_monthly_cost || 0).toFixed(2)} €
                    </span>
                  </div>
                </div>

                {stats?.next_renewal && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <div className="text-xs text-purple-600 font-semibold mb-1">Prochain renouvellement</div>
                    <div className="font-bold text-lg text-purple-700">
                      {new Date(stats.next_renewal).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✨ COLONNE DROITE MODERNISÉE */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ✨ NOTIFICATIONS MODERNISÉES */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Préférences de notification</h2>
              </div>

              {/* Toggle emails */}
              <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="text-gray-900 font-semibold">Activer les emails de notification</span>
                    <p className="text-sm text-gray-600 mt-1">Recevoir des alertes par email avant l'expiration des préavis</p>
                  </div>
                  <div className="relative ml-4">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.checked)}
                    />
                    <div className={`w-14 h-8 rounded-full transition-colors ${
                      notificationEmail ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                        notificationEmail ? 'transform translate-x-6' : ''
                      }`}></div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Sélection des jours */}
              <div className="mb-6">
                <label className="block text-gray-900 font-semibold mb-2">
                  Jours d'alerte avant expiration du préavis
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez les moments où vous souhaitez recevoir des alertes
                </p>
                <div className="flex flex-wrap gap-3">
                  {[60, 30, 14, 7, 3, 1].map(day => (
                    <button
                      key={day}
                      onClick={() => toggleNotificationDay(day)}
                      className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                        notificationDays.includes(day)
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
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
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
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

            {/* ✨ SÉCURITÉ MODERNISÉE */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Sécurité</h2>
              </div>

              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  {/* Messages */}
                  {passwordError && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start gap-2 animate-shake">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="bg-green-50 border-2 border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-2 animate-slide-down">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-semibold">{passwordSuccess}</span>
                    </div>
                  )}

                  {/* Champs mot de passe (identiques à l'original) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mot de passe actuel
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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
                    
                    {newPassword && (
                      <>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">Force du mot de passe</span>
                            <span className={`font-bold ${
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
                        
                        <div className="mt-3 space-y-1.5">
                          {passwordRequirements.map((req, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <CheckCircle className={`w-4 h-4 ${req.met ? 'text-green-500' : 'text-gray-300'}`} />
                              <span className={req.met ? 'text-green-700 font-medium' : 'text-gray-500'}>
                                {req.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirmer le nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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
                    
                    {confirmPassword && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        {newPassword === confirmPassword ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-700 font-medium">Les mots de passe correspondent</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-700 font-medium">Les mots de passe ne correspondent pas</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                  >
                    {changingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Changement en cours...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Changer le mot de passe
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* ✨ HISTORIQUE MODERNISÉ */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Historique des notifications</h2>
              </div>
              
              {notifications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune notification envoyée pour le moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notif => (
                    <div key={notif.id} className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl hover:shadow-md transition-all border border-gray-100">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold">{notif.message}</p>
                        {notif.contract_name && (
                          <p className="text-sm text-gray-600 mt-1">Contrat : {notif.contract_name}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
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

      {/* ✨ STYLES D'ANIMATION */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-shake {
          animation: shake 0.5s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}