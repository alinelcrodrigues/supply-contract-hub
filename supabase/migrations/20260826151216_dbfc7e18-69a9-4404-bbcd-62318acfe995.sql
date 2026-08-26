CREATE OR REPLACE VIEW public.v_contract_cost_center_allocation AS
WITH base AS (
  SELECT s.contract_id, s.cost_center_id, sum(s.value) AS base_value
  FROM public.v_contract_cost_center_sources s
  GROUP BY s.contract_id, s.cost_center_id
), totals AS (
  SELECT b.contract_id, sum(b.base_value) AS total_base
  FROM base b GROUP BY b.contract_id
), adjustments AS (
  SELECT a.contract_id, COALESCE(sum(a.value), 0::numeric) AS adjustment_total
  FROM public.contract_addendums a
  WHERE a.tipo = 'ajuste_valor'
  GROUP BY a.contract_id
), realized AS (
  SELECT cm.contract_id, COALESCE(sum(cm.total_value), 0::numeric) AS realized_total
  FROM public.contract_measurements cm
  WHERE cm.status = 'aprovada'
  GROUP BY cm.contract_id
)
SELECT b.contract_id,
  c.number AS contract_number,
  c.supplier AS contract_supplier,
  b.cost_center_id,
  cc.name AS cost_center_name,
  b.base_value,
  CASE WHEN t.total_base > 0 THEN b.base_value / t.total_base ELSE 0::numeric END AS share,
  round(CASE WHEN t.total_base > 0 THEN (b.base_value / t.total_base) * COALESCE(adj.adjustment_total, 0::numeric) ELSE 0::numeric END, 2) AS adjustment_value,
  round(b.base_value + CASE WHEN t.total_base > 0 THEN (b.base_value / t.total_base) * COALESCE(adj.adjustment_total, 0::numeric) ELSE 0::numeric END, 2) AS contracted_value,
  round(CASE WHEN t.total_base > 0 THEN (b.base_value / t.total_base) * COALESCE(r.realized_total, 0::numeric) ELSE 0::numeric END, 2) AS realized_value
FROM base b
JOIN totals t ON t.contract_id = b.contract_id
JOIN public.contracts c ON c.id = b.contract_id
LEFT JOIN public.cost_centers cc ON cc.id = b.cost_center_id
LEFT JOIN adjustments adj ON adj.contract_id = b.contract_id
LEFT JOIN realized r ON r.contract_id = b.contract_id;