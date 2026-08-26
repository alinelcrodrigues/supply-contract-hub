CREATE OR REPLACE FUNCTION public.fn_mark_movement_paid(_movement_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE mv public.financial_movements;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'measurements.manage') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT * INTO mv FROM public.financial_movements WHERE id = _movement_id;
  IF mv IS NULL THEN RAISE EXCEPTION 'Movimento não encontrado'; END IF;
  IF mv.status = 'aguardando_documento' THEN
    RAISE EXCEPTION 'Anexe o documento de cobrança antes de marcar como pago'; END IF;
  UPDATE public.financial_movements
    SET status = 'pago', paid_at = now(), paid_by = auth.uid() WHERE id = _movement_id;
END; $function$;