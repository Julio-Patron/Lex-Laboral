-- Funciones atómicas para evitar race conditions en el control de uso
-- Ejecuta este archivo en tu dashboard de Supabase (SQL Editor)

-- =============================================
-- Función para verificar y usar crédito de análisis
-- =============================================
CREATE OR REPLACE FUNCTION use_audit_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_access_until TIMESTAMPTZ;
  v_audits_balance INTEGER;
BEGIN
  -- Obtener datos del usuario
  SELECT is_premium, access_until
  INTO v_is_premium, v_access_until
  FROM users
  WHERE id = p_user_id;

  IF v_is_premium IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Premium tiene acceso ilimitado a análisis
  IF v_is_premium AND (v_access_until IS NULL OR v_access_until >= NOW()) THEN
    RETURN TRUE;
  END IF;

  -- Verificar créditos disponibles
  SELECT audits_balance INTO v_audits_balance
  FROM user_credits
  WHERE user_id = p_user_id;

  IF v_audits_balance > 0 THEN
    -- Decrementar crédito atómicamente
    UPDATE user_credits
    SET audits_balance = audits_balance - 1
    WHERE user_id = p_user_id AND audits_balance > 0
    RETURNING audits_balance INTO v_audits_balance;

    IF v_audits_balance >= 0 THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$;

-- =============================================
-- Función para verificar y usar crédito de documento
-- =============================================
CREATE OR REPLACE FUNCTION use_draft_credit(p_user_id UUID, p_draft_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_access_until TIMESTAMPTZ;
  v_current_month TEXT;
  v_usage RECORD;
  v_credit_field TEXT;
  v_limit INTEGER := 15;
  v_current_count INTEGER;
  v_balance INTEGER;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');

  SELECT is_premium, access_until
  INTO v_is_premium, v_access_until
  FROM users
  WHERE id = p_user_id;

  IF v_is_premium IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  IF v_is_premium AND (v_access_until IS NULL OR v_access_until >= NOW()) THEN
    v_credit_field := CASE p_draft_type WHEN 'draft_basic' THEN 'draft_basic_month_count' ELSE 'draft_custom_month_count' END;

    SELECT INTO v_usage * FROM user_usage
    WHERE user_id = p_user_id AND month = v_current_month;

    EXECUTE format('SELECT $1.%I', v_credit_field) INTO v_current_count USING COALESCE(v_usage, ROW(NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)) ;
    v_current_count := COALESCE(
      CASE 
        WHEN p_draft_type = 'draft_basic' THEN v_usage.draft_basic_month_count
        ELSE v_usage.draft_custom_month_count
      END, 0
    );

    IF v_current_count >= v_limit THEN
      RETURN FALSE;
    END IF;

    INSERT INTO user_usage (user_id, month, draft_basic_month_count, draft_custom_month_count)
    VALUES (
      p_user_id,
      v_current_month,
      CASE WHEN p_draft_type = 'draft_basic' THEN 1 ELSE 0 END,
      CASE WHEN p_draft_type = 'draft_custom' THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, month) DO UPDATE SET
      draft_basic_month_count = draft_basic_month_count + CASE WHEN p_draft_type = 'draft_basic' THEN 1 ELSE 0 END,
      draft_custom_month_count = draft_custom_month_count + CASE WHEN p_draft_type = 'draft_custom' THEN 1 ELSE 0 END;

    RETURN TRUE;
  END IF;

  v_credit_field := CASE p_draft_type WHEN 'draft_basic' THEN 'draft_basic_balance' ELSE 'draft_custom_balance' END;

  EXECUTE format('SELECT %I FROM user_credits WHERE user_id = $1', v_credit_field)
  INTO v_balance
  USING p_user_id;

  IF COALESCE(v_balance, 0) > 0 THEN
    EXECUTE format('UPDATE user_credits SET %I = %I - 1 WHERE user_id = $1 AND %I > 0', v_credit_field, v_credit_field, v_credit_field)
    USING p_user_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- =============================================
-- Función para verificar y usar crédito de chat
-- =============================================
CREATE OR REPLACE FUNCTION use_chat_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_access_until TIMESTAMPTZ;
  v_today DATE := CURRENT_DATE;
  v_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  SELECT is_premium, access_until
  INTO v_is_premium, v_access_until
  FROM users
  WHERE id = p_user_id;

  IF v_is_premium IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  v_limit := CASE WHEN v_is_premium AND (v_access_until IS NULL OR v_access_until >= NOW()) THEN 100 ELSE 5 END;

  SELECT chats_count INTO v_current_count
  FROM user_usage
  WHERE user_id = p_user_id AND date = v_today;

  v_current_count := COALESCE(v_current_count, 0);

  IF v_current_count >= v_limit THEN
    RETURN FALSE;
  END IF;

  INSERT INTO user_usage (user_id, date, chats_count)
  VALUES (p_user_id, v_today, 1)
  ON CONFLICT (user_id, date) DO UPDATE SET
    chats_count = user_usage.chats_count + 1;

  RETURN TRUE;
END;
$$;

-- =============================================
-- Verificar que las funciones existen
-- =============================================
-- SELECT proname FROM pg_proc WHERE proname IN ('use_audit_credit', 'use_draft_credit', 'use_chat_credit');
