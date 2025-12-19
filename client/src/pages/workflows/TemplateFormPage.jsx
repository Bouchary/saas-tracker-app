// ============================================================================
// PAGE TEMPLATE FORM - Créer/Éditer un template de workflow
// ============================================================================
// Fichier : client/src/pages/workflows/TemplateFormPage.jsx
// Routes : /workflows/templates/new, /workflows/templates/:id/edit
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical, Rocket, LogOut,
  Building, Users, FileText, Clock, CheckCircle2, Zap, AlertCircle,
  X, ChevronDown, ChevronUp, Loader
} from 'lucide-react';

const TemplateFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [template, setTemplate] = useState({
    name: '',
    description: '',
    type: 'onboarding',
    department: '',
    job_title: '',
    is_default: false,
    is_active: true
  });

  const [tasks, setTasks] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);

  useEffect(() => {
    if (isEditing) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/api/workflows/templates/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load template');

      const data = await response.json();
      setTemplate({
        name: data.template.name,
        description: data.template.description || '',
        type: data.template.type,
        department: data.template.department || '',
        job_title: data.template.job_title || '',
        is_default: data.template.is_default,
        is_active: data.template.is_active
      });
      setTasks(data.template.tasks || []);
      setError(null);
    } catch (err) {
      console.error('Error loading template:', err);
      setError('Erreur lors du chargement du template');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (tasks.length === 0) {
      setError('Veuillez ajouter au moins une tâche');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const payload = {
        ...template,
        tasks: tasks.map((task, index) => ({
          ...task,
          task_order: index + 1
        }))
      };

      const url = isEditing
        ? `${apiUrl}/api/workflows/templates/${id}`
        : `${apiUrl}/api/workflows/templates`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save template');
      }

      navigate('/workflows/templates');
    } catch (err) {
      console.error('Error saving template:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const addTask = () => {
    const newTask = {
      temp_id: Date.now(),
      title: '',
      description: '',
      responsible_team: 'IT',
      trigger_days: 0,
      due_days: 1,
      is_mandatory: true,
      is_automated: false,
      automation_type: null,
      checklist_items: []
    };
    setTasks([...tasks, newTask]);
    setExpandedTask(newTask.temp_id);
  };

  const removeTask = (index) => {
    if (window.confirm('Supprimer cette tâche ?')) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const updateTask = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  };

  const moveTask = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === tasks.length - 1)
    ) {
      return;
    }

    const newTasks = [...tasks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newTasks[index], newTasks[newIndex]] = [newTasks[newIndex], newTasks[index]];
    setTasks(newTasks);
  };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const addChecklistItem = (taskIndex) => {
    const item = prompt('Ajouter un élément de checklist :');
    if (item && item.trim()) {
      const newTasks = [...tasks];
      const items = newTasks[taskIndex].checklist_items || [];
      newTasks[taskIndex].checklist_items = [...items, item.trim()];
      setTasks(newTasks);
    }
  };

  const removeChecklistItem = (taskIndex, itemIndex) => {
    const newTasks = [...tasks];
    newTasks[taskIndex].checklist_items = newTasks[taskIndex].checklist_items.filter(
      (_, i) => i !== itemIndex
    );
    setTasks(newTasks);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader className="w-16 h-16 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Chargement du template...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/workflows/templates')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux templates
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                {isEditing ? 'Modifier le template' : 'Créer un template'}
              </h1>
              <p className="mt-2 text-gray-600">
                {isEditing
                  ? 'Modifiez les informations et les tâches du template'
                  : 'Créez un nouveau template de workflow réutilisable'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template info */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informations du template
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du template <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Onboarding Développeur"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={template.description}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description du template..."
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={template.type}
                  onChange={(e) => setTemplate({ ...template, type: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                >
                  <option value="onboarding">🚀 Onboarding</option>
                  <option value="offboarding">👋 Offboarding</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Département (optionnel)
                </label>
                <input
                  type="text"
                  value={template.department}
                  onChange={(e) => setTemplate({ ...template, department: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: IT, HR, Sales..."
                />
              </div>

              {/* Job title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poste (optionnel)
                </label>
                <input
                  type="text"
                  value={template.job_title}
                  onChange={(e) => setTemplate({ ...template, job_title: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Developer, Manager..."
                />
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.is_default}
                    onChange={(e) => setTemplate({ ...template, is_default: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Template par défaut</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.is_active}
                    onChange={(e) => setTemplate({ ...template, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Actif</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tasks section */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Tâches ({tasks.length})
              </h2>
              <button
                type="button"
                onClick={addTask}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter une tâche
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aucune tâche ajoutée</p>
                <button
                  type="button"
                  onClick={addTask}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter la première tâche
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task, index) => {
                  const taskId = task.id || task.temp_id;
                  const isExpanded = expandedTask === taskId;

                  return (
                    <div
                      key={taskId}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      {/* Task header */}
                      <div className="flex items-start gap-3">
                        {/* Drag handle */}
                        <div className="flex flex-col gap-1 pt-2">
                          <button
                            type="button"
                            onClick={() => moveTask(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                            title="Monter"
                          >
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          </button>
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <button
                            type="button"
                            onClick={() => moveTask(index, 'down')}
                            disabled={index === tasks.length - 1}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                            title="Descendre"
                          >
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>

                        {/* Task content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </span>
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => updateTask(index, 'title', e.target.value)}
                              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                              placeholder="Titre de la tâche..."
                              required
                            />
                            <button
                              type="button"
                              onClick={() => toggleTaskExpansion(taskId)}
                              className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeTask(index)}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                              title="Supprimer"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Quick info */}
                          {!isExpanded && (
                            <div className="flex items-center gap-4 text-sm text-gray-600 ml-11">
                              <span>👥 {task.responsible_team}</span>
                              <span>📅 J{task.trigger_days >= 0 ? '+' : ''}{task.trigger_days}</span>
                              <span>⏱️ {task.due_days}j</span>
                              {task.is_mandatory && <span>⭐ Obligatoire</span>}
                              {task.is_automated && <span>⚡ Auto</span>}
                            </div>
                          )}

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="ml-11 space-y-4 mt-4">
                              {/* Description */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Description
                                </label>
                                <textarea
                                  value={task.description}
                                  onChange={(e) => updateTask(index, 'description', e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Description détaillée..."
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                {/* Responsible team */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Équipe responsable
                                  </label>
                                  <select
                                    value={task.responsible_team}
                                    onChange={(e) => updateTask(index, 'responsible_team', e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                  >
                                    <option value="IT">💻 IT</option>
                                    <option value="HR">👥 HR</option>
                                    <option value="Manager">👔 Manager</option>
                                    <option value="Finance">💰 Finance</option>
                                    <option value="Legal">⚖️ Legal</option>
                                    <option value="Admin">📋 Admin</option>
                                  </select>
                                </div>

                                {/* Trigger days */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Jour de déclenchement
                                  </label>
                                  <input
                                    type="number"
                                    value={task.trigger_days}
                                    onChange={(e) => updateTask(index, 'trigger_days', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Négatif = avant, 0 = jour J, positif = après
                                  </p>
                                </div>

                                {/* Due days */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Délai (jours)
                                  </label>
                                  <input
                                    type="number"
                                    value={task.due_days}
                                    onChange={(e) => updateTask(index, 'due_days', parseInt(e.target.value))}
                                    min="1"
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>

                                {/* Automation type */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Automation (optionnel)
                                  </label>
                                  <select
                                    value={task.automation_type || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      updateTask(index, 'automation_type', value || null);
                                      updateTask(index, 'is_automated', !!value);
                                    }}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                  >
                                    <option value="">Aucune</option>
                                    <option value="send_notification">📧 Notification</option>
                                    <option value="create_email">📨 Créer email</option>
                                    <option value="create_accounts">🔐 Créer comptes</option>
                                    <option value="order_equipment">📦 Commander matériel</option>
                                  </select>
                                </div>
                              </div>

                              {/* Checkboxes */}
                              <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={task.is_mandatory}
                                    onChange={(e) => updateTask(index, 'is_mandatory', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">Tâche obligatoire</span>
                                </label>
                              </div>

                              {/* Checklist */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-medium text-gray-700">
                                    Checklist (optionnel)
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => addChecklistItem(index)}
                                    className="text-xs text-blue-600 hover:text-blue-700"
                                  >
                                    + Ajouter
                                  </button>
                                </div>
                                {task.checklist_items && task.checklist_items.length > 0 && (
                                  <div className="space-y-2">
                                    {task.checklist_items.map((item, itemIndex) => (
                                      <div
                                        key={itemIndex}
                                        className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200"
                                      >
                                        <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="flex-1 text-sm text-gray-700">{item}</span>
                                        <button
                                          type="button"
                                          onClick={() => removeChecklistItem(index, itemIndex)}
                                          className="p-1 hover:bg-red-50 rounded text-red-600"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 sticky bottom-0 bg-white border-t-2 border-gray-200 p-6 -mx-4 -mb-8">
            <button
              type="button"
              onClick={() => navigate('/workflows/templates')}
              disabled={saving}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? 'Enregistrer les modifications' : 'Créer le template'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateFormPage;