CREATE TABLE public.contract_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_documents TO authenticated;
GRANT ALL ON public.contract_documents TO service_role;

ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem anexos de contrato"
  ON public.contract_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestores inserem anexos de contrato"
  ON public.contract_documents FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_contracts(auth.uid()));

CREATE POLICY "Gestores removem anexos de contrato"
  ON public.contract_documents FOR DELETE TO authenticated
  USING (public.can_manage_contracts(auth.uid()));

CREATE INDEX idx_contract_documents_contract ON public.contract_documents(contract_id);

CREATE POLICY "Autenticados leem arquivos de contrato"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contract-documents');

CREATE POLICY "Gestores enviam arquivos de contrato"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contract-documents' AND public.can_manage_contracts(auth.uid()));

CREATE POLICY "Gestores removem arquivos de contrato"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contract-documents' AND public.can_manage_contracts(auth.uid()));