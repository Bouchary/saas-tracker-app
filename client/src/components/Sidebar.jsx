import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard, FileText, Users, Package, GitBranch, ShoppingCart,
  Monitor, Sparkles, ChevronDown, ChevronRight, List, CheckSquare,
  Sliders, Activity, AlertTriangle, Lightbulb, Upload, Menu, X
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [workflowsOpen, setWorkflowsOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [mdmOpen, setMdmOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const isAdmin = user && ['owner', 'admin', 'super_admin'].includes(user.role);

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-indigo-900 to-indigo-800 text-white min-h-screen flex flex-col transition-all duration-300 fixed left-0 top-0 z-40`}>
      <div className="p-4 flex items-center justify-between border-b border-indigo-700">
        {!collapsed && <span className="text-xl font-bold">SaaS Tracker</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-indigo-700 rounded">
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <Link
          to="/dashboard-v2"
          className={`flex items-center px-4 py-3 hover:bg-indigo-700 transition ${isActive('/dashboard-v2') ? 'bg-indigo-700 border-l-4 border-white' : ''}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Dashboard 360°</span>}
        </Link>

        <Link
          to="/contracts"
          className={`flex items-center px-4 py-3 hover:bg-indigo-700 transition ${isActive('/contracts') ? 'bg-indigo-700 border-l-4 border-white' : ''}`}
        >
          <FileText className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Contrats</span>}
        </Link>

        <Link
          to="/employees"
          className={`flex items-center px-4 py-3 hover:bg-indigo-700 transition ${isActive('/employees') ? 'bg-indigo-700 border-l-4 border-white' : ''}`}
        >
          <Users className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Employés</span>}
        </Link>

        <Link
          to="/assets"
          className={`flex items-center px-4 py-3 hover:bg-indigo-700 transition ${isActive('/assets') ? 'bg-indigo-700 border-l-4 border-white' : ''}`}
        >
          <Package className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Matériel</span>}
        </Link>

        {!collapsed && (
          <>
            <div>
              <button
                onClick={() => setWorkflowsOpen(!workflowsOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-700 transition ${isActive('/workflows') ? 'bg-indigo-700' : ''}`}
              >
                <div className="flex items-center">
                  <GitBranch className="w-5 h-5" />
                  <span className="ml-3">Workflows</span>
                </div>
                {workflowsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {workflowsOpen && (
                <div className="bg-indigo-800">
                  <Link to="/workflows/my-tasks" className={`flex items-center px-8 py-2 hover:bg-indigo-700 ${isActive('/workflows/my-tasks') ? 'bg-indigo-700' : ''}`}>
                    <List className="w-4 h-4" />
                    <span className="ml-2">Mes tâches</span>
                  </Link>
                  <Link to="/workflows" className={`flex items-center px-8 py-2 hover:bg-indigo-700 ${isActive('/workflows') && !isActive('/workflows/my-tasks') && !isActive('/workflows/templates') ? 'bg-indigo-700' : ''}`}>
                    <GitBranch className="w-4 h-4" />
                    <span className="ml-2">Tous</span>
                  </Link>
                  <Link to="/workflows/templates" className={`flex items-center px-8 py-2 hover:bg-indigo-700 ${isActive('/workflows/templates') ? 'bg-indigo-700' : ''}`}>
                    <FileText className="w-4 h-4" />
                    <span className="ml-2">Templates</span>
                  </Link>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => setPurchaseOpen(!purchaseOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-700 transition ${isActive('/purchase') ? 'bg-indigo-700' : ''}`}
              >
                <div className="flex items-center">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="ml-3">Demandes</span>
                </div>
                {purchaseOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {purchaseOpen && (
                <div className="bg-indigo-800">
                  <Link to="/purchase-requests" className={`flex items-center px-8 py-2 hover:bg-indigo-700 ${isActive('/purchase-requests') && !isActive('/purchase-requests/to-approve') && !isActive('/purchase-approval-rules') ? 'bg-indigo-700' : ''}`}>
                    <List className="w-4 h-4" />
                    <span className="ml-2">Mes demandes</span>
                  </Link>
                  <Link to="/purchase-requests/to-approve" className={`flex items-center px-8 py-2 hover:bg-indigo-700 ${isActive('/purchase-requests/to-approve') ? 'bg-indigo-700' : ''}`}>
                    <CheckSquare className="w-4 h-4" />
                    <span className="ml-2">À valider</span>
                  </Link>
                  {isAdmin && (
                    <Link to="/purchase-approval-rules" className={`flex items-center px-8 py-2 hover:bg-indigo-700 ${isActive('/purchase-approval-rules') ? 'bg-indigo-700' : ''}`}>
                      <Sliders className="w-4 h-4" />
                      <span className="ml-2">Règles</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => setMdmOpen(!mdmOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-700 transition ${isActive('/mdm') ? 'bg-indigo-700' : ''}`}
              >
                <div className="flex items-center">
                  <Monitor className="w-5 h-5" />
                  <span className="ml-3">MDM</span>
                </div>
                {mdmOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {mdmOpen && (
                <div className="bg-indigo-800">
                  <Link to="/mdm" className={`flex items-center px-8 py-2 hover:bg-indigo-700 ${location.pathname === '/mdm' ? 'bg-indigo-700' : ''}`}>
                    <Activity className="w-4 h-4" />
                    <span className="ml-2">Dashboard</span>
                  </Link>
                  <Link to="/mdm/devices" className={`flex items-center px-8 py-2 hover:bg-indigo-700 ${isActive('/mdm/devices') ? 'bg-indigo-700' : ''}`}>
                    <Monitor className="w-4 h-4" />
                    <span className="ml-2">Devices</span>
                  </Link>
                  <Link to="/mdm/alerts" className={`flex items-center px-8 py-2 hover:bg-indigo-700 ${isActive('/mdm/alerts') ? 'bg-indigo-700' : ''}`}>
                    <AlertTriangle className="w-4 h-4" />
                    <span className="ml-2">Alertes</span>
                  </Link>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => setAiOpen(!aiOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-700 transition ${isActive('/optimization') || isActive('/extractions-history') || isActive('/import') ? 'bg-indigo-700' : ''}`}
              >
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5" />
                  <span className="ml-3">IA & Outils</span>
                </div>
                {aiOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {aiOpen && (
                <div className="bg-indigo-800">
                  <Link to="/optimization" className={`flex items-center px-8 py-2 hover:bg-indigo-700 ${isActive('/optimization') ? 'bg-indigo-700' : ''}`}>
                    <Lightbulb className="w-4 h-4" />
                    <span className="ml-2">Optimisation</span>
                  </Link>
                  <Link to="/extractions-history" className={`flex items-center px-8 py-2 hover:bg-indigo-700 ${isActive('/extractions-history') ? 'bg-indigo-700' : ''}`}>
                    <Sparkles className="w-4 h-4" />
                    <span className="ml-2">Historique</span>
                  </Link>
                  <Link to="/import" className={`flex items-center px-8 py-2 hover:bg-indigo-700 ${isActive('/import') ? 'bg-indigo-700' : ''}`}>
                    <Upload className="w-4 h-4" />
                    <span className="ml-2">Import</span>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {collapsed && (
          <>
            <Link to="/workflows" className={`flex items-center justify-center px-4 py-3 hover:bg-indigo-700 ${isActive('/workflows') ? 'bg-indigo-700' : ''}`}>
              <GitBranch className="w-5 h-5" />
            </Link>
            <Link to="/purchase-requests" className={`flex items-center justify-center px-4 py-3 hover:bg-indigo-700 ${isActive('/purchase') ? 'bg-indigo-700' : ''}`}>
              <ShoppingCart className="w-5 h-5" />
            </Link>
            <Link to="/mdm" className={`flex items-center justify-center px-4 py-3 hover:bg-indigo-700 ${isActive('/mdm') ? 'bg-indigo-700' : ''}`}>
              <Monitor className="w-5 h-5" />
            </Link>
            <Link to="/optimization" className={`flex items-center justify-center px-4 py-3 hover:bg-indigo-700 ${isActive('/optimization') ? 'bg-indigo-700' : ''}`}>
              <Sparkles className="w-5 h-5" />
            </Link>
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;