-- server/src/migrations/004_create_notifications_table.sql

-- Table pour stocker l'historique des notifications email envoyées
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'email', -- 'email', 'push', 'sms'
    message TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_contract_id ON notifications(contract_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Ajouter les colonnes de notification dans la table users si elles n'existent pas
DO $$ 
BEGIN
    -- Colonne pour activer/désactiver les notifications email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'notification_email'
    ) THEN
        ALTER TABLE users ADD COLUMN notification_email BOOLEAN DEFAULT true;
    END IF;

    -- Colonne pour définir les jours d'alerte avant expiration (array d'entiers)
    -- Par défaut : 30, 14, 7, 3, 1 jour(s) avant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'notification_days'
    ) THEN
        ALTER TABLE users ADD COLUMN notification_days INTEGER[] DEFAULT ARRAY[30, 14, 7, 3, 1];
    END IF;

    -- Colonne pour la dernière mise à jour du profil
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour la documentation
COMMENT ON TABLE notifications IS 'Historique des notifications envoyées aux utilisateurs';
COMMENT ON COLUMN notifications.type IS 'Type de notification: email, push, sms';
COMMENT ON COLUMN notifications.message IS 'Message ou description de la notification';
COMMENT ON COLUMN notifications.read_at IS 'Date de lecture de la notification par l''utilisateur';

COMMENT ON COLUMN users.notification_email IS 'Activer/désactiver les notifications par email';
COMMENT ON COLUMN users.notification_days IS 'Jours avant expiration du préavis pour envoyer des alertes';
COMMENT ON COLUMN users.updated_at IS 'Date de dernière mise à jour du profil utilisateur';
