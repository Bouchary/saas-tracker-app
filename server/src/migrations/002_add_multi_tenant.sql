-- ============================================================================
-- MIGRATION 2 : MULTI-TENANT
-- ============================================================================
-- Date : 26 décembre 2025
-- Objectif : Ajouter organization_id partout et migrer intelligemment les données
-- Durée estimée : 10 min
-- ⚠️ IMPORTANT : Exécuter APRÈS la migration 1 (audit trail)
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : CRÉER TABLE ORGANIZATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  
  -- Informations de base
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  
  -- Contact
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Abonnement (pour plus tard)
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_start_date TIMESTAMP,
  trial_ends_at TIMESTAMP,
  
  -- Stripe (pour plus tard)
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  -- Limites
  max_users INT DEFAULT -1, -- -1 = illimité
  max_employees INT DEFAULT -1,
  max_storage_gb INT DEFAULT -1,
  
  -- Features activées (JSON)
  features JSONB DEFAULT '{"workflows": true, "analytics": true, "api_access": false}',
  
  -- Audit trail
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  updated_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  deleted_by INT REFERENCES users(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);

-- ============================================================================
-- ÉTAPE 2 : CRÉER "DEFAULT ORGANIZATION"
-- ============================================================================

INSERT INTO organizations (name, slug, subscription_plan, subscription_status, max_users, max_employees)
VALUES ('Default Organization', 'default', 'enterprise', 'active', -1, -1)
ON CONFLICT (slug) DO NOTHING;

-- Afficher l'ID
DO $$
DECLARE
  default_org_id INT;
BEGIN
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'default';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Default Organization cree avec ID: %', default_org_id;
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- ÉTAPE 3 : AJOUTER organization_id À TABLE USERS
-- ============================================================================

-- Ajouter la colonne
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Migrer TOUS les users vers Default Organization
UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

-- Rendre NOT NULL
ALTER TABLE users 
ALTER COLUMN organization_id SET NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);

-- ============================================================================
-- ÉTAPE 4 : AJOUTER organization_id À TABLE EMPLOYEES
-- ============================================================================

-- Ajouter la colonne
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Stratégie de migration intelligente :
-- 1. Si l'employee a un created_by → utiliser l'organization du user
-- 2. Sinon → Default Organization

UPDATE employees e
SET organization_id = (
  SELECT u.organization_id 
  FROM users u 
  WHERE u.id = e.created_by
)
WHERE e.organization_id IS NULL AND e.created_by IS NOT NULL;

-- Fallback pour les employees sans created_by
UPDATE employees 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

-- Rendre NOT NULL
ALTER TABLE employees 
ALTER COLUMN organization_id SET NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_employees_organization ON employees(organization_id);

-- ============================================================================
-- ÉTAPE 5 : AJOUTER organization_id À TABLE CONTRACTS
-- ============================================================================

-- Ajouter la colonne
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Stratégie : utiliser user_id qui existe déjà dans contracts
UPDATE contracts c
SET organization_id = (
  SELECT u.organization_id 
  FROM users u 
  WHERE u.id = c.user_id
)
WHERE c.organization_id IS NULL AND c.user_id IS NOT NULL;

-- Fallback
UPDATE contracts 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

-- Rendre NOT NULL
ALTER TABLE contracts 
ALTER COLUMN organization_id SET NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_contracts_organization ON contracts(organization_id);

-- ============================================================================
-- ÉTAPE 6 : AJOUTER organization_id À TABLE ASSETS
-- ============================================================================

-- Ajouter la colonne
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Stratégie : utiliser created_by
UPDATE assets a
SET organization_id = (
  SELECT u.organization_id 
  FROM users u 
  WHERE u.id = a.created_by
)
WHERE a.organization_id IS NULL AND a.created_by IS NOT NULL;

-- Fallback
UPDATE assets 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

