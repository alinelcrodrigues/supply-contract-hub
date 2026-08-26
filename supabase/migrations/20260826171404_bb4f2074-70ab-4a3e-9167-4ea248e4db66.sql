
-- ================= HISTORICO UNIVERSAL =================
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  changed_by uuid,
  changed_fields text[] NOT NULL DEFAULT '{}',
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_table_record_idx ON public.audit_log (table_name, record_id, created_at DESC);
CREATE INDEX audit_log_created_idx ON public.audit_log (created_at DESC);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select" ON public.audit_log FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE old_j jsonb; new_j jsonb; fields text[] := '{}'; k text; rec_id uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN old_j := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN new_j := to_jsonb(NEW); END IF;
  IF TG_OP = 'UPDATE' THEN
    FOR k IN SELECT jsonb_object_keys(new_j) LOOP
      IF new_j -> k IS DISTINCT FROM old_j -> k AND k <> 'updated_at' THEN
        fields := fields || k;
      END IF;
    END LOOP;
    IF array_length(fields,1) IS NULL THEN RETURN NEW; END IF;
  END IF;
  BEGIN
    rec_id := COALESCE(new_j ->> 'id', old_j ->> 'id')::uuid;
  EXCEPTION WHEN others THEN rec_id := NULL; END;
  INSERT INTO public.audit_log (table_name, record_id, action, changed_by, changed_fields, old_data, new_data)
  VALUES (TG_TABLE_NAME, rec_id, TG_OP, auth.uid(), fields, old_j, new_j);
  RETURN COALESCE(NEW, OLD);
END; $$;

DO $do$
DECLARE t text;
  tables text[] := ARRAY[
    'contracts','contract_items','contract_addendums','contract_addendum_items','contract_documents',
    'contract_requests','contract_request_cost_centers','contract_request_documents','contract_request_approvals',
    'contract_measurements','contract_measurement_cost_centers','contract_measurement_approvals',
    'financial_movements','billing_documents','cost_centers','financial_categories','suppliers',
    'products_services','approval_tiers','approval_tier_steps','measurement_approval_tiers',
    'measurement_approval_tier_steps','role_permissions','user_roles','profiles','measurements',
    'carreteiro_plates','carreteiro_contracts','carreteiro_plate_links','carreteiro_loads',
    'carreteiro_fuel','carreteiro_closings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$s ON public.%1$I', t);
      EXECUTE format('CREATE TRIGGER audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger()', t);
    END IF;
  END LOOP;
END $do$;

-- ================= CANCELAMENTO =================
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid;
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_status_check CHECK (status IN ('ativo','cancelado'));

ALTER TABLE public.contract_requests
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid;
ALTER TABLE public.contract_requests DROP CONSTRAINT IF EXISTS contract_requests_status_check;
ALTER TABLE public.contract_requests ADD CONSTRAINT contract_requests_status_check
  CHECK (status IN ('rascunho','em_aprovacao','aprovada','reprovada','cancelado'));

ALTER TABLE public.contract_measurements
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid;
ALTER TABLE public.contract_measurements DROP CONSTRAINT IF EXISTS contract_measurements_status_check;
ALTER TABLE public.contract_measurements ADD CONSTRAINT contract_measurements_status_check
  CHECK (status IN ('rascunho','em_aprovacao','aprovada','reprovada','cancelado'));

CREATE OR REPLACE FUNCTION public.fn_cancel_contract(_contract_id uuid, _user_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c public.contracts;
BEGIN
  IF NOT public.has_permission(auth.uid(),'contracts.manage') THEN
    RAISE EXCEPTION 'Sem permissão para cancelar contratos'; END IF;
  IF COALESCE(btrim(_reason),'') = '' THEN RAISE EXCEPTION 'Informe o motivo do cancelamento'; END IF;
  SELECT * INTO c FROM public.contracts WHERE id = _contract_id;
  IF c IS NULL THEN RAISE EXCEPTION 'Contrato não encontrado'; END IF;
  IF c.status = 'cancelado' THEN RAISE EXCEPTION 'Contrato já está cancelado'; END IF;
  IF EXISTS (SELECT 1 FROM public.contract_measurements m
             WHERE m.contract_id = _contract_id AND m.status = 'aprovada') THEN
    RAISE EXCEPTION 'Não é possível cancelar: existem medições aprovadas neste contrato'; END IF;
  IF EXISTS (SELECT 1 FROM public.financial_movements f
             WHERE f.contract_id = _contract_id AND f.status = 'pago') THEN
    RAISE EXCEPTION 'Não é possível cancelar: existem pagamentos realizados neste contrato'; END IF;
  UPDATE public.contracts
    SET status = 'cancelado', cancellation_reason = _reason, cancelled_at = now(),
        cancelled_by = COALESCE(_user_id, auth.uid())
    WHERE id = _contract_id;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_cancel_contract_request(_request_id uuid, _user_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.contract_requests;
BEGIN
  IF COALESCE(btrim(_reason),'') = '' THEN RAISE EXCEPTION 'Informe o motivo do cancelamento'; END IF;
  SELECT * INTO r FROM public.contract_requests WHERE id = _request_id;
  IF r IS NULL THEN RAISE EXCEPTION 'Solicitação não encontrada'; END IF;
  IF r.requester_id <> auth.uid()
     AND NOT public.has_role(auth.uid(),'admin')
     AND NOT public.has_role(auth.uid(),'gestor') THEN
    RAISE EXCEPTION 'Sem permissão para cancelar esta solicitação'; END IF;
  IF r.status NOT IN ('rascunho','em_aprovacao','reprovada') THEN
    RAISE EXCEPTION 'Solicitação não pode mais ser cancelada'; END IF;
  UPDATE public.contract_requests
    SET status = 'cancelado', current_step = 0, cancellation_reason = _reason,
        cancelled_at = now(), cancelled_by = COALESCE(_user_id, auth.uid())
    WHERE id = _request_id;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_cancel_measurement(_measurement_id uuid, _user_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE m public.contract_measurements;
BEGIN
  IF COALESCE(btrim(_reason),'') = '' THEN RAISE EXCEPTION 'Informe o motivo do cancelamento'; END IF;
  SELECT * INTO m FROM public.contract_measurements WHERE id = _measurement_id;
  IF m IS NULL THEN RAISE EXCEPTION 'Medição não encontrada'; END IF;
  IF m.created_by <> auth.uid()
     AND NOT public.has_role(auth.uid(),'admin')
     AND NOT public.has_role(auth.uid(),'gestor') THEN
    RAISE EXCEPTION 'Sem permissão para cancelar esta medição'; END IF;
  IF m.status NOT IN ('rascunho','em_aprovacao','reprovada') THEN
    RAISE EXCEPTION 'Medição não pode mais ser cancelada'; END IF;
  UPDATE public.contract_measurements
    SET status = 'cancelado', current_step = 0, cancellation_reason = _reason,
        cancelled_at = now(), cancelled_by = COALESCE(_user_id, auth.uid())
    WHERE id = _measurement_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.fn_audit_trigger() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_cancel_contract(uuid,uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_cancel_contract_request(uuid,uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_cancel_measurement(uuid,uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_generate_carreteiro_closing(uuid,date,date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_ensure_carreteiro_shadow_contract(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_carreteiro_load_total() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_carreteiro_fuel_total() FROM anon, authenticated;
