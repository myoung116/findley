-- Add admin role to user_role enum
-- Admin has system-level access: edit past bookings, manage all users, override anything
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
