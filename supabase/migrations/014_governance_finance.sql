-- Korshi: official owner voting and transparent HOA finance ledger.

ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS area_sqm NUMERIC(8,2) CHECK (area_sqm IS NULL OR area_sqm > 0);

CREATE TYPE official_vote_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE official_vote_choice AS ENUM ('yes', 'no', 'abstain');
CREATE TYPE official_vote_basis AS ENUM ('owner', 'area');

CREATE TABLE official_votes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id         UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  created_by         UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title              TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  description        TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 4000),
  basis              official_vote_basis NOT NULL DEFAULT 'owner',
  quorum_percent     NUMERIC(5,2) NOT NULL DEFAULT 51 CHECK (quorum_percent > 0 AND quorum_percent <= 100),
  eligible_units     INTEGER NOT NULL DEFAULT 1 CHECK (eligible_units > 0),
  eligible_weight    NUMERIC(14,4) NOT NULL DEFAULT 1 CHECK (eligible_weight > 0),
  status             official_vote_status NOT NULL DEFAULT 'draft',
  starts_at          TIMESTAMPTZ NOT NULL,
  ends_at            TIMESTAMPTZ NOT NULL CHECK (ends_at > starts_at),
  protocol_path      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE official_vote_ballots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id       UUID NOT NULL REFERENCES official_votes(id) ON DELETE CASCADE,
  voter_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  apartment_id  UUID NOT NULL REFERENCES apartments(id) ON DELETE RESTRICT,
  choice        official_vote_choice NOT NULL,
  weight        NUMERIC(10,4) NOT NULL CHECK (weight > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vote_id, apartment_id)
);

CREATE INDEX idx_official_votes_complex_status ON official_votes(complex_id, status, ends_at);
CREATE INDEX idx_official_vote_ballots_vote ON official_vote_ballots(vote_id, choice);

CREATE TRIGGER set_official_votes_updated_at
  BEFORE UPDATE ON official_votes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE official_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_vote_ballots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "official_votes_select_same_complex" ON official_votes
  FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "official_votes_insert_management" ON official_votes
  FOR INSERT WITH CHECK (complex_id = auth_user_complex_id() AND created_by = auth.uid() AND auth_user_role() IN ('hoa_official', 'admin'));
