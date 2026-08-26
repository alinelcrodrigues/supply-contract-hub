import { useState } from "react";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CancelarDialog({
  title,
  description,
  buttonLabel = "Cancelar",
  size = "sm",
  onConfirm,
  pending,
}: {
  title: string;
  description?: string;
  buttonLabel?: string;
  size?: "sm" | "default";
  onConfirm: (reason: string) => Promise<void> | void;
  pending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const confirm = async () => {
    if (!reason.trim()) {
      toast.error("Informe o motivo do cancelamento.");
      return;
    }
    try {
      await onConfirm(reason.trim());
      setOpen(false);
      setReason("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <Button
        size={size}
        variant="ghost"
        className="text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <Ban className="mr-1 h-4 w-4" /> {buttonLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <div className="space-y-1.5">
              <Label>Motivo do cancelamento</Label>
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={confirm} disabled={pending}>
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CancelarDialog;