-- Rendre NOT NULL
ALTER TABLE assets 
ALTER COLUMN organization_id SET NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_assets_organization ON assets(organization_id);

-- ============================================================================
-- ÉTAPE 7 : AJOUTER organization_id À TABLE EMPLOYEE_WORKFLOWS
-- ============================================================================

-- Ajouter la colonne
ALTER TABLE employee_workflows 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Stratégie : via l'employé associé
UPDATE employee_workflows ew
SET organization_id = (
  SELECT e.organization_id 
  FROM employees e 
  WHERE e.id = ew.employee_id
)
WHERE ew.organization_id IS NULL AND ew.employee_id IS NOT NULL;

-- Fallback
UPDATE employee_workflows 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

-- Rendre NOT NULL
ALTER TABLE employee_workflows 
ALTER COLUMN organization_id SET NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_employee_workflows_organization ON employee_workflows(organization_id);

-- ============================================================================
-- ÉTAPE 8 : AJOUTER organization_id À TABLE EMPLOYEE_WORKFLOW_TASKS
-- ============================================================================

-- Ajouter la colonne
ALTER TABLE employee_workflow_tasks 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Stratégie : via le workflow associé
UPDATE employee_workflow_tasks ewt
SET organization_id = (
  SELECT ew.organization_id 
  FROM employee_workflows ew 
  WHERE ew.id = ewt.workflow_id
)
WHERE ewt.organization_id IS NULL AND ewt.workflow_id IS NOT NULL;

-- Fallback
UPDATE employee_workflow_tasks 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

-- Rendre NOT NULL
ALTER TABLE employee_workflow_tasks 
ALTER COLUMN organization_id SET NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_employee_workflow_tasks_organization ON employee_workflow_tasks(organization_id);

-- ============================================================================
-- ÉTAPE 9 : AJOUTER organization_id À TABLE WORKFLOW_TEMPLATES
-- ============================================================================

-- Ajouter la colonne
ALTER TABLE workflow_templates 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Stratégie : via created_by
UPDATE workflow_templates wt
SET organization_id = (
  SELECT u.organization_id 
  FROM users u 
  WHERE u.id = wt.created_by
)
WHERE wt.organization_id IS NULL AND wt.created_by IS NOT NULL;

-- Fallback
UPDATE workflow_templates 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

-- Rendre NOT NULL
ALTER TABLE workflow_templates 
ALTER COLUMN organization_id SET NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_workflow_templates_organization ON workflow_templates(organization_id);

-- ============================================================================
-- ÉTAPE 10 : AJOUTER organization_id À TABLE WORKFLOW_TASKS
-- ============================================================================

-- Ajouter la colonne
ALTER TABLE workflow_tasks 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Stratégie : via le template associé
UPDATE workflow_tasks wt
SET organization_id = (
  SELECT wtpl.organization_id 
  FROM workflow_templates wtpl 
  WHERE wtpl.id = wt.template_id
)
WHERE wt.organization_id IS NULL AND wt.template_id IS NOT NULL;

-- Fallback
UPDATE workflow_tasks 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

-- Rendre NOT NULL
ALTER TABLE workflow_tasks 
ALTER COLUMN organization_id SET NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_organization ON workflow_tasks(organization_id);

-- ============================================================================
-- ÉTAPE 11 : AUTRES TABLES (SI ELLES EXISTENT)
-- ============================================================================

-- Documents
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;
    
    -- Via uploaded_by ou contract_id selon la structure
    UPDATE documents d
    SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
    WHERE organization_id IS NULL;
    
    ALTER TABLE documents ALTER COLUMN organization_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents(organization_id);
  END IF;
END $$;

-- Asset assignments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_assignments') THEN
    ALTER TABLE asset_assignments ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;
    
    -- Via l'asset
    UPDATE asset_assignments aa
    SET organization_id = (
      SELECT a.organization_id 
      FROM assets a 
      WHERE a.id = aa.asset_id
    )
    WHERE aa.organization_id IS NULL;
    
    ALTER TABLE asset_assignments ALTER COLUMN organization_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_asset_assignments_organization ON asset_assignments(organization_id);
  END IF;
END $$;

-- Notifications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;
    
    -- Via user_id
    UPDATE notifications n
    SET organization_id = (
      SELECT u.organization_id 
      FROM users u 
      WHERE u.id = n.user_id
    )
    WHERE n.organization_id IS NULL;
    
    UPDATE notifications 
    SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
    WHERE organization_id IS NULL;
    
    ALTER TABLE notifications ALTER COLUMN organization_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_notifications_organization ON notifications(organization_id);
  END IF;
END $$;

-- Department allocations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'department_allocations') THEN
    ALTER TABLE department_allocations ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;
    
    UPDATE department_allocations 
    SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
    WHERE organization_id IS NULL;
    
    ALTER TABLE department_allocations ALTER COLUMN organization_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_department_allocations_organization ON department_allocations(organization_id);
  END IF;
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

DO $$
DECLARE
  org_count INT;
  users_count INT;
  employees_count INT;
  contracts_count INT;
  assets_count INT;
  workflows_count INT;
  tasks_count INT;
  templates_count INT;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations;
  SELECT COUNT(*) INTO users_count FROM users WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO employees_count FROM employees WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO contracts_count FROM contracts WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO assets_count FROM assets WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO workflows_count FROM employee_workflows WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO tasks_count FROM employee_workflow_tasks WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO templates_count FROM workflow_templates WHERE organization_id IS NOT NULL;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 2 TERMINEE AVEC SUCCES';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Organizations: %', org_count;
  RAISE NOTICE 'Users: %', users_count;
  RAISE NOTICE 'Employees: %', employees_count;
  RAISE NOTICE 'Contracts: %', contracts_count;
  RAISE NOTICE 'Assets: %', assets_count;
  RAISE NOTICE 'Workflows: %', workflows_count;
  RAISE NOTICE 'Tasks: %', tasks_count;
  RAISE NOTICE 'Templates: %', templates_count;
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Votre application est maintenant MULTI-TENANT !';
  RAISE NOTICE '============================================';
END $$;

-- Vérifier qu'il n'y a AUCUN NULL
SELECT 
  table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as null_count
FROM (
  SELECT 'users' as table_name, organization_id FROM users
  UNION ALL
  SELECT 'employees', organization_id FROM employees
  UNION ALL
  SELECT 'contracts', organization_id FROM contracts
  UNION ALL
  SELECT 'assets', organization_id FROM assets
  UNION ALL
  SELECT 'employee_workflows', organization_id FROM employee_workflows
  UNION ALL
  SELECT 'employee_workflow_tasks', organization_id FROM employee_workflow_tasks
  UNION ALL
  SELECT 'workflow_templates', organization_id FROM workflow_templates
  UNION ALL
  SELECT 'workflow_tasks', organization_id FROM workflow_tasks
) sub
GROUP BY table_name
ORDER BY table_name;

-- Résumé par organization
SELECT 
  o.id,
  o.name,
  o.slug,
  o.subscription_plan,
  o.subscription_status,
  COUNT(DISTINCT u.id) as users,
  COUNT(DISTINCT e.id) as employees,
  COUNT(DISTINCT c.id) as contracts,
  COUNT(DISTINCT a.id) as assets,
  COUNT(DISTINCT ew.id) as workflows,
  COUNT(DISTINCT wt.id) as templates
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
LEFT JOIN employees e ON e.organization_id = o.id
LEFT JOIN contracts c ON c.organization_id = o.id
LEFT JOIN assets a ON a.organization_id = o.id
LEFT JOIN employee_workflows ew ON ew.organization_id = o.id
LEFT JOIN workflow_templates wt ON wt.organization_id = o.id
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.name, o.slug, o.subscription_plan, o.subscription_status
ORDER BY o.id;