CREATE POLICY "official_votes_update_management" ON official_votes
  FOR UPDATE USING (complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin'))
  WITH CHECK (complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin'));
CREATE POLICY "official_vote_ballots_select_own_or_management" ON official_vote_ballots
  FOR SELECT USING (
    voter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM official_votes vote
      WHERE vote.id = vote_id
        AND vote.complex_id = auth_user_complex_id()
        AND auth_user_role() IN ('hoa_official', 'admin')
    )
  );

CREATE OR REPLACE FUNCTION cast_official_vote(p_vote_id UUID, p_choice official_vote_choice)
RETURNS official_vote_ballots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vote_row official_votes;
  profile_row profiles;
  apartment_area NUMERIC(8,2);
  ballot official_vote_ballots;
BEGIN
  SELECT * INTO profile_row FROM profiles WHERE id = auth.uid();
  IF profile_row.id IS NULL OR NOT profile_row.verified OR profile_row.apartment_id IS NULL THEN
    RAISE EXCEPTION 'Verified resident apartment is required';
  END IF;
  SELECT * INTO vote_row FROM official_votes WHERE id = p_vote_id FOR UPDATE;
  IF vote_row.id IS NULL OR vote_row.complex_id <> profile_row.complex_id OR vote_row.status <> 'active' OR NOW() NOT BETWEEN vote_row.starts_at AND vote_row.ends_at THEN
    RAISE EXCEPTION 'Vote is not active or accessible';
  END IF;
  SELECT area_sqm INTO apartment_area FROM apartments WHERE id = profile_row.apartment_id;

  INSERT INTO official_vote_ballots (vote_id, voter_id, apartment_id, choice, weight)
  VALUES (vote_row.id, profile_row.id, profile_row.apartment_id, p_choice,
    CASE WHEN vote_row.basis = 'area' THEN COALESCE(apartment_area, 1) ELSE 1 END)
  RETURNING * INTO ballot;
  RETURN ballot;
END;
$$;

CREATE OR REPLACE FUNCTION get_official_vote_results(p_vote_id UUID)
RETURNS TABLE(choice official_vote_choice, ballot_count BIGINT, total_weight NUMERIC)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ballot.choice, COUNT(*), COALESCE(SUM(ballot.weight), 0)
  FROM official_vote_ballots ballot
  JOIN official_votes vote ON vote.id = ballot.vote_id
  WHERE ballot.vote_id = p_vote_id
    AND vote.complex_id = auth_user_complex_id()
    AND auth_user_verified()
  GROUP BY ballot.choice;
$$;

REVOKE ALL ON FUNCTION cast_official_vote(UUID, official_vote_choice) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_official_vote_results(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cast_official_vote(UUID, official_vote_choice) TO authenticated;
GRANT EXECUTE ON FUNCTION get_official_vote_results(UUID) TO authenticated;

CREATE TABLE finance_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id  UUID NOT NULL UNIQUE REFERENCES complexes(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Основной счёт ОСИ',
  currency    TEXT NOT NULL DEFAULT 'KZT' CHECK (currency = 'KZT'),
  balance     NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE finance_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  created_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  direction      TEXT NOT NULL CHECK (direction IN ('income', 'expense')),
  category       TEXT NOT NULL CHECK (char_length(category) BETWEEN 2 AND 80),
  title          TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  amount         NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  occurred_on    DATE NOT NULL,
  document_id    UUID REFERENCES house_documents(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE finance_budget_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id  UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  year        SMALLINT NOT NULL CHECK (year BETWEEN 2020 AND 2200),
  category    TEXT NOT NULL,
  planned     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (planned >= 0),
  actual      NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (actual >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (complex_id, year, category)
);

CREATE INDEX idx_finance_transactions_account_date ON finance_transactions(account_id, occurred_on DESC);
CREATE INDEX idx_finance_budget_complex_year ON finance_budget_items(complex_id, year);

ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finance_accounts_select_same_complex" ON finance_accounts FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "finance_accounts_manage" ON finance_accounts FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin')) WITH CHECK (complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin'));
CREATE POLICY "finance_transactions_select_same_complex" ON finance_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM finance_accounts account WHERE account.id = account_id AND account.complex_id = auth_user_complex_id() AND auth_user_verified()));
CREATE POLICY "finance_transactions_manage" ON finance_transactions FOR ALL USING (EXISTS (SELECT 1 FROM finance_accounts account WHERE account.id = account_id AND account.complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin'))) WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM finance_accounts account WHERE account.id = account_id AND account.complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin')));
CREATE POLICY "finance_budget_select_same_complex" ON finance_budget_items FOR SELECT USING (complex_id = auth_user_complex_id() AND auth_user_verified());
CREATE POLICY "finance_budget_manage" ON finance_budget_items FOR ALL USING (complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin')) WITH CHECK (complex_id = auth_user_complex_id() AND auth_user_role() IN ('hoa_official', 'admin'));

CREATE OR REPLACE FUNCTION record_finance_transaction(
  p_direction TEXT,
  p_category TEXT,
  p_title TEXT,
  p_amount NUMERIC,
  p_occurred_on DATE,
  p_document_id UUID DEFAULT NULL
)
RETURNS finance_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_row finance_accounts;
  transaction_row finance_transactions;
BEGIN
  IF COALESCE(auth_user_role() NOT IN ('hoa_official', 'admin'), TRUE) THEN RAISE EXCEPTION 'Only management can record transactions'; END IF;
  IF p_direction NOT IN ('income', 'expense') OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid transaction'; END IF;
  IF p_document_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM house_documents document
    WHERE document.id = p_document_id
      AND document.complex_id = auth_user_complex_id()
  ) THEN RAISE EXCEPTION 'Finance document is not accessible'; END IF;

  INSERT INTO finance_accounts (complex_id)
  VALUES (auth_user_complex_id())
  ON CONFLICT (complex_id) DO UPDATE SET updated_at = NOW()
  RETURNING * INTO account_row;

  INSERT INTO finance_transactions (account_id, created_by, direction, category, title, amount, occurred_on, document_id)
  VALUES (account_row.id, auth.uid(), p_direction, trim(p_category), trim(p_title), p_amount, p_occurred_on, p_document_id)
  RETURNING * INTO transaction_row;

  UPDATE finance_accounts
  SET balance = balance + CASE WHEN p_direction = 'income' THEN p_amount ELSE -p_amount END,
      updated_at = NOW()
  WHERE id = account_row.id;
  RETURN transaction_row;
END;
$$;

REVOKE ALL ON FUNCTION record_finance_transaction(TEXT, TEXT, TEXT, NUMERIC, DATE, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_finance_transaction(TEXT, TEXT, TEXT, NUMERIC, DATE, UUID) TO authenticated;
