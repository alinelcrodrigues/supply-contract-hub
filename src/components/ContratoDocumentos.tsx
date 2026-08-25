import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { createStoragePath } from "@/lib/storage-path";

export const CONTRACT_DOCS_BUCKET = "contract-documents";

export type ContractDocument = {
  id: string;
  contract_id: string;
  file_name: string;
  file_path: string;
  created_at: string;
};

const db = supabase as unknown as {
  from: (t: string) => any;
};

export async function uploadContractDocuments(contractId: string, files: File[]) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  for (const file of files) {
    const path = createStoragePath(contractId, file.name);
    const { error: upErr } = await supabase.storage
      .from(CONTRACT_DOCS_BUCKET)
      .upload(path, file, { contentType: file.type || "application/pdf" });
    if (upErr) throw upErr;
    const { error } = await db.from("contract_documents").insert({
      contract_id: contractId,
      file_name: file.name,
      file_path: path,
      uploaded_by: uid,
    });
    if (error) throw error;
  }
}

export function useContractDocuments(contractId: string) {
  return useQuery({
    queryKey: ["contract-documents", contractId],
    queryFn: async () => {
      const { data, error } = await db
        .from("contract_documents")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContractDocument[];
    },
  });
}

export default function ContratoDocumentos({ contractId }: { contractId: string }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data: docs = [], isLoading } = useContractDocuments(contractId);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["contract-documents", contractId] });

  const remove = useMutation({
    mutationFn: async (doc: ContractDocument) => {
      await supabase.storage.from(CONTRACT_DOCS_BUCKET).remove([doc.file_path]);
      const { error } = await db.from("contract_documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anexo removido.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onPick = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list).filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (!files.length) return toast.error("Selecione arquivos em formato PDF.");
    setUploading(true);
    try {
      await uploadContractDocuments(contractId, files);
      toast.success(files.length > 1 ? "Anexos enviados." : "Anexo enviado.");
      invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const open = async (doc: ContractDocument) => {
    const { data, error } = await supabase.storage.from(CONTRACT_DOCS_BUCKET).createSignedUrl(doc.file_path, 60);
    if (error || !data) return toast.error("Não foi possível abrir o arquivo.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Documentos do contrato (PDF)</CardTitle>
        <Button size="sm" variant="secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Anexar PDF
        </Button>
      </CardHeader>
      <CardContent>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => void onPick(e.target.files)}
        />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando anexos…</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum documento anexado. Envie o contrato assinado em PDF.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                <button
                  type="button"
                  onClick={() => void open(d)}
                  className="flex min-w-0 items-center gap-2 text-left text-sm hover:underline"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{d.file_name}</span>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove.mutate(d)}
                    aria-label={`Remover ${d.file_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
