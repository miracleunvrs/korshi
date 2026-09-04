-- Korshi: atomically switch the active apartment/complex context.

CREATE OR REPLACE FUNCTION switch_active_membership(p_membership_id UUID)
RETURNS complex_memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE selected_membership complex_memberships;
BEGIN
  SELECT * INTO selected_membership
  FROM complex_memberships
  WHERE id = p_membership_id AND user_id = auth.uid()
  FOR UPDATE;

  IF selected_membership.id IS NULL OR NOT selected_membership.is_verified THEN
    RAISE EXCEPTION 'Verified membership is required';
  END IF;

  UPDATE complex_memberships SET is_active = FALSE, updated_at = NOW()
  WHERE user_id = auth.uid() AND is_active;
  UPDATE complex_memberships SET is_active = TRUE, updated_at = NOW()
  WHERE id = selected_membership.id
  RETURNING * INTO selected_membership;

  -- Keep legacy profile readers in the same active context.
  UPDATE profiles
  SET complex_id = selected_membership.complex_id,
      apartment_id = selected_membership.apartment_id,
      updated_at = NOW()
  WHERE id = auth.uid();

  RETURN selected_membership;
END;
$$;

REVOKE ALL ON FUNCTION switch_active_membership(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION switch_active_membership(UUID) TO authenticated;
