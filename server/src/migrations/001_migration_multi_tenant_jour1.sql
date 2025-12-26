-- ============================================================================
-- MIGRATION MULTI-TENANT - JOUR 1
-- ============================================================================
-- Date : 25 décembre 2025
-- Objectif : Transformer l'application en multi-tenant
-- Durée estimée : 4-5h
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : CRÉER TABLE ORGANIZATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  
  -- Informations de base
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  
  -- Abonnement (pour plus tard, on met des valeurs par défaut maintenant)
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  
  -- Limites (par défaut illimitées pour l'instant)
  max_users INT DEFAULT -1, -- -1 = illimité
  max_employees INT DEFAULT -1,
  
  -- Dates
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- Soft delete
);

-- Index
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status);

COMMENT ON TABLE organizations IS 'Table des organisations/tenants - chaque client = 1 organization';
COMMENT ON COLUMN organizations.max_users IS '-1 signifie illimité';

-- ============================================================================
-- ÉTAPE 2 : CRÉER "DEFAULT ORGANIZATION" POUR LES DONNÉES EXISTANTES
-- ============================================================================

INSERT INTO organizations (name, slug, subscription_plan, subscription_status, max_users, max_employees)
VALUES ('Default Organization', 'default', 'enterprise', 'active', -1, -1)
ON CONFLICT (slug) DO NOTHING;

-- Récupérer l'ID de la Default Organization (utile pour la suite)
DO $$
DECLARE
  default_org_id INT;
BEGIN
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'default';
  RAISE NOTICE 'Default Organization ID: %', default_org_id;
END $$;

-- ============================================================================
-- ÉTAPE 3 : AJOUTER organization_id À LA TABLE USERS
-- ============================================================================

-- Ajouter la colonne (nullable au début)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Migrer toutes les données existantes vers Default Organization
UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

-- Maintenant rendre la colonne NOT NULL
ALTER TABLE users 
ALTER COLUMN organization_id SET NOT NULL;

-- Ajouter index
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);

COMMENT ON COLUMN users.organization_id IS 'Organisation à laquelle appartient l\'utilisateur';

-- ============================================================================
-- ÉTAPE 4 : AJOUTER organization_id À LA TABLE EMPLOYEES
-- ============================================================================

-- Ajouter la colonne
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Migrer les données : utiliser l'organization_id du created_by user
UPDATE employees e
SET organization_id = (
  SELECT u.organization_id 
  FROM users u 
  WHERE u.id = e.created_by
)
WHERE e.organization_id IS NULL;

-- Si certains employees n'ont pas de created_by (données orphelines), les mettre dans Default
UPDATE employees 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

-- Rendre NOT NULL
ALTER TABLE employees 
ALTER COLUMN organization_id SET NOT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_employees_organization ON employees(organization_id);

COMMENT ON COLUMN employees.organization_id IS 'Organisation à laquelle appartient l\'employé';

-- ============================================================================
-- ÉTAPE 5 : AJOUTER organization_id À LA TABLE CONTRACTS
-- ============================================================================

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Migrer via created_by
UPDATE contracts c
SET organization_id = (
  SELECT u.organization_id 
  FROM users u 
  WHERE u.id = c.created_by
)
WHERE c.organization_id IS NULL;

-- Fallback Default Organization
UPDATE contracts 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

ALTER TABLE contracts 
ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_organization ON contracts(organization_id);

COMMENT ON COLUMN contracts.organization_id IS 'Organisation à laquelle appartient le contrat';

-- ============================================================================
-- ÉTAPE 6 : AJOUTER organization_id À LA TABLE ASSETS
-- ============================================================================

ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Migrer via created_by
UPDATE assets a
SET organization_id = (
  SELECT u.organization_id 
  FROM users u 
  WHERE u.id = a.created_by
)
WHERE a.organization_id IS NULL;

-- Fallback
UPDATE assets 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

ALTER TABLE assets 
ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assets_organization ON assets(organization_id);

COMMENT ON COLUMN assets.organization_id IS 'Organisation à laquelle appartient l\'asset';

-- ============================================================================
-- ÉTAPE 7 : AJOUTER organization_id À LA TABLE WORKFLOWS
-- ============================================================================

ALTER TABLE workflows 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Migrer via created_by
UPDATE workflows w
SET organization_id = (
  SELECT u.organization_id 
  FROM users u 
  WHERE u.id = w.created_by
)
WHERE w.organization_id IS NULL;

-- Fallback
UPDATE workflows 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

ALTER TABLE workflows 
ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workflows_organization ON workflows(organization_id);

