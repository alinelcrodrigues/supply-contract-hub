-- 019: views de apoio para filtros de pesquisa

CREATE OR REPLACE VIEW public.v_contracts_search AS
WITH creator AS (
  SELECT DISTINCT ON (a.record_id) a.record_id, a.changed_by
  FROM public.audit_log a
  WHERE a.table_name = 'contracts' AND a.action = 'INSERT'
  ORDER BY a.record_id, a.created_at ASC
)
SELECT c.id,
       c.number,
       c.supplier,
       c.object,
       c.status,
       c.global_value,
       c.start_date,
       c.end_date,
       c.created_at,
       COALESCE(c.created_by, cr.changed_by) AS created_by,
       p.name AS created_by_name
FROM public.contracts c
LEFT JOIN creator cr ON cr.record_id = c.id
LEFT JOIN public.profiles p ON p.id = COALESCE(c.created_by, cr.changed_by);

CREATE OR REPLACE VIEW public.v_contract_requests_search AS
SELECT r.id,
       r.status,
       r.object,
       r.supplier_name,
       r.total_value,
       r.created_at,
       r.requester_id AS created_by,
       p.name AS created_by_name
FROM public.contract_requests r
LEFT JOIN public.profiles p ON p.id = r.requester_id;

CREATE OR REPLACE VIEW public.v_contract_measurements_search AS
SELECT m.id,
       m.contract_id,
       m.status,
       m.total_value,
       m.reference_month,
       m.created_at,
       m.created_by,
       p.name AS created_by_name
FROM public.contract_measurements m
LEFT JOIN public.profiles p ON p.id = m.created_by;

CREATE OR REPLACE VIEW public.v_contract_addendums_search AS
WITH creator AS (
  SELECT DISTINCT ON (a.record_id) a.record_id, a.changed_by
  FROM public.audit_log a
  WHERE a.table_name = 'contract_addendums' AND a.action = 'INSERT'
  ORDER BY a.record_id, a.created_at ASC
)
SELECT ad.id,
       ad.contract_id,
       ad.tipo,
       ad.description,
       ad.value,
       ad.date,
       ad.created_at,
       cr.changed_by AS created_by,
       p.name AS created_by_name
FROM public.contract_addendums ad
LEFT JOIN creator cr ON cr.record_id = ad.id
LEFT JOIN public.profiles p ON p.id = cr.changed_by;

CREATE OR REPLACE VIEW public.v_carreteiro_loads_search AS
SELECT l.id,
       l.contract_id,
       l.plate_id,
       l.load_date,
       l.origin,
       l.destination,
       l.total_value,
       l.cost_center_id,
       l.created_at,
       l.created_by,
       p.name AS created_by_name
FROM public.carreteiro_loads l
LEFT JOIN public.profiles p ON p.id = l.created_by;

ALTER VIEW public.v_contracts_search SET (security_invoker = true);
ALTER VIEW public.v_contract_requests_search SET (security_invoker = true);
ALTER VIEW public.v_contract_measurements_search SET (security_invoker = true);
ALTER VIEW public.v_contract_addendums_search SET (security_invoker = true);
ALTER VIEW public.v_carreteiro_loads_search SET (security_invoker = true);

GRANT SELECT ON public.v_contracts_search TO authenticated;
GRANT SELECT ON public.v_contract_requests_search TO authenticated;
GRANT SELECT ON public.v_contract_measurements_search TO authenticated;
GRANT SELECT ON public.v_contract_addendums_search TO authenticated;
GRANT SELECT ON public.v_carreteiro_loads_search TO authenticated;