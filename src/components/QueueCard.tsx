import {
  QueueClient,
  getWaitingTime,
  formatTime,
  maskPhone,
  isValidPhone,
  findDuplicatePhone,
  buildCallMessage, GaveUpReason } from "@/lib/queue-store";
import { Button } from "@/components/ui/button";
import { Clock, Users, X, Bell, Check, MessageSquare, MoreVertical, Phone, Copy, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RESTAURANT_NAME } from "@/lib/config";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QueueCardProps {
  client: QueueClient;
  position: number;
  queue: QueueClient[];
  onCall: (id: string) => void;
  onSeat: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<QueueClient>) => void;
  onGiveUp: (id: string, reason: GaveUpReason) => void;
}


const statusConfig = {
  waiting: {
    label: "Aguardando",
    className: "bg-status-waiting/20 text-status-waiting border-status-waiting/30",
    dot: "bg-status-waiting",
  },
  called: {
    label: "Chamado",
    className: "bg-status-called/20 text-status-called border-status-called/30",
    dot: "bg-status-called",
  },
  seated: {
    label: "Sentou",
    className: "bg-status-seated/20 text-status-seated border-status-seated/30",
    dot: "bg-status-seated",
  },
  gave_up: {
    label: "Desistiu",
    className: "bg-destructive/20 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
};

export default function QueueCard({ client, position, queue, onCall, onSeat, onRemove, onUpdate, onGiveUp }: QueueCardProps) {
  const [waitTime, setWaitTime] = useState(getWaitingTime(client.arrivalTime));
  const config = statusConfig[client.status];

  const [editName, setEditName] = useState(client.name);
  const [editPhone, setEditPhone] = useState(client.phone);
  const [editPartySize, setEditPartySize] = useState(client.partySize);
  const [editNotes, setEditNotes] = useState(client.notes);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCall, setOpenCall] = useState(false);

  // Recarrega os campos com os dados atuais do cliente sempre que a edição
  // é aberta, para não sobrescrever mudanças feitas em outro aparelho.
  const openEditDialog = () => {
    setEditName(client.name);
    setEditPhone(client.phone);
    setEditPartySize(client.partySize);
    setEditNotes(client.notes);
    setOpenEdit(true);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime(getWaitingTime(client.arrivalTime));
    }, 10000);
    return () => clearInterval(interval);
  }, [client.arrivalTime]);

  const handleCopyPhone = () => {
    if (!client.phone) {
      toast.error("Telefone inválido");
      return;
    }
    navigator.clipboard
      .writeText(client.phone)
      .then(() => toast.success("Telefone copiado!"))
      .catch(() => toast.error("Não foi possível copiar o telefone"));
  };

  const handleOpenWhatsapp = () => {
    const telefone = client.phone?.replace(/\D/g, "");
    if (!telefone) {
      toast.error("Telefone inválido");
      return;
    }
    const url = `https://wa.me/55${telefone}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleConfirmCall = () => {
    const telefone = client.phone?.replace(/\D/g, "");

    if (!telefone) {
      toast.error("Telefone inválido");
      setOpenCall(false);
      return;
    }

    const mensagem = encodeURIComponent(
      buildCallMessage(client.name, RESTAURANT_NAME)
    );

    const url = `https://wa.me/55${telefone}?text=${mensagem}`;

    window.open(url, "_blank", "noopener,noreferrer");

    onCall(client.id);
    setOpenCall(false);
  };

  return (
    <div
      className={`border rounded-2xl p-5 flex items-center gap-4 transition-all ${
        client.status === "called"
          ? "border-status-called bg-gradient-to-r from-status-called/15 to-card/80 ring-4 ring-status-called/10 shadow-[0_18px_40px_-20px_hsl(var(--status-called)/0.55)]"
          : "border-border bg-card/80 hover:border-primary/40"
      }`}
    >
      {/* Position */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
        client.status === "called"
          ? "bg-status-called text-background"
          : "border border-border text-muted-foreground"
      }`}>
        {position}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-semibold text-foreground truncate">{client.name}</span>
          {client.status === "called" && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em] bg-status-called text-background">
              <Bell className="w-3 h-3" /> Chamado
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" /> {client.partySize}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> Entrou às {formatTime(client.arrivalTime)}
          </span>
          <span className="font-medium text-foreground">
            {client.status === "called" ? `⏱ Chamado há ${waitTime}` : `⏱ ${waitTime}`}
          </span>
          <button
            type="button"
            onClick={handleOpenWhatsapp}
            onContextMenu={(e) => {
              e.preventDefault();
              handleCopyPhone();
            }}
            title="Clique para abrir o WhatsApp. Clique com o botão direito para copiar o telefone."
            className="flex items-center gap-1 text-primary hover:underline font-medium"
          >
            <Phone className="w-4 h-4" /> {client.phone || "Sem telefone"}
          </button>
          <button
            type="button"
            onClick={handleCopyPhone}
            title="Copiar telefone"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        {client.notes && (
          <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span className="italic truncate">{client.notes}</span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className={`px-3 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-1.5 ${config.className}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        {config.label}
      </div>

      {/* Actions */}
<div className="flex items-center gap-2 flex-shrink-0">
  {client.status === "waiting" && (
    <AlertDialog open={openCall} onOpenChange={setOpenCall}>
      <AlertDialogTrigger asChild>
        <Button
          className="h-12 px-5 text-sm font-extrabold tracking-[0.18em]"
          onClick={() => {
            const telefone = client.phone?.replace(/\D/g, "");
            if (!telefone) {
              toast.error("Telefone inválido");
              return;
            }
            setOpenCall(true);
          }}
        >
          <Bell className="w-5 h-5 mr-1" />
          CHAMAR
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Chamar {client.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Uma mensagem será enviada pelo WhatsApp avisando que a mesa está pronta.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmCall}>
            Chamar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )}

  {client.status === "called" && (
    <Button
      onClick={() => onSeat(client.id)}
      className="h-12 px-5 text-sm font-extrabold tracking-[0.18em] bg-foreground hover:bg-foreground/90 text-background"
    >
      <Check className="w-5 h-5 mr-1" />
      SENTOU
    </Button>
  )}

  {(client.status === "waiting" || client.status === "called") && (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-12 px-4 text-sm font-semibold text-muted-foreground"
        >
          <XCircle className="w-4 h-4 mr-1" />
          Desistiu
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{client.name} desistiu?</AlertDialogTitle>
          <AlertDialogDescription>
            O cliente sai da fila e fica registrado em Atendidos › Desistências.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-secondary text-foreground border border-border hover:bg-accent"
            onClick={() => onGiveUp(client.id, "nao_apareceu")}
          >
            Não apareceu
          </AlertDialogAction>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onGiveUp(client.id, "desistiu")}
          >
            Desistiu
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )}

  <AlertDialog>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={openEditDialog}
        >
          Editar Cliente
        </DropdownMenuItem>

        <AlertDialogTrigger asChild>
          <DropdownMenuItem
            className="text-destructive"
            onSelect={(e) => e.preventDefault()}
          >
            Remover Cliente
          </DropdownMenuItem>
        </AlertDialogTrigger>
      </DropdownMenuContent>
    </DropdownMenu>

    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Remover cliente da fila?
        </AlertDialogTitle>

        <AlertDialogDescription>
          Tem certeza que deseja remover <strong>{client.name}</strong> da fila?
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel>
          Cancelar
        </AlertDialogCancel>

        <AlertDialogAction onClick={() => onRemove(client.id)}>
          Remover
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        Editar Cliente
      </AlertDialogTitle>

      <AlertDialogDescription>
        Atualize os dados do cliente.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <div className="space-y-3">
      <Input
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        placeholder="Nome"
      />

      <Input
        value={editPhone}
        maxLength={15}
        onChange={(e) => setEditPhone(maskPhone(e.target.value))}
        placeholder="(11) 98765-4321"
        type="tel"
      />

      <Input
        type="number"
        min={1}
        value={editPartySize}
        onChange={(e) =>
          setEditPartySize(Math.max(1, Number(e.target.value) || 1))
        }
        placeholder="Quantidade de pessoas"
      />

      <Textarea
        value={editNotes}
        onChange={(e) => setEditNotes(e.target.value)}
        placeholder="Observações"
      />
    </div>

    <AlertDialogFooter>
      <AlertDialogCancel>
        Cancelar
      </AlertDialogCancel>

      <AlertDialogAction
        onClick={(e) => {
          if (!editName.trim()) {
            e.preventDefault();
            toast.error("O nome do cliente é obrigatório.");
            return;
          }

          if (!editPhone.trim()) {
            e.preventDefault();
            toast.error("O telefone do cliente é obrigatório.");
            return;
          }

          if (!isValidPhone(editPhone)) {
            e.preventDefault();
            toast.error("Telefone inválido");
            return;
          }

          const duplicado = findDuplicatePhone(queue, editPhone, client.id);

          if (duplicado) {
            e.preventDefault();
            toast.error("Telefone já cadastrado na fila", {
              description: `${duplicado.name} entrou às ${formatTime(
                duplicado.arrivalTime
              )}`,
            });
            return;
          }

          onUpdate(client.id, {
            name: editName.trim(),
            phone: editPhone.trim(),
            partySize: editPartySize,
            notes: editNotes.trim(),
          });

          setOpenEdit(false);
        }}
      >
        Salvar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>  
</div>
    </div>
  );
}