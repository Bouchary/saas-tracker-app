-- Migration 005: Système MDM complet pour inventaire automatique
-- Date: 2024-12-30
-- Description: Tables pour agents MDM, inventaire automatique, historique et alertes

-- ============================================================================
-- TABLE 1 : MDM_DEVICES - Appareils enregistrés
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdm_devices (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
    
    -- Authentification
    device_token VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255),
    
    -- Identification matériel
    hostname VARCHAR(255),
    mac_address VARCHAR(17),
    serial_number VARCHAR(255),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    
    -- Système
    os_type VARCHAR(50), -- windows, macos, linux
    os_version VARCHAR(100),
    os_build VARCHAR(100),
    
    -- Spécifications
    cpu_model VARCHAR(255),
    cpu_cores INTEGER,
    ram_gb DECIMAL(10,2),
    disk_total_gb DECIMAL(10,2),
    disk_free_gb DECIMAL(10,2),
    
    -- Réseau
    ip_local VARCHAR(45),
    ip_public VARCHAR(45),
    domain_name VARCHAR(255),
    
    -- Utilisateur
    current_username VARCHAR(255),
    department VARCHAR(100),
    location VARCHAR(255),
    
    -- Statut
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, offline, decommissioned
    agent_version VARCHAR(20),
    last_seen TIMESTAMP,
    last_boot TIMESTAMP,
    
    -- Métadonnées
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    
    -- Contraintes
    CONSTRAINT unique_device_per_org UNIQUE(organization_id, serial_number)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_mdm_devices_org ON mdm_devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_mdm_devices_asset ON mdm_devices(asset_id);
CREATE INDEX IF NOT EXISTS idx_mdm_devices_status ON mdm_devices(status);
CREATE INDEX IF NOT EXISTS idx_mdm_devices_last_seen ON mdm_devices(last_seen);
CREATE INDEX IF NOT EXISTS idx_mdm_devices_token ON mdm_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_mdm_devices_serial ON mdm_devices(serial_number);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_mdm_devices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mdm_devices_timestamp
    BEFORE UPDATE ON mdm_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_mdm_devices_timestamp();

