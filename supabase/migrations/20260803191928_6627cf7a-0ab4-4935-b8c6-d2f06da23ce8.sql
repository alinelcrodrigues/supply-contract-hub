-- ============ FAIXAS DE ALÇADA (solicitação de contrato) ============
CREATE TABLE public.approval_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_value numeric NOT NULL DEFAULT 0,
  max_value numeric,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_tiers TO authenticated;
GRANT ALL ON public.approval_tiers TO service_role;
ALTER TABLE public.approval_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY approval_tiers_read ON public.approval_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY approval_tiers_admin_write ON public.approval_tiers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER approval_tiers_set_updated_at BEFORE UPDATE ON public.approval_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.approval_tier_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id uuid NOT NULL REFERENCES public.approval_tiers(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  approver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tier_id, step_order)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_tier_steps TO authenticated;
GRANT ALL ON public.approval_tier_steps TO service_role;
ALTER TABLE public.approval_tier_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY approval_tier_steps_read ON public.approval_tier_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY approval_tier_steps_admin_write ON public.approval_tier_steps FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ SOLICITAÇÃO DE CONTRATO ============
CREATE TABLE public.contract_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'rascunho',
  tier_id uuid REFERENCES public.approval_tiers(id),
  current_step integer NOT NULL DEFAULT 0,
  supplier_cnpj text NOT NULL DEFAULT '',
  supplier_name text NOT NULL DEFAULT '',
  supplier_address text NOT NULL DEFAULT '',
  supplier_representative text NOT NULL DEFAULT '',
  object text NOT NULL DEFAULT '',
  specification text NOT NULL DEFAULT '',
  deadline_days integer NOT NULL DEFAULT 0,
  payment_terms text NOT NULL DEFAULT '',
  obligations_contractor text NOT NULL DEFAULT '',
  obligations_contracted text NOT NULL DEFAULT '',
  financial_category text NOT NULL DEFAULT '',
  total_value numeric NOT NULL DEFAULT 0,
  rejection_reason text,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_requests TO authenticated;
