-- Korshi: automatic in-app notifications.
-- Notification rows are created server-side so clients cannot forge events.

CREATE OR REPLACE FUNCTION notify_post_author_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author UUID;
  author_name TEXT;
BEGIN
  SELECT p.author_id INTO post_author FROM posts p WHERE p.id = NEW.post_id;
  IF post_author IS NULL OR post_author = NEW.author_id THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO author_name FROM profiles WHERE id = NEW.author_id;
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    post_author,
    'comment',
    'Новый комментарий',
    COALESCE(author_name, 'Житель ЖК') || ' прокомментировал вашу публикацию',
    jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_post_author_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author UUID;
  author_name TEXT;
BEGIN
  SELECT p.author_id INTO post_author FROM posts p WHERE p.id = NEW.post_id;
  IF post_author IS NULL OR post_author = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO author_name FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    post_author,
    'reaction',
    'Новая реакция',
    COALESCE(author_name, 'Житель ЖК') || ' отреагировал на вашу публикацию',
    jsonb_build_object('post_id', NEW.post_id, 'reaction_id', NEW.id, 'reaction_type', NEW.type)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_chat_members_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
  chat_name TEXT;
BEGIN
  SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  SELECT COALESCE(name, 'Чат ЖК') INTO chat_name FROM chats WHERE id = NEW.chat_id;

  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT cm.user_id,
         'message',
         'Новое сообщение',
         COALESCE(sender_name, 'Житель ЖК') || ' написал в «' || chat_name || '»',
         jsonb_build_object('chat_id', NEW.chat_id, 'message_id', NEW.id)
  FROM chat_members cm
  WHERE cm.chat_id = NEW.chat_id
    AND cm.user_id <> NEW.sender_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_post_author_after_comment ON comments;
CREATE TRIGGER notify_post_author_after_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_post_author_on_comment();

DROP TRIGGER IF EXISTS notify_post_author_after_reaction ON reactions;
CREATE TRIGGER notify_post_author_after_reaction
  AFTER INSERT ON reactions
  FOR EACH ROW EXECUTE FUNCTION notify_post_author_on_reaction();

DROP TRIGGER IF EXISTS notify_chat_members_after_message ON messages;
CREATE TRIGGER notify_chat_members_after_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_chat_members_on_message();

-- The verification RPC already performs the status/profile update atomically;
-- append the resident notification in the same transaction.
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
  IF auth_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Only administrators can review verification requests';
  END IF;

  SELECT vr.* INTO request_row
  FROM verification_requests vr
  JOIN profiles applicant ON applicant.id = vr.user_id
  WHERE vr.id = p_request_id
    AND applicant.complex_id = auth_user_complex_id()
  FOR UPDATE;

  IF request_row.id IS NULL OR request_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Verification request is not pending or not accessible';
  END IF;

  UPDATE verification_requests
  SET status = CASE WHEN p_approved THEN 'approved'::verification_request_status ELSE 'rejected'::verification_request_status END,
      reviewed_by = reviewer,
      reviewed_at = NOW(),
      rejection_reason = CASE WHEN p_approved THEN NULL ELSE p_reason END
  WHERE id = request_row.id
  RETURNING * INTO request_row;

  IF p_approved THEN
    UPDATE profiles SET verified = TRUE, verified_at = NOW(), verified_by = reviewer
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

REVOKE ALL ON FUNCTION notify_post_author_on_comment() FROM PUBLIC;
REVOKE ALL ON FUNCTION notify_post_author_on_reaction() FROM PUBLIC;
REVOKE ALL ON FUNCTION notify_chat_members_on_message() FROM PUBLIC;
REVOKE ALL ON FUNCTION review_verification_request(UUID, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION review_verification_request(UUID, BOOLEAN, TEXT) TO authenticated;
