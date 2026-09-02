-- Fix notification path for verification review.
-- verification_requests stores the moderator note in review_reason.

CREATE OR REPLACE FUNCTION review_verification_request(
  p_request_id UUID,
  p_approved BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS verification_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_row verification_requests;
  reviewer UUID := auth.uid();
BEGIN
  IF reviewer IS NULL OR auth_user_role() <> 'admin'::user_role THEN
    RAISE EXCEPTION 'Only administrators can review verification requests';
  END IF;

  SELECT vr.* INTO request_row
  FROM verification_requests vr
  JOIN profiles applicant ON applicant.id = vr.user_id
  WHERE vr.id = p_request_id
    AND applicant.complex_id = auth_user_complex_id()
  FOR UPDATE;

  IF request_row.id IS NULL OR request_row.status <> 'pending'::verification_request_status THEN
    RAISE EXCEPTION 'Verification request is not pending or not accessible';
  END IF;

  UPDATE verification_requests
  SET status = CASE WHEN p_approved THEN 'approved'::verification_request_status ELSE 'rejected'::verification_request_status END,
      reviewed_by = reviewer,
      review_reason = CASE WHEN p_approved THEN NULL ELSE NULLIF(p_reason, '') END
  WHERE id = request_row.id
  RETURNING * INTO request_row;

  IF p_approved THEN
    UPDATE profiles
    SET verified = TRUE, verified_at = NOW(), verified_by = reviewer
    WHERE id = request_row.user_id;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    request_row.user_id,
    'verification',
    CASE WHEN p_approved THEN 'Статус подтверждён' ELSE 'Заявка отклонена' END,
    CASE WHEN p_approved THEN 'Теперь вам доступны функции подтверждённого жителя.'
         ELSE COALESCE(p_reason, 'Проверьте данные и отправьте заявку повторно.') END,
    jsonb_build_object('request_id', request_row.id, 'status', request_row.status)
  );

  RETURN request_row;
END;
$$;

REVOKE ALL ON FUNCTION review_verification_request(UUID, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION review_verification_request(UUID, BOOLEAN, TEXT) TO authenticated;
