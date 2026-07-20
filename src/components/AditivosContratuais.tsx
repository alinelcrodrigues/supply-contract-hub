import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL, formatDate } from "@/lib/contracts-store";
import { toast } from "sonner";

type TipoAditivo = "Ajuste de valor/prazo" | "Inclusão de item";

type Aditivo = {
  id: string;
  tipo: TipoAditivo;
  descricao: string;
  valor: number;
  data: string;
};

interface Props {
  contractId: string;
  valorOriginal: number;
}

export function AditivosContratuais({ contractId: _contractId, valorOriginal }: Props) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [aditivos, setAditivos] = useState<Aditivo[]>([]);
  const [form, setForm] = useState<{
    tipo: TipoAditivo;
    descricao: string;
    valor: string;
    data: string;
  }>({
    tipo: "Ajuste de valor/prazo",
    descricao: "",
    valor: "",
    data: todayIso,
  });

  const somaAditivos = useMemo(
    () => aditivos.reduce((acc, a) => acc + a.valor, 0),
    [aditivos],
  );
  const valorAtual = valorOriginal + somaAditivos;

  const adicionar = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = Number(form.valor);
    if (!form.descricao.trim()) {
      toast.error("Informe a descrição do aditivo.");
      return;
    }
    if (Number.isNaN(valor)) {
      toast.error("Informe um valor numérico (use negativo para reduções).");
      return;
    }
    setAditivos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        tipo: form.tipo,
        descricao: form.descricao.trim(),
        valor,
        data: form.data || todayIso,
      },
    ]);
    setForm({ tipo: form.tipo, descricao: "", valor: "", data: todayIso });
  };

  const remover = (id: string) => {
    setAditivos((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aditivos contratuais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={adicionar} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Tipo de aditivo
            </Label>
            <Select
              value={form.tipo}
              onValueChange={(v) => setForm({ ...form, tipo: v as TipoAditivo })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ajuste de valor/prazo">Ajuste de valor/prazo</SelectItem>
                <SelectItem value="Inclusão de item">Inclusão de item</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Descrição
            </Label>
            <Input
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Ex.: Prorrogação de 30 dias"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Valor (R$)
            </Label>
            <Input
              type="number"
              step="0.01"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Data
            </Label>
            <Input
              type="date"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="submit" variant="secondary" className="font-semibold">
              Adicionar aditivo
            </Button>
          </div>
        </form>

        {aditivos.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum aditivo adicionado nesta sessão.
          </div>
        ) : (
          <ul className="space-y-2">
            {aditivos.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{a.tipo}</Badge>
                  <span className="text-sm font-medium">{a.descricao}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(a.data)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-semibold ${a.valor < 0 ? "text-destructive" : "text-primary"}`}
                  >
                    {a.valor >= 0 ? "+" : "−"}
                    {formatBRL(Math.abs(a.valor))}
                  </span>
                  <button
                    onClick={() => remover(a.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remover aditivo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-3 rounded-md border border-border bg-muted/40 p-4 sm:grid-cols-3">
          <SummaryItem label="Valor original" value={formatBRL(valorOriginal)} />
          <SummaryItem
            label="Soma dos aditivos"
            value={`${somaAditivos >= 0 ? "+" : "−"}${formatBRL(Math.abs(somaAditivos))}`}
          />
          <SummaryItem label="Valor atual estimado" value={formatBRL(valorAtual)} highlight />
        </div>
        <p className="text-xs text-muted-foreground">
          Os aditivos aqui listados são apenas simulações desta sessão e não alteram o valor global
          persistido do contrato.
        </p>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-sm font-semibold ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}