-- ============================================================================
-- TABLE 2 : MDM_INVENTORY_HISTORY - Historique collectes
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdm_inventory_history (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES mdm_devices(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Données collectées
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    inventory_data JSONB NOT NULL, -- Snapshot complet
    
    -- Changements détectés
    changes_detected JSONB, -- Liste des changements par rapport à précédent
    has_changes BOOLEAN DEFAULT false,
    
    -- Métriques
    cpu_usage_percent DECIMAL(5,2),
    ram_usage_percent DECIMAL(5,2),
    disk_usage_percent DECIMAL(5,2),
    
    -- Software
    software_count INTEGER,
    software_changes JSONB, -- Logiciels ajoutés/supprimés
    
    -- Alertes générées
    alerts_generated TEXT[],
    
    -- Métadonnées
    collection_duration_ms INTEGER,
    agent_version VARCHAR(20)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_mdm_history_device ON mdm_inventory_history(device_id);
CREATE INDEX IF NOT EXISTS idx_mdm_history_org ON mdm_inventory_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_mdm_history_date ON mdm_inventory_history(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_mdm_history_changes ON mdm_inventory_history(has_changes) WHERE has_changes = true;

-- Index GIN pour recherche JSON
CREATE INDEX IF NOT EXISTS idx_mdm_history_inventory_gin ON mdm_inventory_history USING GIN (inventory_data);
CREATE INDEX IF NOT EXISTS idx_mdm_history_changes_gin ON mdm_inventory_history USING GIN (changes_detected);

-- ============================================================================
-- TABLE 3 : MDM_ALERTS - Alertes système
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdm_alerts (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    device_id INTEGER REFERENCES mdm_devices(id) ON DELETE CASCADE,
    
    -- Type d'alerte
    alert_type VARCHAR(50) NOT NULL, -- new_device, offline, low_disk, high_cpu, antivirus_disabled, software_change, hardware_change, unauthorized_access
    severity VARCHAR(20) NOT NULL DEFAULT 'info', -- info, warning, critical
    
    -- Détails
    title VARCHAR(255) NOT NULL,
    message TEXT,
    details JSONB, -- Informations additionnelles
    
    -- Résolution
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    resolution_note TEXT,
    
    -- Actions
    action_required BOOLEAN DEFAULT false,
    action_taken VARCHAR(100),
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified BOOLEAN DEFAULT false, -- Email envoyé
    notified_at TIMESTAMP
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_mdm_alerts_org ON mdm_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_mdm_alerts_device ON mdm_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_mdm_alerts_type ON mdm_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_mdm_alerts_severity ON mdm_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_mdm_alerts_resolved ON mdm_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_mdm_alerts_created ON mdm_alerts(created_at DESC);

-- Index pour alertes non résolues
CREATE INDEX IF NOT EXISTS idx_mdm_alerts_unresolved ON mdm_alerts(organization_id, resolved, created_at DESC) WHERE resolved = false;

-- ============================================================================
-- VUES UTILES
-- ============================================================================

-- Vue : Devices avec dernière collecte
CREATE OR REPLACE VIEW vw_mdm_devices_with_last_inventory AS
SELECT 
    d.*,
    h.collected_at as last_inventory_at,
    h.cpu_usage_percent,
    h.ram_usage_percent,
    h.disk_usage_percent,
    h.software_count,
    CASE 
        WHEN d.last_seen > CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN 'online'
        WHEN d.last_seen > CURRENT_TIMESTAMP - INTERVAL '1 day' THEN 'recently_active'
        WHEN d.last_seen > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'inactive'
        ELSE 'offline'
    END as connection_status
FROM mdm_devices d
LEFT JOIN LATERAL (
    SELECT * FROM mdm_inventory_history 
    WHERE device_id = d.id 
    ORDER BY collected_at DESC 
    LIMIT 1
) h ON true;

-- Vue : Stats alertes par organisation
CREATE OR REPLACE VIEW vw_mdm_alerts_stats AS
SELECT 
    organization_id,
    COUNT(*) as total_alerts,
    COUNT(*) FILTER (WHERE resolved = false) as unresolved_alerts,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_alerts,
    COUNT(*) FILTER (WHERE severity = 'warning') as warning_alerts,
    COUNT(*) FILTER (WHERE severity = 'info') as info_alerts,
    COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as alerts_last_24h,
    COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days') as alerts_last_7days
FROM mdm_alerts
GROUP BY organization_id;

-- ============================================================================
-- FONCTIONS UTILES
-- ============================================================================

-- Fonction : Compter devices par statut
CREATE OR REPLACE FUNCTION get_mdm_device_counts(org_id INTEGER)
RETURNS TABLE(
    total_devices BIGINT,
    online_devices BIGINT,
    offline_devices BIGINT,
    inactive_devices BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_devices,
        COUNT(*) FILTER (WHERE last_seen > CURRENT_TIMESTAMP - INTERVAL '10 minutes') as online_devices,
        COUNT(*) FILTER (WHERE last_seen <= CURRENT_TIMESTAMP - INTERVAL '7 days' OR last_seen IS NULL) as offline_devices,
        COUNT(*) FILTER (WHERE last_seen > CURRENT_TIMESTAMP - INTERVAL '10 minutes' AND last_seen <= CURRENT_TIMESTAMP - INTERVAL '7 days') as inactive_devices
    FROM mdm_devices
    WHERE organization_id = org_id AND status != 'decommissioned';
END;
$$ LANGUAGE plpgsql;

-- Fonction : Nettoyer ancien historique (garder 90 jours)
CREATE OR REPLACE FUNCTION cleanup_old_mdm_history()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM mdm_inventory_history
    WHERE collected_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
    AND has_changes = false; -- Garder les collectes avec changements
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DONNÉES INITIALES
-- ============================================================================

-- Types d'alertes standards
COMMENT ON COLUMN mdm_alerts.alert_type IS 'Types: new_device, offline, low_disk, high_cpu, high_ram, antivirus_disabled, firewall_disabled, software_installed, software_removed, hardware_added, hardware_removed, os_update, unauthorized_access, compliance_violation';

-- ============================================================================
-- PERMISSIONS (si besoin)
-- ============================================================================

-- Accorder permissions sur les tables (ajuster selon vos besoins)
-- GRANT SELECT, INSERT, UPDATE ON mdm_devices TO your_app_user;
-- GRANT SELECT, INSERT ON mdm_inventory_history TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON mdm_alerts TO your_app_user;

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================

-- Vérification
SELECT 'Migration 005 MDM System créée avec succès!' as message,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'mdm_%') as tables_created,
       (SELECT COUNT(*) FROM information_schema.views WHERE table_name LIKE 'vw_mdm_%') as views_created;
