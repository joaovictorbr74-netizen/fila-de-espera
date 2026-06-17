import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  QueueClient,
  maskPhone,
  isValidPhone,
  findDuplicatePhone,
  formatTime,
} from "@/lib/queue-store";
import { UserPlus, Users, Phone, User, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface QueueFormProps {
  onAdd: (client: QueueClient) => void;
  queue: QueueClient[]; // Adicione a prop queue para verificar o número de pessoas na fila
}

export default function QueueForm({ onAdd, queue }: QueueFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("O nome do cliente é obrigatório.");
      return;
    }

    if (!phone.trim()) {
      toast.error("O telefone do cliente é obrigatório.");
      return;
    }

    if (!isValidPhone(phone)) {
      toast.error("Telefone inválido");
      return;
    }

    const clienteExistente = findDuplicatePhone(queue, phone);

    if (clienteExistente) {
      toast.error("Telefone já cadastrado na fila", {
        description: `${clienteExistente.name} entrou às ${formatTime(
          clienteExistente.arrivalTime
        )}`,
      });

      return;
    }

    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      partySize,
      arrivalTime: Date.now(),
      notes: notes.trim(),
      status: "waiting",
    });

    setName("");
    setPhone("");
    setPartySize(2);
    setNotes("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 h-full">
      <h2 className="font-display text-2xl text-primary">Novo Cliente</h2>

      <div className="space-y-2">
        <Label className="text-base text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" /> Nome
        </Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do cliente"
          className="h-14 text-lg bg-secondary border-border placeholder:text-muted-foreground"
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base text-foreground flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" /> Telefone
        </Label>
        <Input
          value={phone}
          maxLength={15}
          onChange={(e) => setPhone(maskPhone(e.target.value))}
          placeholder="(11) 98765-4321"
          className="h-14 text-lg bg-secondary border-border placeholder:text-muted-foreground"
          type="tel"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" /> Pessoas
        </Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-14 w-14 text-2xl border-border"
            onClick={() => setPartySize(Math.max(1, partySize - 1))}
          >
            −
          </Button>
          <span className="text-3xl font-bold w-12 text-center text-foreground">
            {partySize}
          </span>
          <Button
            type="button"
            variant="outline"
            className="h-14 w-14 text-2xl border-border"
            onClick={() => setPartySize(partySize + 1)}
          >
            +
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" /> Observações
        </Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Área externa, aniversário, cliente com bebê..."
          className="min-h-[100px] text-base bg-secondary border-border placeholder:text-muted-foreground resize-none"
        />
      </div>

      <Button
        type="submit"
        className="h-16 text-xl font-semibold mt-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
      >
        <UserPlus className="w-6 h-6 mr-2" />
        ADICIONAR À FILA
      </Button>
    </form>
  );
}