-- Rename the 'viewer' role to 'cousin'
ALTER TYPE user_role RENAME VALUE 'viewer' TO 'cousin';

-- Drop the old viewer-only SELECT policy and replace with cousin policy
-- (cousins can now see their own pending bookings too, since they can submit)
DROP POLICY "Viewers see confirmed bookings only" ON public.bookings;

CREATE POLICY "Cousins see confirmed and own bookings"
  ON public.bookings FOR SELECT
  USING (
    public.current_user_role() = 'cousin'
    AND (status = 'confirmed' OR user_id = auth.uid())
  );

-- Cousins can now insert their own bookings
CREATE POLICY "Cousins can insert bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (public.current_user_role() = 'cousin' AND user_id = auth.uid());

-- Cousins can update their own bookings
CREATE POLICY "Cousins can update own bookings"
  ON public.bookings FOR UPDATE
  USING (public.current_user_role() = 'cousin' AND user_id = auth.uid());
