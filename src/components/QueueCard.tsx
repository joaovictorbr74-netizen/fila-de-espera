import {
  QueueClient,
  getWaitingTime,
  formatTime,
  maskPhone,
  isValidPhone,
  findDuplicatePhone,
  buildCallMessage,
} from "@/lib/queue-store";
import { Button } from "@/components/ui/button";
import { Clock, Users, X, Bell, Check, MessageSquare, MoreVertical, Phone, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
};

export default function QueueCard({ client, position, queue, onCall, onSeat, onRemove, onUpdate }: QueueCardProps) {
  const [waitTime, setWaitTime] = useState(getWaitingTime(client.arrivalTime));
  const config = statusConfig[client.status];

  const [editName, setEditName] = useState(client.name);
  const [editPhone, setEditPhone] = useState(client.phone);
  const [editPartySize, setEditPartySize] = useState(client.partySize);
  const [editNotes, setEditNotes] = useState(client.notes);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCall, setOpenCall] = useState(false);

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
      buildCallMessage(client.name, "Grano Pizza & Bar")
    );

    const url = `https://wa.me/55${telefone}?text=${mensagem}`;

    window.open(url, "_blank", "noopener,noreferrer");

    onCall(client.id);
    setOpenCall(false);
  };

  return (
    <div
      className={`bg-card border rounded-2xl p-5 flex items-center gap-4 transition-all shadow-md hover:shadow-lg hover:border-primary/30 ${
        client.status === "called"
          ? "border-status-called ring-2 ring-status-called/50 bg-status-called/5"
          : "border-border"
      }`}
    >
      {/* Position */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-muted-foreground shadow-inner">
        {position}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-semibold text-foreground truncate">{client.name}</span>
          {client.status === "called" && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-status-called text-background animate-pulse">
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
      className="h-12 px-5 text-base font-bold bg-status-seated hover:bg-status-seated/80 text-background shadow-md"
    >
      <Check className="w-5 h-5 mr-1" />
      SENTOU
    </Button>
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
          onClick={() => setOpenEdit(true)}
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