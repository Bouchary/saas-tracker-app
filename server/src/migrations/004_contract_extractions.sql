-- Migration 004: Table contract_extractions pour historique des extractions IA
-- Date: 2024-12-30
-- Description: Sauvegarde complète de toutes les extractions IA avec données enrichies

-- Table contract_extractions
CREATE TABLE IF NOT EXISTS contract_extractions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
    document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    
    -- Informations fichier
    original_filename VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_path TEXT,
    
    -- Métadonnées extraction
    extraction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    document_type VARCHAR(50), -- contract, invoice, quote, purchase_order, amendment, other
    document_language VARCHAR(10), -- fr, en, de, es, other
    confidence_score INTEGER, -- 0-100
    
    -- Données extraites (JSON complet)
    extracted_data JSONB NOT NULL,
    
    -- Statut et erreurs
    status VARCHAR(50) DEFAULT 'success', -- success, failed, partial
    error_message TEXT,
    
    -- Performance
    processing_time_ms INTEGER,
    api_tokens_used INTEGER,
    api_cost_cents INTEGER, -- Coût en centimes
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
    CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- Index pour performance
CREATE INDEX idx_extractions_user ON contract_extractions(user_id);
CREATE INDEX idx_extractions_org ON contract_extractions(organization_id);
CREATE INDEX idx_extractions_contract ON contract_extractions(contract_id);
CREATE INDEX idx_extractions_date ON contract_extractions(extraction_date DESC);
CREATE INDEX idx_extractions_type ON contract_extractions(document_type);
CREATE INDEX idx_extractions_status ON contract_extractions(status);

-- Index JSONB pour recherche dans extracted_data
CREATE INDEX idx_extractions_data ON contract_extractions USING gin(extracted_data);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_contract_extractions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_extractions_updated_at
    BEFORE UPDATE ON contract_extractions
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_extractions_updated_at();

-- Commentaires
COMMENT ON TABLE contract_extractions IS 'Historique complet des extractions IA de contrats avec données enrichies';
COMMENT ON COLUMN contract_extractions.extracted_data IS 'JSON complet avec toutes les données extraites (40+ champs)';
COMMENT ON COLUMN contract_extractions.confidence_score IS 'Score de confiance de l''extraction (0-100)';
COMMENT ON COLUMN contract_extractions.api_cost_cents IS 'Coût API en centimes (ex: 4 pour 0.04€)';