COMMENT ON COLUMN workflows.organization_id IS 'Organisation à laquelle appartient le workflow';

-- ============================================================================
-- ÉTAPE 8 : AJOUTER organization_id À LA TABLE WORKFLOW_TEMPLATES
-- ============================================================================

ALTER TABLE workflow_templates 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- Migrer via created_by
UPDATE workflow_templates wt
SET organization_id = (
  SELECT u.organization_id 
  FROM users u 
  WHERE u.id = wt.created_by
)
WHERE wt.organization_id IS NULL;

-- Fallback
UPDATE workflow_templates 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL;

ALTER TABLE workflow_templates 
ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workflow_templates_organization ON workflow_templates(organization_id);

COMMENT ON COLUMN workflow_templates.organization_id IS 'Organisation à laquelle appartient le template';

-- ============================================================================
-- ÉTAPE 9 : AJOUTER organization_id AUX AUTRES TABLES (SI ELLES EXISTENT)
-- ============================================================================

-- Asset assignments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_assignments') THEN
    ALTER TABLE asset_assignments 
    ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;
    
    -- Migrer via l'asset
    UPDATE asset_assignments aa
    SET organization_id = (
      SELECT a.organization_id 
      FROM assets a 
      WHERE a.id = aa.asset_id
    )
    WHERE aa.organization_id IS NULL;
    
    ALTER TABLE asset_assignments 
    ALTER COLUMN organization_id SET NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_asset_assignments_organization ON asset_assignments(organization_id);
  END IF;
END $$;

-- Documents (si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    ALTER TABLE documents 
    ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;
    
    UPDATE documents d
    SET organization_id = (
      SELECT u.organization_id 
      FROM users u 
      WHERE u.id = d.uploaded_by
    )
    WHERE d.organization_id IS NULL;
    
    UPDATE documents 
    SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
    WHERE organization_id IS NULL;
    
    ALTER TABLE documents 
    ALTER COLUMN organization_id SET NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents(organization_id);
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 10 : VÉRIFICATIONS FINALES
-- ============================================================================

-- Compter les enregistrements par table
DO $$
DECLARE
  org_count INT;
  users_count INT;
  employees_count INT;
  contracts_count INT;
  assets_count INT;
  workflows_count INT;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations;
  SELECT COUNT(*) INTO users_count FROM users WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO employees_count FROM employees WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO contracts_count FROM contracts WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO assets_count FROM assets WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO workflows_count FROM workflows WHERE organization_id IS NOT NULL;
  
  RAISE NOTICE '✅ MIGRATION TERMINÉE';
  RAISE NOTICE '─────────────────────────────────────────';
  RAISE NOTICE 'Organizations: %', org_count;
  RAISE NOTICE 'Users avec organization_id: %', users_count;
  RAISE NOTICE 'Employees avec organization_id: %', employees_count;
  RAISE NOTICE 'Contracts avec organization_id: %', contracts_count;
  RAISE NOTICE 'Assets avec organization_id: %', assets_count;
  RAISE NOTICE 'Workflows avec organization_id: %', workflows_count;
  RAISE NOTICE '─────────────────────────────────────────';
END $$;

-- Vérifier l'intégrité des données (aucun NULL ne doit rester)
SELECT 
  'users' as table_name,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as null_count
FROM users
UNION ALL
SELECT 'employees', COUNT(*) FILTER (WHERE organization_id IS NULL) FROM employees
UNION ALL
SELECT 'contracts', COUNT(*) FILTER (WHERE organization_id IS NULL) FROM contracts
UNION ALL
SELECT 'assets', COUNT(*) FILTER (WHERE organization_id IS NULL) FROM assets
UNION ALL
SELECT 'workflows', COUNT(*) FILTER (WHERE organization_id IS NULL) FROM workflows;

-- ============================================================================
-- MIGRATION TERMINÉE ✅
-- ============================================================================

-- Pour afficher un résumé
SELECT 
  o.id,
  o.name,
  o.slug,
  o.subscription_plan,
  o.subscription_status,
  COUNT(DISTINCT u.id) as users_count,
  COUNT(DISTINCT e.id) as employees_count,
  COUNT(DISTINCT c.id) as contracts_count,
  COUNT(DISTINCT a.id) as assets_count,
  COUNT(DISTINCT w.id) as workflows_count
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
LEFT JOIN employees e ON e.organization_id = o.id
LEFT JOIN contracts c ON c.organization_id = o.id
LEFT JOIN assets a ON a.organization_id = o.id
LEFT JOIN workflows w ON w.organization_id = o.id
GROUP BY o.id, o.name, o.slug, o.subscription_plan, o.subscription_status;
