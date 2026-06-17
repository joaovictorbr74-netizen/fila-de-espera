import { QueueClient, getWaitingTime, formatTime } from "@/lib/queue-store";
import { Button } from "@/components/ui/button";
import { Clock, Users, X, Bell, Check, MessageSquare, MoreVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

export default function QueueCard({ client, position, onCall, onSeat, onRemove, onUpdate }: QueueCardProps) {
  const [waitTime, setWaitTime] = useState(getWaitingTime(client.arrivalTime));
  const config = statusConfig[client.status];
  
  const [editName, setEditName] = useState(client.name);
  const [editPhone, setEditPhone] = useState(client.phone);
  const [editPartySize, setEditPartySize] = useState(client.partySize);
  const [editNotes, setEditNotes] = useState(client.notes);
  const [openEdit, setOpenEdit] = useState(false); 

  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime(getWaitingTime(client.arrivalTime));
    }, 10000);
    return () => clearInterval(interval);
  }, [client.arrivalTime]);

  return (
    <div className={`bg-card border border-border rounded-2xl p-5 flex items-center gap-4 transition-all shadow-md hover:shadow-lg hover:border-primary/30 ${client.status === "called" ? "ring-2 ring-status-called/40" : ""}`}>
      {/* Position */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-muted-foreground shadow-inner">
        {position}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-semibold text-foreground truncate">{client.name}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" /> {client.partySize}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> {formatTime(client.arrivalTime)}
          </span>
          <span className="font-medium text-foreground">⏱ {waitTime}</span>
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
    <Button
      onClick={() => {
        const telefone = client.phone?.replace(/\D/g, "");

        if (!telefone) {
          alert("Telefone inválido");
          return;
        }

        if (!confirm(`Chamar ${client.name}?`)) return;

        const mensagem = encodeURIComponent(
          `Olá ${client.name}! 😊\nSua mesa na Grano Pizza & Bar já está pronta 🍕`
        );

        const url = `https://wa.me/55${telefone}?text=${mensagem}`;

        window.open(url, "_blank", "noopener,noreferrer");

        onCall(client.id);
      }}
    >
      <Bell className="w-5 h-5 mr-1" />
      CHAMAR
    </Button>
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
        onChange={(e) => {
          let value = e.target.value.replace(/\D/g, "");

          value = value.slice(0, 11);

          if (value.length <= 2) {
            value = value;
          } else if (value.length <= 7) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
          } else {
            value = `(${value.slice(0, 2)}) ${value.slice(
              2,
              7
            )}-${value.slice(7)}`;
          }

          setEditPhone(value);
        }}
        placeholder="(11) 98765-4321"
      />

      <Input
        type="number"
        value={editPartySize}
        onChange={(e) =>
          setEditPartySize(Number(e.target.value))
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
        onClick={() => {
          if (!editName.trim()) {
            alert("O nome do cliente é obrigatório.");
            return;
          }

          if (!editPhone.trim()) {
            alert("O telefone do cliente é obrigatório.");
            return;
          }

          const telefoneLimpo = editPhone.replace(/\D/g, "");

          if (telefoneLimpo.length !== 11) {
            alert("Telefone inválido.");
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
