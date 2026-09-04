import { useState } from "react";
import { Link2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CostCenterSelect from "@/components/CostCenterSelect";
import FinancialCategorySelect from "@/components/FinancialCategorySelect";
import { formatBRL, formatDate } from "@/lib/contracts-store";
import {
  PRICING_LABEL,
  useCanManageCarreteiros,
  useCarreteiroContractMutations,
  useCarreteiroContracts,
  usePlateLinkMutations,
  usePlateLinks,
  usePlates,
  type PricingMode,
} from "@/lib/carreteiros-hooks";

const today = () => new Date().toISOString().slice(0, 10);

export default function CadastroContratoCarreteiro() {
  const { data: canManage } = useCanManageCarreteiros();
  const { data: contracts = [], isLoading } = useCarreteiroContracts();
  const { data: plates = [] } = usePlates();
  const { data: links = [] } = usePlateLinks();
  const { add, remove } = useCarreteiroContractMutations();
  const linkMut = usePlateLinkMutations();

  const [form, setForm] = useState({
    number: "",
    carrier_name: "",
    pricing_mode: "km_tonelada" as PricingMode,
    unit_price: "",
    cost_center_id: null as string | null,
    financial_category: "",
    start_date: today(),
    end_date: "",
    notes: "",
  });

  const [link, setLink] = useState({ plate_id: "", contract_id: "", start_date: today(), end_date: "" });

  const submit = () => {
    if (!form.number.trim() || !form.carrier_name.trim()) {
      toast.error("Informe número e transportador.");
      return;
    }
    add.mutate(
      {
        number: form.number,
        carrier_name: form.carrier_name,
        pricing_mode: form.pricing_mode,
        unit_price: Number(form.unit_price || 0),
        cost_center_id: form.cost_center_id,
        financial_category: form.financial_category,
        start_date: form.start_date,
        end_date: form.end_date || null,
        notes: form.notes,
      } as any,
      {
        onSuccess: () => {
          toast.success("Contrato de carreteiro cadastrado.");
          setForm({ ...form, number: "", carrier_name: "", unit_price: "", notes: "" });
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const submitLink = () => {
    if (!link.plate_id || !link.contract_id) {
      toast.error("Selecione a placa e o contrato.");
      return;
    }
    linkMut.add.mutate(
      { plate_id: link.plate_id, contract_id: link.contract_id, start_date: link.start_date, end_date: link.end_date || null },
      {
        onSuccess: () => toast.success("Placa vinculada ao contrato."),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const approvedPlates = plates.filter((p) => p.status === "aprovada");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo contrato de carreteiro</CardTitle>
          <p className="text-xs text-muted-foreground">
            Sem valor fechado: apenas o preço unitário. O valor de cada carga é calculado automaticamente.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Número</Label>
            <Input value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Transportador</Label>
            <Input value={form.carrier_name} onChange={(e) => setForm((f) => ({ ...f, carrier_name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Modo de preço</Label>
            <Select value={form.pricing_mode} onValueChange={(v) => setForm((f) => ({ ...f, pricing_mode: v as PricingMode }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRICING_LABEL) as PricingMode[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {PRICING_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Preço unitário (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.unit_price}
              onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Centro de custo</Label>
            <CostCenterSelect
              value={form.cost_center_id}
              onChange={(id) => setForm((f) => ({ ...f, cost_center_id: id }))}
              allowEmpty
            />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria financeira</Label>
            <FinancialCategorySelect
              value={form.financial_category}
              onChange={(v) => setForm((f) => ({ ...f, financial_category: v }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Início da vigência</Label>
            <Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Fim da vigência (opcional)</Label>
            <Input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label>Observações</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="sm:col-span-3">
            <Button onClick={submit} disabled={!canManage || add.isPending}>
              <Plus className="mr-1 h-4 w-4" /> Cadastrar contrato
            </Button>
            {!canManage && <span className="ml-3 text-xs text-muted-foreground">Sem permissão de carreteiros.</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contratos de carreteiro</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : contracts.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum contrato de carreteiro cadastrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Transportador</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Centro de custo</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.number}</TableCell>
                      <TableCell>{c.carrier_name}</TableCell>
                      <TableCell>
                        {formatBRL(Number(c.unit_price))}{" "}
                        <Badge variant="outline" className="ml-1 font-normal">
                          {PRICING_LABEL[c.pricing_mode]}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.cost_centers?.name ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(c.start_date)} → {c.end_date ? formatDate(c.end_date) : "sem fim"}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Remover o contrato ${c.number}?`)) {
                                remove.mutate(c.id, { onError: (e) => toast.error((e as Error).message) });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vínculo placa × contrato</CardTitle>
          <p className="text-xs text-muted-foreground">
            Cada vínculo tem data de início e fim, então o sistema sempre sabe qual contrato valia para a placa em cada data.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Placa</Label>
              <Select value={link.plate_id} onValueChange={(v) => setLink((l) => ({ ...l, plate_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {approvedPlates.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contrato</Label>
              <Select value={link.contract_id} onValueChange={(v) => setLink((l) => ({ ...l, contract_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.number} · {c.carrier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Início</Label>
              <Input type="date" value={link.start_date} onChange={(e) => setLink((l) => ({ ...l, start_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim (opcional)</Label>
              <Input type="date" value={link.end_date} onChange={(e) => setLink((l) => ({ ...l, end_date: e.target.value }))} />
            </div>
            <div className="sm:col-span-4">
              <Button onClick={submitLink} disabled={!canManage || linkMut.add.isPending}>
                <Link2 className="mr-1 h-4 w-4" /> Vincular placa
              </Button>
            </div>
          </div>

          {links.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono">{l.carreteiro_plates?.plate ?? "—"}</TableCell>
                      <TableCell>
                        {l.carreteiro_contracts?.number} · {l.carreteiro_contracts?.carrier_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(l.start_date)} → {l.end_date ? formatDate(l.end_date) : "em aberto"}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && !l.end_date && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              linkMut.close.mutate(
                                { id: l.id, end_date: today() },
                                { onSuccess: () => toast.success("Vínculo encerrado."), onError: (e) => toast.error((e as Error).message) },
                              )
                            }
                          >
                            Encerrar
                          </Button>
                        )}
                        {canManage && (
                          <Button size="sm" variant="ghost" onClick={() => linkMut.remove.mutate(l.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
