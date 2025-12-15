// ============================================================================
// EMPLOYEE FORM PAGE - Création/Édition AVEC ICÔNES LUCIDE-REACT
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Plus, Save, User, Briefcase, 
  Calendar, MapPin, FileText, XCircle
} from 'lucide-react';
import employeesApi from '../services/employeesApi';

const EmployeeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    personal_email: '',
    phone: '',
    job_title: '',
    department: '',
    team: '',
    hire_date: '',
    start_date: '',
    status: 'active',
    employment_type: 'full_time',
    office_location: '',
    work_mode: 'on_site',
    country: 'France',
    city: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // Charger l'employé si mode édition
  useEffect(() => {
    if (isEditMode) {
      loadEmployee();
    }
  }, [id]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const data = await employeesApi.getById(id);
      const emp = data.employee;
      
      // Formater les dates pour les inputs
      setFormData({
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        email: emp.email || '',
        personal_email: emp.personal_email || '',
        phone: emp.phone || '',
        job_title: emp.job_title || '',
        department: emp.department || '',
        team: emp.team || '',
        hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '',
        start_date: emp.start_date ? emp.start_date.split('T')[0] : '',
        status: emp.status || 'active',
        employment_type: emp.employment_type || 'full_time',
        office_location: emp.office_location || '',
        work_mode: emp.work_mode || 'on_site',
        country: emp.country || 'France',
        city: emp.city || '',
        notes: emp.notes || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur du champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Le prénom est requis';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.job_title.trim()) {
      newErrors.job_title = 'Le poste est requis';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Le département est requis';
    }

    if (!formData.hire_date) {
      newErrors.hire_date = 'La date d\'embauche est requise';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La date de début est requise';
    }

    if (formData.hire_date && formData.start_date) {
      if (new Date(formData.start_date) < new Date(formData.hire_date)) {
        newErrors.start_date = 'La date de début ne peut pas être avant la date d\'embauche';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditMode) {
        await employeesApi.update(id, formData);
        alert('Employé mis à jour avec succès !');
      } else {
        await employeesApi.create(formData);
        alert('Employé créé avec succès !');
      }

      navigate('/employees');
    } catch (err) {
      setError(err.message);
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-form-page">
      <div className="form-header">
        <button onClick={() => navigate('/employees')} className="btn-back">
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Retour
        </button>
        <h1>
          {isEditMode ? (
            <>
              <Edit className="w-6 h-6 inline mr-2" />
              Modifier l'employé
            </>
          ) : (
            <>
              <Plus className="w-6 h-6 inline mr-2" />
              Nouvel employé
            </>
          )}
        </h1>
      </div>

      {error && (
        <div className="error-message">
          <XCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="employee-form">
        {/* Informations personnelles */}
        <div className="form-section">
          <h2>
            <User className="w-5 h-5 inline mr-2" />
            Informations personnelles
          </h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">
                Prénom <span className="required">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={errors.first_name ? 'error' : ''}
              />
              {errors.first_name && <span className="error-text">{errors.first_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">
                Nom <span className="required">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={errors.last_name ? 'error' : ''}
              />
              {errors.last_name && <span className="error-text">{errors.last_name}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">
                Email professionnel <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="personal_email">Email personnel</label>
              <input
                type="email"
                id="personal_email"
                name="personal_email"
                value={formData.personal_email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Téléphone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+33 6 12 34 56 78"
            />
          </div>
        </div>

        {/* Informations professionnelles */}
        <div className="form-section">
          <h2>
            <Briefcase className="w-5 h-5 inline mr-2" />
            Informations professionnelles
          </h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="job_title">
                Poste <span className="required">*</span>
              </label>
              <input
                type="text"
                id="job_title"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
                className={errors.job_title ? 'error' : ''}
                placeholder="Ex: Senior Developer"
              />
              {errors.job_title && <span className="error-text">{errors.job_title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="department">
                Département <span className="required">*</span>
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={errors.department ? 'error' : ''}
              >
                <option value="">Sélectionner...</option>
                <option value="IT">IT</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Legal">Legal</option>
                <option value="Operations">Operations</option>
              </select>
              {errors.department && <span className="error-text">{errors.department}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="team">Équipe</label>
            <input
              type="text"
              id="team"
              name="team"
              value={formData.team}
              onChange={handleChange}
              placeholder="Ex: Frontend Team"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employment_type">Type de contrat</label>
              <select
                id="employment_type"
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
              >
                <option value="full_time">Temps plein</option>
                <option value="part_time">Temps partiel</option>
                <option value="contractor">Contractant</option>
                <option value="intern">Stagiaire</option>
                <option value="temporary">Temporaire</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Statut</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Actif</option>
                <option value="onboarding">Onboarding</option>
                <option value="offboarding">Offboarding</option>
                <option value="on_leave">En congé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="form-section">
          <h2>
            <Calendar className="w-5 h-5 inline mr-2" />
            Dates
          </h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hire_date">
                Date d'embauche <span className="required">*</span>
              </label>
              <input
                type="date"
                id="hire_date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleChange}
                className={errors.hire_date ? 'error' : ''}
              />
              {errors.hire_date && <span className="error-text">{errors.hire_date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="start_date">
                Date de début <span className="required">*</span>
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className={errors.start_date ? 'error' : ''}
              />
              {errors.start_date && <span className="error-text">{errors.start_date}</span>}
            </div>
          </div>
        </div>

        {/* Localisation */}
        <div className="form-section">
          <h2>
            <MapPin className="w-5 h-5 inline mr-2" />
            Localisation
          </h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="office_location">Bureau</label>
              <input
                type="text"
                id="office_location"
                name="office_location"
                value={formData.office_location}
                onChange={handleChange}
                placeholder="Ex: Paris HQ"
              />
            </div>

            <div className="form-group">
              <label htmlFor="work_mode">Mode de travail</label>
              <select
                id="work_mode"
                name="work_mode"
                value={formData.work_mode}
                onChange={handleChange}
              >
                <option value="on_site">Sur site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">Ville</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Ex: Paris"
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">Pays</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="form-section">
          <h2>
            <FileText className="w-5 h-5 inline mr-2" />
            Notes
          </h2>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              placeholder="Notes internes..."
            ></textarea>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="btn btn-secondary"
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            <Save className="w-4 h-4 inline mr-1" />
            {loading ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : 'Créer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeFormPage;