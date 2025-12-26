-- ============================================================================
-- MIGRATION 1 : COMPLÉTER L'AUDIT TRAIL
-- ============================================================================
-- Date : 26 décembre 2025
-- Objectif : Ajouter colonnes audit manquantes (created_by, updated_by, deleted_at, deleted_by)
-- Durée estimée : 5 min
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : TABLE USERS
-- ============================================================================

-- Ajouter created_by (NULL car pas de user avant le premier user)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Ajouter updated_by
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Ajouter deleted_at (soft delete)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Ajouter deleted_by
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- ============================================================================
-- ÉTAPE 2 : TABLE CONTRACTS
-- ============================================================================

-- Ajouter created_by (on va le déduire de user_id qui existe déjà)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Migrer : created_by = user_id (le user qui a créé le contrat)
UPDATE contracts 
SET created_by = user_id 
WHERE created_by IS NULL;

-- Ajouter updated_by
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS updated_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Ajouter deleted_at (soft delete)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Ajouter deleted_by
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS deleted_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON contracts(deleted_at);

-- ============================================================================
-- ÉTAPE 3 : TABLE EMPLOYEES
-- ============================================================================
-- created_by et updated_by existent déjà ✅
-- On ajoute juste deleted_at et deleted_by

-- Ajouter deleted_at (soft delete)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Ajouter deleted_by
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS deleted_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_employees_deleted_at ON employees(deleted_at);

-- ============================================================================
-- ÉTAPE 4 : TABLE ASSETS
-- ============================================================================
-- created_by et updated_by existent déjà ✅
-- On ajoute juste deleted_at et deleted_by

-- Ajouter deleted_at (soft delete)
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Ajouter deleted_by
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS deleted_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_assets_deleted_at ON assets(deleted_at);

-- ============================================================================
-- ÉTAPE 5 : TABLE EMPLOYEE_WORKFLOWS
-- ============================================================================
-- created_by existe déjà ✅
-- On ajoute updated_by, deleted_at, deleted_by

-- Ajouter updated_by
ALTER TABLE employee_workflows 
ADD COLUMN IF NOT EXISTS updated_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Ajouter deleted_at (soft delete)
ALTER TABLE employee_workflows 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Ajouter deleted_by
ALTER TABLE employee_workflows 
ADD COLUMN IF NOT EXISTS deleted_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_employee_workflows_deleted_at ON employee_workflows(deleted_at);

-- ============================================================================
-- ÉTAPE 6 : TABLE EMPLOYEE_WORKFLOW_TASKS
-- ============================================================================

-- Ajouter created_by
ALTER TABLE employee_workflow_tasks 
ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Ajouter updated_by
ALTER TABLE employee_workflow_tasks 
ADD COLUMN IF NOT EXISTS updated_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Ajouter deleted_at (soft delete)
ALTER TABLE employee_workflow_tasks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Ajouter deleted_by
ALTER TABLE employee_workflow_tasks 
ADD COLUMN IF NOT EXISTS deleted_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_employee_workflow_tasks_created_by ON employee_workflow_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_employee_workflow_tasks_deleted_at ON employee_workflow_tasks(deleted_at);

-- ============================================================================
-- ÉTAPE 7 : TABLE WORKFLOW_TEMPLATES
-- ============================================================================
-- created_by et updated_by existent déjà ✅
-- On ajoute juste deleted_at et deleted_by

-- Ajouter deleted_at (soft delete)
ALTER TABLE workflow_templates 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Ajouter deleted_by
ALTER TABLE workflow_templates 
ADD COLUMN IF NOT EXISTS deleted_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_workflow_templates_deleted_at ON workflow_templates(deleted_at);

-- ============================================================================
-- ÉTAPE 8 : TABLE WORKFLOW_TASKS
-- ============================================================================

-- Ajouter created_by
ALTER TABLE workflow_tasks 
ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Ajouter updated_by
ALTER TABLE workflow_tasks 
ADD COLUMN IF NOT EXISTS updated_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Ajouter deleted_at (soft delete)
ALTER TABLE workflow_tasks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Ajouter deleted_by
ALTER TABLE workflow_tasks 
ADD COLUMN IF NOT EXISTS deleted_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_created_by ON workflow_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_deleted_at ON workflow_tasks(deleted_at);

-- ============================================================================
-- ÉTAPE 9 : AUTRES TABLES (si elles existent)
-- ============================================================================

-- Documents
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_by INT REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_by INT REFERENCES users(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
    CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at);
  END IF;
END $$;

-- Asset assignments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_assignments') THEN
    ALTER TABLE asset_assignments ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE asset_assignments ADD COLUMN IF NOT EXISTS updated_by INT REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE asset_assignments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    ALTER TABLE asset_assignments ADD COLUMN IF NOT EXISTS deleted_by INT REFERENCES users(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_asset_assignments_created_by ON asset_assignments(created_by);
    CREATE INDEX IF NOT EXISTS idx_asset_assignments_deleted_at ON asset_assignments(deleted_at);
  END IF;
END $$;

-- Notifications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    
    CREATE INDEX IF NOT EXISTS idx_notifications_deleted_at ON notifications(deleted_at);
  END IF;
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 1 TERMINEE AVEC SUCCES';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Colonnes audit trail ajoutees :';
  RAISE NOTICE '- created_by (partout)';
  RAISE NOTICE '- updated_by (partout)';
  RAISE NOTICE '- deleted_at (partout - soft delete)';
  RAISE NOTICE '- deleted_by (partout)';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Prochaine etape : Migration 2 (multi-tenant)';
  RAISE NOTICE '============================================';
END $$;

-- Afficher un résumé des colonnes ajoutées
SELECT 
  table_name,
  COUNT(*) FILTER (WHERE column_name = 'created_by') as has_created_by,
  COUNT(*) FILTER (WHERE column_name = 'updated_by') as has_updated_by,
  COUNT(*) FILTER (WHERE column_name = 'deleted_at') as has_deleted_at,
  COUNT(*) FILTER (WHERE column_name = 'deleted_by') as has_deleted_by
FROM information_schema.columns
WHERE table_name IN ('users', 'employees', 'contracts', 'assets', 'employee_workflows', 
                     'employee_workflow_tasks', 'workflow_templates', 'workflow_tasks')
GROUP BY table_name
ORDER BY table_name;
