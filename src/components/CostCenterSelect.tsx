import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useCostCenters } from "@/lib/params-hooks";

/** Select de centro de custo alimentado pela tabela cost_centers. */
export function CostCenterSelect({
  value,
  onChange,
  placeholder = "Selecione o centro de custo",
  disabled,
  allowEmpty = false,
}: {
  value: string | null;
  onChange: (id: string | null, name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
}) {
  const { data: all = [], isLoading } = useCostCenters();
  const list = all.filter((c) => c.active || c.id === value);
  const [open, setOpen] = useState(false);
  const selected = all.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? `${selected.code ? selected.code + " · " : ""}${selected.name}` : isLoading ? "Carregando..." : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar centro de custo..." />
          <CommandList>
            <CommandEmpty>Nenhum centro de custo encontrado.</CommandEmpty>
            <CommandGroup>
              {allowEmpty && (
                <CommandItem
                  value="__nenhum__"
                  onSelect={() => {
                    onChange(null, "");
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                  Sem centro de custo
                </CommandItem>
              )}
              {list.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.code ?? ""} ${c.name}`}
                  onSelect={() => {
                    onChange(c.id, c.name);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 truncate">{c.name}</span>
                  {c.code && <span className="ml-2 font-mono text-[10px] text-muted-foreground">{c.code}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default CostCenterSelect;