GRANT ALL ON public.contract_requests TO service_role;
ALTER TABLE public.contract_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY contract_requests_read ON public.contract_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY contract_requests_insert ON public.contract_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());
CREATE POLICY contract_requests_update ON public.contract_requests FOR UPDATE TO authenticated
  USING ((requester_id = auth.uid() AND status IN ('rascunho','reprovada')) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK ((requester_id = auth.uid() AND status IN ('rascunho','reprovada')) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY contract_requests_delete ON public.contract_requests FOR DELETE TO authenticated
  USING ((requester_id = auth.uid() AND status IN ('rascunho','reprovada')) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER contract_requests_set_updated_at BEFORE UPDATE ON public.contract_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contract_request_cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.contract_requests(id) ON DELETE CASCADE,
  cost_center_id uuid REFERENCES public.cost_centers(id),
  value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_request_cost_centers TO authenticated;
GRANT ALL ON public.contract_request_cost_centers TO service_role;
ALTER TABLE public.contract_request_cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY crcc_read ON public.contract_request_cost_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY crcc_write ON public.contract_request_cost_centers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contract_requests r WHERE r.id = request_id AND (r.requester_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contract_requests r WHERE r.id = request_id AND (r.requester_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.contract_request_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.contract_requests(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_request_documents TO authenticated;
GRANT ALL ON public.contract_request_documents TO service_role;
ALTER TABLE public.contract_request_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY crd_read ON public.contract_request_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY crd_write ON public.contract_request_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contract_requests r WHERE r.id = request_id AND (r.requester_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contract_requests r WHERE r.id = request_id AND (r.requester_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.contract_request_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.contract_requests(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  approver_id uuid NOT NULL REFERENCES public.profiles(id),
  decision text NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.contract_request_approvals TO authenticated;
GRANT ALL ON public.contract_request_approvals TO service_role;
ALTER TABLE public.contract_request_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY cra_read ON public.contract_request_approvals FOR SELECT TO authenticated USING (true);

-- ============ FUNÇÕES ============
CREATE OR REPLACE FUNCTION public.fn_find_approval_tier(_value numeric)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.approval_tiers
  WHERE active AND _value >= min_value AND (max_value IS NULL OR _value <= max_value)
  ORDER BY min_value DESC LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.fn_submit_contract_request(_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.contract_requests; t uuid; n int;
BEGIN
  SELECT * INTO r FROM public.contract_requests WHERE id = _request_id;
  IF r IS NULL THEN RAISE EXCEPTION 'Solicitação não encontrada'; END IF;
  IF r.requester_id <> auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Sem permissão para enviar esta solicitação'; END IF;
  IF r.status NOT IN ('rascunho','reprovada') THEN RAISE EXCEPTION 'Solicitação já está em aprovação'; END IF;
  t := public.fn_find_approval_tier(r.total_value);
  IF t IS NULL THEN RAISE EXCEPTION 'Nenhuma faixa de alçada configurada para este valor'; END IF;
  SELECT count(*) INTO n FROM public.approval_tier_steps WHERE tier_id = t;
  IF n = 0 THEN RAISE EXCEPTION 'A faixa de alçada não possui aprovadores configurados'; END IF;
  DELETE FROM public.contract_request_approvals WHERE request_id = _request_id;
  UPDATE public.contract_requests
    SET tier_id = t, current_step = 1, status = 'em_aprovacao', rejection_reason = NULL
    WHERE id = _request_id;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_convert_request_to_contract(_request_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.contract_requests; new_id uuid; main_cc uuid; rc record;
BEGIN
  SELECT * INTO r FROM public.contract_requests WHERE id = _request_id;
  IF r.contract_id IS NOT NULL THEN RETURN r.contract_id; END IF;

  SELECT cost_center_id INTO main_cc FROM public.contract_request_cost_centers
    WHERE request_id = _request_id ORDER BY value DESC LIMIT 1;

  INSERT INTO public.contracts (number, supplier, object, global_value, budget_value,
      start_date, end_date, adjustment_index, adjustment_month, signed,
      cost_center_id, financial_category, created_by)
  VALUES ('SOL-' || upper(substr(replace(_request_id::text,'-',''),1,8)),
      COALESCE(NULLIF(r.supplier_name,''),'Fornecedor'), r.object, r.total_value, NULL,
      CURRENT_DATE, CURRENT_DATE + GREATEST(r.deadline_days,1),
      'Nenhum', EXTRACT(MONTH FROM CURRENT_DATE)::int, false,
      main_cc, r.financial_category, r.requester_id)
  RETURNING id INTO new_id;

  FOR rc IN SELECT * FROM public.contract_request_cost_centers WHERE request_id = _request_id LOOP
    INSERT INTO public.contract_items (contract_id, description, value, cost_center_id, financial_category)
    VALUES (new_id, COALESCE(NULLIF(r.object,''),'Objeto do contrato'), rc.value, rc.cost_center_id, r.financial_category);
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM public.contract_items WHERE contract_id = new_id) THEN
    INSERT INTO public.contract_items (contract_id, description, value, cost_center_id, financial_category)
    VALUES (new_id, COALESCE(NULLIF(r.object,''),'Objeto do contrato'), r.total_value, main_cc, r.financial_category);
  END IF;

  UPDATE public.contract_requests SET contract_id = new_id, status = 'aprovada', current_step = 0
    WHERE id = _request_id;
  RETURN new_id;
END; $$;

CREATE OR REPLACE FUNCTION public.fn_decide_contract_request(_request_id uuid, _approve boolean, _comment text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.contract_requests; expected uuid; total int;
BEGIN
  SELECT * INTO r FROM public.contract_requests WHERE id = _request_id;
  IF r IS NULL THEN RAISE EXCEPTION 'Solicitação não encontrada'; END IF;
  IF r.status <> 'em_aprovacao' THEN RAISE EXCEPTION 'Solicitação não está em aprovação'; END IF;
  SELECT approver_id INTO expected FROM public.approval_tier_steps
    WHERE tier_id = r.tier_id AND step_order = r.current_step;
  IF expected IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Não é a sua vez de aprovar'; END IF;

  INSERT INTO public.contract_request_approvals (request_id, step_order, approver_id, decision, comment)
  VALUES (_request_id, r.current_step, auth.uid(), CASE WHEN _approve THEN 'aprovado' ELSE 'reprovado' END, _comment);

  IF NOT _approve THEN
    UPDATE public.contract_requests SET status = 'reprovada', current_step = 0, rejection_reason = _comment
      WHERE id = _request_id;
    RETURN;
  END IF;

  SELECT count(*) INTO total FROM public.approval_tier_steps WHERE tier_id = r.tier_id;
  IF r.current_step >= total THEN
    PERFORM public.fn_convert_request_to_contract(_request_id);
  ELSE
    UPDATE public.contract_requests SET current_step = r.current_step + 1 WHERE id = _request_id;
  END IF;
END; $$;

GRANT EXECUTE ON FUNCTION public.fn_find_approval_tier(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_contract_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_decide_contract_request(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_convert_request_to_contract(uuid) TO authenticated;