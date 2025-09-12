import type { Pool } from "pg";

/**
 * Migration: add chat_rooms and chat_messages tables (plus trigger + function)
 * Generated from Db/init.sql snippet. Idempotent using IF NOT EXISTS and DROP safeguards in down.
 */
export async function up(pool: Pool): Promise<void> {
	await pool.query(`
  CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio')),
    content TEXT,
    media_filename VARCHAR(255),
    media_file_path VARCHAR(500),
    media_file_size INTEGER,
    media_mime_type VARCHAR(100),
    media_duration INTEGER,
    thumbnail_path VARCHAR(500),
    read_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_message_content CHECK (
      message_type != 'text' OR (message_type = 'text' AND content IS NOT NULL)
    )
  );

  CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(chat_room_id);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(message_type);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

  CREATE OR REPLACE FUNCTION validate_media_mime_type()
  RETURNS TRIGGER AS $$
  BEGIN
      IF NEW.message_type = 'image' AND NEW.media_mime_type NOT LIKE 'image/%' THEN
          RAISE EXCEPTION 'Invalid MIME type for image message';
      ELSIF NEW.message_type = 'video' AND NEW.media_mime_type NOT LIKE 'video/%' THEN
          RAISE EXCEPTION 'Invalid MIME type for video message';
      ELSIF NEW.message_type = 'audio' AND NEW.media_mime_type NOT LIKE 'audio/%' THEN
          RAISE EXCEPTION 'Invalid MIME type for audio message';
      END IF;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'validate_media_trigger'
    ) THEN
      CREATE TRIGGER validate_media_trigger
        BEFORE INSERT OR UPDATE ON chat_messages
        FOR EACH ROW
        EXECUTE FUNCTION validate_media_mime_type();
    END IF;
  END $$;
  `);
}

export async function down(pool: Pool): Promise<void> {
	await pool.query(`
  DROP TRIGGER IF EXISTS validate_media_trigger ON chat_messages;
  DROP FUNCTION IF EXISTS validate_media_mime_type();
  DROP TABLE IF EXISTS chat_messages;
  DROP TABLE IF EXISTS chat_rooms;
  `);
}
