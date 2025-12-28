-- ============================================================================
-- MIGRATION SQL - TABLE HISTORIQUE USAGE (VERSION PÉRENNE)
-- ============================================================================
-- Fichier : migrations/003_contract_usage_history_FINAL.sql
-- Description : Table historique 100% adaptée au schéma contracts réel
-- ✅ PÉRENNE : Utilise license_count, licenses_used, real_users
-- ============================================================================

-- 1. Créer table historique
CREATE TABLE IF NOT EXISTS contract_usage_history (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM' ex: '2025-01'
    license_count INTEGER, -- Nombre licences achetées
    licenses_used INTEGER, -- Nombre licences utilisées
    real_users INTEGER, -- Nombre utilisateurs réels
    usage_rate DECIMAL(5,2), -- Pourcentage utilisation (licenses_used / license_count * 100)
    monthly_cost DECIMAL(10,2), -- Coût mensuel
    recorded_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(contract_id, month)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_usage_history_contract ON contract_usage_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_org ON contract_usage_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_month ON contract_usage_history(month);

COMMENT ON TABLE contract_usage_history IS 'Historique mensuel d''utilisation des contrats pour ML prédictif';
COMMENT ON COLUMN contract_usage_history.usage_rate IS 'Taux utilisation = (licenses_used / license_count) * 100';

-- 2. Fonction pour enregistrer snapshot mensuel (CRON mensuel)
CREATE OR REPLACE FUNCTION record_monthly_usage_snapshot() RETURNS void AS $$
BEGIN
    INSERT INTO contract_usage_history (
        contract_id,
        organization_id,
        month,
        license_count,
        licenses_used,
        real_users,
        usage_rate,
        monthly_cost
    )
    SELECT 
        c.id,
        c.organization_id,
        TO_CHAR(NOW(), 'YYYY-MM'),
        COALESCE(c.license_count, 0),
        COALESCE(c.licenses_used, 0),
        COALESCE(c.real_users, 0),
        CASE 
            WHEN COALESCE(c.license_count, 0) > 0 THEN 
                (COALESCE(c.licenses_used, 0)::DECIMAL / c.license_count::DECIMAL) * 100
            ELSE 0
        END,
        COALESCE(c.monthly_cost, 0)
    FROM contracts c
    WHERE c.deleted_at IS NULL
        AND c.pricing_model = 'per_user'
        AND c.license_count IS NOT NULL
        AND c.license_count > 0
    ON CONFLICT (contract_id, month) 
    DO UPDATE SET
        license_count = EXCLUDED.license_count,
        licenses_used = EXCLUDED.licenses_used,
        real_users = EXCLUDED.real_users,
        usage_rate = EXCLUDED.usage_rate,
        monthly_cost = EXCLUDED.monthly_cost,
        recorded_at = NOW();
    
    RAISE NOTICE 'Snapshot mensuel enregistré pour % contrats', (SELECT COUNT(*) FROM contracts WHERE deleted_at IS NULL AND pricing_model = 'per_user' AND license_count > 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_monthly_usage_snapshot IS 'À exécuter le 1er de chaque mois via CRON: SELECT record_monthly_usage_snapshot();';

-- 3. Peupler avec données historiques simulées (6 mois pour ML)
-- ⚠️ EXÉCUTER UNE SEULE FOIS lors de l'installation initiale
DO $$
DECLARE
    current_month DATE := DATE_TRUNC('month', NOW());
    offset_months INTEGER;
    contracts_count INTEGER;
    rows_inserted INTEGER := 0;
BEGIN
    -- Compter contrats éligibles
    SELECT COUNT(*) INTO contracts_count
    FROM contracts
    WHERE deleted_at IS NULL
        AND pricing_model = 'per_user'
        AND license_count IS NOT NULL
        AND license_count > 0;
    
    RAISE NOTICE 'Génération historique pour % contrats éligibles...', contracts_count;
    
    IF contracts_count = 0 THEN
        RAISE NOTICE 'Aucun contrat éligible trouvé (pricing_model=per_user avec license_count > 0)';
        RETURN;
    END IF;
    
    -- Générer 6 mois d'historique pour chaque contrat
    FOR offset_months IN 1..6 LOOP
        INSERT INTO contract_usage_history (
            contract_id,
            organization_id,
            month,
            license_count,
            licenses_used,
            real_users,
            usage_rate,
            monthly_cost
        )
        SELECT 
            c.id,
            c.organization_id,
            TO_CHAR(current_month - (offset_months || ' months')::INTERVAL, 'YYYY-MM'),
            COALESCE(c.license_count, 0),
            -- Simuler variation usage : décroissance légère (~3-5% par mois)
            CASE 
                WHEN COALESCE(c.licenses_used, 0) > 0 THEN
                    GREATEST(
                        1, 
                        c.licenses_used - (offset_months * GREATEST(1, c.licenses_used / 20))
                    )
                ELSE 0
            END,
            -- Simuler variation real_users (peut dépasser license_count)
            CASE 
                WHEN COALESCE(c.real_users, 0) > 0 THEN
                    GREATEST(
                        0, 
                        c.real_users - (offset_months * GREATEST(0, c.real_users / 25))
                    )
                ELSE 0
            END,
            -- Calcul usage_rate basé sur licenses_used simulé
            CASE 
                WHEN COALESCE(c.license_count, 0) > 0 AND COALESCE(c.licenses_used, 0) > 0 THEN 
                    (
                        GREATEST(1, c.licenses_used - (offset_months * GREATEST(1, c.licenses_used / 20)))::DECIMAL 
                        / c.license_count::DECIMAL
                    ) * 100
                ELSE 0
            END,
            COALESCE(c.monthly_cost, 0)
        FROM contracts c
        WHERE c.deleted_at IS NULL
            AND c.pricing_model = 'per_user'
            AND c.license_count IS NOT NULL
            AND c.license_count > 0
        ON CONFLICT (contract_id, month) DO NOTHING;
        
        GET DIAGNOSTICS rows_inserted = ROW_COUNT;
        RAISE NOTICE 'Mois -% : % lignes insérées', offset_months, rows_inserted;
    END LOOP;
    
    RAISE NOTICE '✅ Données historiques générées avec succès pour 6 mois';
END $$;

-- 4. Vérification des données insérées
DO $$
DECLARE
    total_rows INTEGER;
    total_contracts INTEGER;
    oldest_month VARCHAR(7);
    newest_month VARCHAR(7);
BEGIN
    SELECT 
        COUNT(*),
        COUNT(DISTINCT contract_id),
        MIN(month),
        MAX(month)
    INTO total_rows, total_contracts, oldest_month, newest_month
    FROM contract_usage_history;
    
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '📊 STATISTIQUES HISTORIQUE';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE 'Total lignes : %', total_rows;
    RAISE NOTICE 'Contrats suivis : %', total_contracts;
    RAISE NOTICE 'Période : % → %', oldest_month, newest_month;
    RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- 5. Afficher aperçu des données
SELECT 
    c.name as contrat,
    c.provider as fournisseur,
    c.license_count as licences_achetées,
    c.licenses_used as licences_utilisées_actuelles,
    c.real_users as utilisateurs_réels_actuels,
    cuh.month as mois_historique,
    cuh.license_count as hist_licences,
    cuh.licenses_used as hist_utilisées,
    cuh.usage_rate as hist_taux_usage,
    cuh.recorded_at as enregistré_le
FROM contract_usage_history cuh
JOIN contracts c ON cuh.contract_id = c.id
ORDER BY c.name, cuh.month DESC
LIMIT 20;

-- 6. Stats finales par contrat
SELECT 
    c.name as contrat,
    COUNT(cuh.id) as mois_historique,
    ROUND(AVG(cuh.usage_rate), 2) as usage_moyen,
    MIN(cuh.usage_rate) as usage_min,
    MAX(cuh.usage_rate) as usage_max,
    CASE 
        WHEN COUNT(cuh.id) >= 2 THEN 'ML prédictif OK'
        ELSE 'Historique insuffisant'
    END as statut_ml
FROM contracts c
LEFT JOIN contract_usage_history cuh ON cuh.contract_id = c.id
WHERE c.deleted_at IS NULL AND c.pricing_model = 'per_user'
GROUP BY c.id, c.name
ORDER BY COUNT(cuh.id) DESC;

-- 7. Script de maintenance mensuel (à programmer via CRON)
-- À exécuter le 1er de chaque mois :
-- SELECT record_monthly_usage_snapshot();

COMMENT ON TABLE contract_usage_history IS 'Historique mensuel usage contrats - ML prédictif - Dernière MAJ: NOW()';
