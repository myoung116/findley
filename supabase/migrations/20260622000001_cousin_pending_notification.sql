-- Add a notification type for when a cousin's booking is waiting on their
-- branch principal's approval. Kept in its own migration because Postgres
-- forbids using a freshly-added enum value in the same transaction that adds it.
alter type notification_type add value if not exists 'cousin_pending_approval';
