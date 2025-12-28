-- ============================================================================
-- MIGRATION SQL - TABLE HISTORIQUE USAGE + TRIGGER (CORRIGÉE)
-- ============================================================================
-- Fichier : migrations/003_contract_usage_history.sql
-- Description : Table pour stocker historique mensuel usage (ML prédictif)
-- ✅ CORRECTION : Alias de table explicites dans DO block
-- ============================================================================

-- 1. Créer table historique
CREATE TABLE IF NOT EXISTS contract_usage_history (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: '2025-01'
    total_licenses INTEGER,
    licenses_used INTEGER,
    active_users INTEGER,
    usage_rate DECIMAL(5,2), -- Pourcentage utilisation
    monthly_cost DECIMAL(10,2),
    recorded_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(contract_id, month)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_usage_history_contract ON contract_usage_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_org ON contract_usage_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_month ON contract_usage_history(month);

-- 2. Fonction pour enregistrer snapshot mensuel
CREATE OR REPLACE FUNCTION record_monthly_usage_snapshot() RETURNS void AS $$
BEGIN
    INSERT INTO contract_usage_history (
        contract_id,
        organization_id,
        month,
        total_licenses,
        licenses_used,
        active_users,
        usage_rate,
        monthly_cost
    )
    SELECT 
        c.id,
        c.organization_id,
        TO_CHAR(NOW(), 'YYYY-MM'),
        c.total_licenses,
        c.licenses_used,
        c.active_users,
        CASE 
            WHEN c.total_licenses > 0 THEN (c.licenses_used::DECIMAL / c.total_licenses::DECIMAL) * 100
            ELSE 0
        END as usage_rate,
        c.monthly_cost
    FROM contracts c
    WHERE c.deleted_at IS NULL
        AND c.pricing_model = 'per_user'
        AND c.total_licenses IS NOT NULL
    ON CONFLICT (contract_id, month) 
    DO UPDATE SET
        total_licenses = EXCLUDED.total_licenses,
        licenses_used = EXCLUDED.licenses_used,
        active_users = EXCLUDED.active_users,
        usage_rate = EXCLUDED.usage_rate,
        monthly_cost = EXCLUDED.monthly_cost,
        recorded_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 3. Peupler avec données historiques simulées (6 mois)
-- ⚠️ EXÉCUTER UNE SEULE FOIS
DO $$
DECLARE
    current_month DATE := DATE_TRUNC('month', NOW());
    offset_months INTEGER;
BEGIN
    -- Générer 6 mois d'historique pour chaque contrat
    FOR offset_months IN 1..6 LOOP
        INSERT INTO contract_usage_history (
            contract_id,
            organization_id,
            month,
            total_licenses,
            licenses_used,
            active_users,
            usage_rate,
            monthly_cost
        )
        SELECT 
            c.id,
            c.organization_id,
            TO_CHAR(current_month - (offset_months || ' months')::INTERVAL, 'YYYY-MM'),
            c.total_licenses,
            -- Simuler variation usage (-5% par mois par exemple)
            GREATEST(1, COALESCE(c.licenses_used, 0) - (offset_months * GREATEST(1, COALESCE(c.licenses_used, 1) / 20))),
            GREATEST(0, COALESCE(c.active_users, 0) - (offset_months * GREATEST(1, COALESCE(c.active_users, 1) / 20))),
            CASE 
                WHEN c.total_licenses > 0 AND c.licenses_used IS NOT NULL THEN 
                    (GREATEST(1, c.licenses_used - (offset_months * GREATEST(1, c.licenses_used / 20)))::DECIMAL / c.total_licenses::DECIMAL) * 100
                ELSE 0
            END as usage_rate,
            c.monthly_cost
        FROM contracts c
        WHERE c.deleted_at IS NULL
            AND c.pricing_model = 'per_user'
            AND c.total_licenses IS NOT NULL
        ON CONFLICT (contract_id, month) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Données historiques générées pour 6 mois';
END $$;

-- 4. CRON Job mensuel (à configurer manuellement ou via pg_cron)
-- Exécuter le 1er de chaque mois :
-- SELECT record_monthly_usage_snapshot();

-- Vérification des données insérées
SELECT 
    c.name as contrat,
    cuh.month,
    cuh.total_licenses,
    cuh.licenses_used,
    cuh.usage_rate,
    cuh.recorded_at
FROM contract_usage_history cuh
JOIN contracts c ON cuh.contract_id = c.id
ORDER BY c.name, cuh.month DESC
LIMIT 30;
