CREATE POLICY "crd_objects_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contract-request-documents');
CREATE POLICY "crd_objects_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contract-request-documents');
CREATE POLICY "crd_objects_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contract-request-documents');

CREATE POLICY "bd_objects_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'billing-documents');
CREATE POLICY "bd_objects_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'billing-documents');
CREATE POLICY "bd_objects_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'billing-documents');