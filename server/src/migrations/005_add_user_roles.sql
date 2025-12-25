-- ============================================================================
-- MIGRATION : AJOUT SYSTÈME DE RÔLES
-- ============================================================================
-- Date : 25 décembre 2025
-- Description : Ajouter colonne role à users + promouvoir super_admin
-- ============================================================================

-- Ajouter colonne role avec valeur par défaut 'user'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Promouvoir abbouchary@gmail.com en super_admin
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'abbouchary@gmail.com';

-- Vérification
SELECT id, email, role, created_at 
FROM users 
WHERE email = 'abbouchary@gmail.com';

-- ============================================================================
-- NOTES
-- ============================================================================
-- Rôles disponibles :
-- - user         : Utilisateur normal (peut voir ses tâches assignées)
-- - admin        : Gestionnaire (peut gérer employés/contrats/assets de son tenant)
-- - super_admin  : Super administrateur (peut créer d'autres utilisateurs)
--
-- Par défaut, tous les nouveaux users sont 'user'
-- Seul un super_admin peut promouvoir d'autres users
-- ============================================================================
