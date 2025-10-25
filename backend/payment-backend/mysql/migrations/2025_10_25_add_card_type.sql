-- Migration: add card_type to financial_records
ALTER TABLE financial_records
  ADD COLUMN card_type ENUM('full','half','free') DEFAULT 'full',
  ADD INDEX idx_card_type (card_type);

-- Backfill: set card_type based on amount and notes (best-effort heuristic)
UPDATE financial_records
SET card_type = CASE
  WHEN amount = 0 THEN 'free'
  WHEN notes IS NOT NULL AND LOWER(notes) LIKE '%half%' THEN 'half'
  ELSE 'full'
END
WHERE card_type IS NULL OR card_type = '';
