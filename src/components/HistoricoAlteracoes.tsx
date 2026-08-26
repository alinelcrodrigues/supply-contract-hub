import { useMemo, useState } from "react";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTION_LABEL, AUDIT_AREAS, TABLE_LABEL, useAuditLog, type AuditEntry } from "@/lib/audit-hooks";
import { useUsers } from "@/lib/params-hooks";

function fmt(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function HistoricoAlteracoes({
  recordId,
  tables,
  compact,
  title = "Histórico de alterações",
}: {
  recordId?: string;
  tables?: string[];
  compact?: boolean;
  title?: string;
}) {
  const [area, setArea] = useState<string>("todas");
  const [idFilter, setIdFilter] = useState("");

  const effectiveTables = tables;
  const { data: entries = [], isLoading } = useAuditLog({
    area: effectiveTables ? undefined : area === "todas" ? undefined : area,
    tables: effectiveTables,
    recordId: recordId ?? (idFilter.trim() || undefined),
    limit: compact ? 50 : 300,
  });
  const { data: users = [] } = useUsers();
  const nameOf = useMemo(() => {
    const map = new Map(users.map((u: any) => [u.id, u.name]));
    return (id: string | null) => (id ? (map.get(id) as string) ?? "Usuário removido" : "Sistema");
  }, [users]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="outline">{entries.length}</Badge>
        </div>
        {!compact && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Área</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as áreas</SelectItem>
                  {AUDIT_AREAS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>ID do registro</Label>
              <Input placeholder="Cole aqui o ID do contrato, solicitação ou medição" value={idFilter} onChange={(e) => setIdFilter(e.target.value)} />
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando histórico...</p>
        ) : entries.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma alteração registrada.
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => (
              <Entry key={e.id} e={e} who={nameOf(e.changed_by)} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Entry({ e, who }: { e: AuditEntry; who: string }) {
  const fields = e.action === "UPDATE" ? e.changed_fields ?? [] : [];
  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant={e.action === "DELETE" ? "destructive" : e.action === "INSERT" ? "default" : "secondary"}>
          {ACTION_LABEL[e.action] ?? e.action}
        </Badge>
        <span className="font-medium">{TABLE_LABEL[e.table_name] ?? e.table_name}</span>
        <span className="text-muted-foreground">por {who}</span>
        <span className="text-xs text-muted-foreground">
          {new Date(e.created_at).toLocaleString("pt-BR")}
        </span>
      </div>
      {fields.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 text-left">Campo</th>
                <th className="py-1 text-left">Antes</th>
                <th className="py-1 text-left">Depois</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f} className="border-t border-border/60">
                  <td className="py-1 pr-3 font-mono">{f}</td>
                  <td className="py-1 pr-3 text-muted-foreground">{fmt(e.old_data?.[f])}</td>
                  <td className="py-1 font-medium">{fmt(e.new_data?.[f])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {e.record_id && <div className="mt-2 font-mono text-[10px] text-muted-foreground">ID {e.record_id}</div>}
    </li>
  );
}

export default HistoricoAlteracoes;
