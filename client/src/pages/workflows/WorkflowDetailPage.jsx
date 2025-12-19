// ============================================================================
// PAGE WORKFLOW DETAIL - Détails complets d'un workflow
// ============================================================================
// Fichier : client/src/pages/workflows/WorkflowDetailPage.jsx
// Route : /workflows/:id
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Building, Calendar, CheckCircle2, Clock, AlertCircle,
  Rocket, LogOut, FileText, Users, TrendingUp, XCircle, Edit, Loader,
  ExternalLink, RefreshCw, List
} from 'lucide-react';

const WorkflowDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/api/workflows/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load workflow');

      const data = await response.json();
      setWorkflow(data.workflow);
      setError(null);
    } catch (err) {
      console.error('Error loading workflow:', err);
      setError('Erreur lors du chargement du workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(
        `${apiUrl}/api/workflows/${id}/tasks/${taskId}`,
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

      loadWorkflow();
    } catch (err) {
      console.error('Error completing task:', err);
      alert('Erreur lors de la complétion de la tâche');
    }
  };

  const handleCancelWorkflow = async () => {
    const reason = prompt('Raison de l\'annulation :');
    if (reason === null) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(
        `${apiUrl}/api/workflows/${id}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            cancellation_reason: reason || 'Annulation manuelle'
          })
        }
      );

      if (!response.ok) throw new Error('Failed to cancel workflow');

      loadWorkflow();
    } catch (err) {
      console.error('Error cancelling workflow:', err);
      alert('Erreur lors de l\'annulation');
    }
  };

  // Format number with thousands separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: 'En attente',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock
      },
      in_progress: {
        label: 'En cours',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: TrendingUp
      },
      completed: {
        label: 'Terminé',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle2
      },
      cancelled: {
        label: 'Annulé',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border-2 ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getTaskStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'À faire', color: 'bg-gray-100 text-gray-700' },
      in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-700' },
      skipped: { label: 'Ignoré', color: 'bg-yellow-100 text-yellow-700' }
    };
    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getWorkflowTypeConfig = (type) => {
    return type === 'onboarding' ? {
      icon: Rocket,
      label: 'Onboarding',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    } : {
      icon: LogOut,
      label: 'Offboarding',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader className="w-16 h-16 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Chargement du workflow...</p>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-800 font-medium mb-4">{error || 'Workflow non trouvé'}</p>
            <button
              onClick={() => navigate('/workflows')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux workflows
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeConfig = getWorkflowTypeConfig(workflow.workflow_type);
  const TypeIcon = typeConfig.icon;

  // Group tasks by status
  const pendingTasks = workflow.tasks?.filter(t => t.status === 'pending') || [];
  const inProgressTasks = workflow.tasks?.filter(t => t.status === 'in_progress') || [];
  const completedTasks = workflow.tasks?.filter(t => t.status === 'completed') || [];
  const skippedTasks = workflow.tasks?.filter(t => t.status === 'skipped') || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/workflows')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux workflows
          </button>

          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${typeConfig.bgColor}`}>
                  <TypeIcon className={`w-8 h-8 ${typeConfig.color}`} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Workflow {typeConfig.label}
                  </h1>
                  <Link
                    to={`/employees/${workflow.employee.id}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">
                      {workflow.employee.first_name} {workflow.employee.last_name}
                    </span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    {workflow.employee.job_title && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {workflow.employee.job_title}
                      </span>
                    )}
                    {workflow.employee.department && (
                      <span className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {workflow.employee.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(workflow.status)}
                {workflow.status !== 'cancelled' && workflow.status !== 'completed' && (
                  <button
                    onClick={handleCancelWorkflow}
                    className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>

            {/* Template info */}
            {workflow.template && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Template :</span> {workflow.template.name}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Date cible</p>
                <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  {new Date(workflow.target_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Progression</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatNumber(workflow.completed_tasks)} / {formatNumber(workflow.total_tasks)} tâches
                  <span className="ml-2 text-gray-500">
                    ({Math.round(workflow.completion_percentage || 0)}%)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Temps restant</p>
                <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  {workflow.days_until_target !== null
                    ? workflow.days_until_target < 0
                      ? `Il y a ${formatNumber(Math.abs(workflow.days_until_target))} j`
                      : workflow.days_until_target === 0
                      ? "Aujourd'hui"
                      : `${formatNumber(workflow.days_until_target)} jours`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tâches en retard</p>
                <p className="text-lg font-semibold text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {formatNumber(workflow.overdue_tasks || 0)}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    workflow.completion_percentage === 100
                      ? 'bg-green-500'
                      : workflow.completion_percentage >= 50
                      ? 'bg-blue-500'
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${workflow.completion_percentage || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks sections */}
        <div className="space-y-6">
          {/* In Progress */}
          {inProgressTasks.length > 0 && (
            <TaskSection
              title="En cours"
              icon={TrendingUp}
              iconColor="text-blue-600"
              count={inProgressTasks.length}
              tasks={inProgressTasks}
              workflow={workflow}
              onComplete={handleCompleteTask}
              expandedTask={expandedTask}
              setExpandedTask={setExpandedTask}
              getTaskStatusBadge={getTaskStatusBadge}
            />
          )}

          {/* Pending */}
          {pendingTasks.length > 0 && (
            <TaskSection
              title="À faire"
              icon={Clock}
              iconColor="text-gray-600"
              count={pendingTasks.length}
              tasks={pendingTasks}
              workflow={workflow}
              onComplete={handleCompleteTask}
              expandedTask={expandedTask}
              setExpandedTask={setExpandedTask}
              getTaskStatusBadge={getTaskStatusBadge}
            />
          )}

          {/* Completed */}
          {completedTasks.length > 0 && (
            <TaskSection
              title="Terminées"
              icon={CheckCircle2}
              iconColor="text-green-600"
              count={completedTasks.length}
              tasks={completedTasks}
              workflow={workflow}
              expandedTask={expandedTask}
              setExpandedTask={setExpandedTask}
              getTaskStatusBadge={getTaskStatusBadge}
              isCompleted
            />
          )}

          {/* Skipped */}
          {skippedTasks.length > 0 && (
            <TaskSection
              title="Ignorées"
              icon={XCircle}
              iconColor="text-yellow-600"
              count={skippedTasks.length}
              tasks={skippedTasks}
              workflow={workflow}
              expandedTask={expandedTask}
              setExpandedTask={setExpandedTask}
              getTaskStatusBadge={getTaskStatusBadge}
              isSkipped
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Task Section Component
const TaskSection = ({
  title,
  icon: Icon,
  iconColor,
  count,
  tasks,
  workflow,
  onComplete,
  expandedTask,
  setExpandedTask,
  getTaskStatusBadge,
  isCompleted,
  isSkipped
}) => {
  const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num);

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
          <Icon className={`w-6 h-6 ${iconColor}`} />
          {title} ({formatNumber(count)})
        </h2>
      </div>
      <div className="divide-y divide-gray-200">
        {tasks.map((task) => (
          <div key={task.id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      {task.task.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {task.task.responsible_team}
                      </span>
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Échéance : {new Date(task.due_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {task.assigned_to_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {task.assigned_to_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTaskStatusBadge(task.status)}
                  </div>
                </div>

                {task.task.description && (
                  <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded border border-gray-200">
                    {task.task.description}
                  </p>
                )}

                {task.task.checklist_items && task.task.checklist_items.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Checklist :</p>
                    <div className="space-y-1">
                      {task.task.checklist_items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-gray-400" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isCompleted && !isSkipped && task.status === 'pending' && (
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => onComplete(task.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Marquer terminé
                    </button>
                  </div>
                )}

                {isCompleted && task.completed_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Terminé le {new Date(task.completed_at).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(task.completed_at).toLocaleTimeString('fr-FR')}
                    {task.completed_by_name && ` par ${task.completed_by_name}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowDetailPage;