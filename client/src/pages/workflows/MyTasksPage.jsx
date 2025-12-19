// ============================================================================
// PAGE MY TASKS - Gestion des tâches On/Offboarding
// ============================================================================
// Fichier : client/src/pages/workflows/MyTasksPage.jsx
// Route : /workflows/my-tasks
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Clock, AlertCircle, User, Building, Calendar,
  FileText, List, Filter, RefreshCw, ChevronDown, ChevronUp,
  Rocket, LogOut, ExternalLink, Users, XCircle, AlertTriangle
} from 'lucide-react';

const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, overdue, due_soon
  const [teamFilter, setTeamFilter] = useState('all'); // all, IT, HR, Manager
  const [expandedTask, setExpandedTask] = useState(null);

  useEffect(() => {
    fetchMyTasks();
  }, [filter, teamFilter]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      let url = `${apiUrl}/api/workflows/my-tasks`;
      
      const params = new URLSearchParams();
      if (filter === 'overdue') params.append('overdue', 'true');
      if (filter === 'due_soon') params.append('due_soon', 'true');
      if (teamFilter !== 'all') params.append('team', teamFilter);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      setTasks(data.tasks || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Impossible de charger les tâches');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (workflowId, taskId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(
        `${apiUrl}/api/workflows/${workflowId}/tasks/${taskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'completed',
            result: 'success'
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to complete task');
      
      fetchMyTasks();
    } catch (err) {
      console.error('Error completing task:', err);
      alert('Erreur lors de la complétion de la tâche');
    }
  };

  const handleSkipTask = async (workflowId, taskId) => {
    const reason = prompt('Raison de l\'ignoré (optionnel):');
    if (reason === null) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(
        `${apiUrl}/api/workflows/${workflowId}/tasks/${taskId}/skip`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            skipped_reason: reason || 'Tâche non applicable'
          })
        }
      );
      
      if (!response.ok) throw new Error('Failed to skip task');
      
      fetchMyTasks();
    } catch (err) {
      console.error('Error skipping task:', err);
      alert('Erreur lors de l\'ignoré de la tâche');
    }
  };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  // Format number with thousands separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getUrgencyBadge = (task) => {
    if (task.is_overdue) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border-2 border-red-200">
          <AlertCircle className="w-3 h-3" />
          En retard
        </span>
      );
    }
    if (task.is_due_soon) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border-2 border-orange-200">
          <AlertTriangle className="w-3 h-3" />
          Urgent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
        <Clock className="w-3 h-3" />
        Normal
      </span>
    );
  };

  const getTeamBadge = (team) => {
    const teamConfig = {
      IT: { icon: '💻', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      HR: { icon: '👥', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      Manager: { icon: '👔', color: 'bg-green-100 text-green-800 border-green-200' },
      Finance: { icon: '💰', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      Legal: { icon: '⚖️', color: 'bg-red-100 text-red-800 border-red-200' },
      Admin: { icon: '📋', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    
    const config = teamConfig[team] || { icon: '📌', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {team}
      </span>
    );
  };

  const getWorkflowTypeBadge = (type) => {
    return type === 'onboarding' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <Rocket className="w-3 h-3" />
        Onboarding
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
        <LogOut className="w-3 h-3" />
        Offboarding
      </span>
    );
  };

  // Group tasks by urgency
  const overdueTasks = tasks.filter(t => t.is_overdue);
  const dueSoonTasks = tasks.filter(t => !t.is_overdue && t.is_due_soon);
  const normalTasks = tasks.filter(t => !t.is_overdue && !t.is_due_soon);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Chargement des tâches...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <List className="w-8 h-8 text-blue-600" />
                Mes Tâches On/Offboarding
              </h1>
              <p className="mt-2 text-gray-600">
                Gérez les tâches d'arrivée et de départ des employés
              </p>
            </div>
            <Link
              to="/workflows"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm font-medium"
            >
              <Users className="w-5 h-5" />
              Voir tous les workflows
            </Link>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <List className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(tasks.length)}</p>
            </div>
            
            <div className="bg-red-50 rounded-lg shadow-sm border-2 border-red-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-red-600">En retard</p>
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-700">{formatNumber(overdueTasks.length)}</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg shadow-sm border-2 border-orange-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-orange-600">Urgentes</p>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-orange-700">{formatNumber(dueSoonTasks.length)}</p>
            </div>
            
            <div className="bg-green-50 rounded-lg shadow-sm border-2 border-green-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-green-600">Normales</p>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-700">{formatNumber(normalTasks.length)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Filter className="w-4 h-4" />
                  Urgence
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setFilter('overdue')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === 'overdue'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    En retard
                  </button>
                  <button
                    onClick={() => setFilter('due_soon')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === 'due_soon'
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Urgentes
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Équipe
                </label>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="all">Toutes les équipes</option>
                  <option value="IT">💻 IT</option>
                  <option value="HR">👥 HR</option>
                  <option value="Manager">👔 Manager</option>
                  <option value="Finance">💰 Finance</option>
                  <option value="Legal">⚖️ Legal</option>
                  <option value="Admin">📋 Admin</option>
                </select>
              </div>

              <button
                onClick={fetchMyTasks}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Tasks list */}
        {error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-800 font-medium mb-4">{error}</p>
            <button
              onClick={fetchMyTasks}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune tâche en attente
            </h3>
            <p className="text-gray-600">
              Vous n'avez aucune tâche d'onboarding ou d'offboarding assignée.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overdue tasks */}
            {overdueTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-red-700 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  En retard ({formatNumber(overdueTasks.length)})
                </h2>
                <div className="space-y-3">
                  {overdueTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      expanded={expandedTask === task.id}
                      onToggle={() => toggleTaskExpansion(task.id)}
                      onComplete={handleCompleteTask}
                      onSkip={handleSkipTask}
                      getUrgencyBadge={getUrgencyBadge}
                      getTeamBadge={getTeamBadge}
                      getWorkflowTypeBadge={getWorkflowTypeBadge}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Due soon tasks */}
            {dueSoonTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-orange-700 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Urgentes ({formatNumber(dueSoonTasks.length)})
                </h2>
                <div className="space-y-3">
                  {dueSoonTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      expanded={expandedTask === task.id}
                      onToggle={() => toggleTaskExpansion(task.id)}
                      onComplete={handleCompleteTask}
                      onSkip={handleSkipTask}
                      getUrgencyBadge={getUrgencyBadge}
                      getTeamBadge={getTeamBadge}
                      getWorkflowTypeBadge={getWorkflowTypeBadge}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Normal tasks */}
            {normalTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  À faire ({formatNumber(normalTasks.length)})
                </h2>
                <div className="space-y-3">
                  {normalTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      expanded={expandedTask === task.id}
                      onToggle={() => toggleTaskExpansion(task.id)}
                      onComplete={handleCompleteTask}
                      onSkip={handleSkipTask}
                      getUrgencyBadge={getUrgencyBadge}
                      getTeamBadge={getTeamBadge}
                      getWorkflowTypeBadge={getWorkflowTypeBadge}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TASK CARD COMPONENT
// ============================================================================

const TaskCard = ({ 
  task, 
  expanded, 
  onToggle, 
  onComplete, 
  onSkip,
  getUrgencyBadge,
  getTeamBadge,
  getWorkflowTypeBadge
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 hover:shadow-md transition-all ${
      task.is_overdue ? 'border-red-300' : 'border-gray-200'
    }`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {getUrgencyBadge(task)}
              {getTeamBadge(task.task.responsible_team)}
              {getWorkflowTypeBadge(task.workflow.type)}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              {task.task.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>Pour : <span className="font-medium">{task.employee.first_name} {task.employee.last_name}</span></span>
              {task.employee.department && (
                <>
                  <span>•</span>
                  <Building className="w-4 h-4" />
                  <span>{task.employee.department}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onToggle}
            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={expanded ? 'Réduire' : 'Développer'}
          >
            {expanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
          </button>
        </div>

        {/* Due date */}
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Échéance : <span className="font-medium">{new Date(task.due_date).toLocaleDateString('fr-FR')}</span></span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Workflow : <span className="font-medium">{new Date(task.workflow.target_date).toLocaleDateString('fr-FR')}</span></span>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <>
            {task.task.description && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">{task.task.description}</p>
              </div>
            )}

            {task.task.checklist_items && task.task.checklist_items.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Checklist ({task.task.checklist_items.length} éléments) :
                </p>
                <ul className="space-y-2">
                  {task.task.checklist_items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-blue-900">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => onComplete(task.workflow_id, task.id)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marquer terminé
          </button>
          <button
            onClick={() => onSkip(task.workflow_id, task.id)}
            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Ignorer
          </button>
          <Link
            to={`/employees/${task.employee.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            title="Voir la fiche employé"
          >
            <ExternalLink className="w-4 h-4" />
            Détails
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyTasksPage;