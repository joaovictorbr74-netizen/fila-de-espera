import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientTag, QueueClient } from "@/lib/queue-store";
import { Baby, Heart, Accessibility, UserPlus, Users, Phone, User } from "lucide-react";

interface QueueFormProps {
  onAdd: (client: QueueClient) => void;
}

const tags: { value: ClientTag; label: string; icon: React.ReactNode }[] = [
  { value: "criança", label: "Criança", icon: <Baby className="w-5 h-5" /> },
  { value: "idoso", label: "Idoso", icon: <Heart className="w-5 h-5" /> },
  { value: "pcd", label: "PCD", icon: <Accessibility className="w-5 h-5" /> },
];

export default function QueueForm({ onAdd }: QueueFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [selectedTags, setSelectedTags] = useState<ClientTag[]>([]);

  const toggleTag = (tag: ClientTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      partySize,
      arrivalTime: Date.now(),
      tags: selectedTags,
      status: "waiting",
    });

    setName("");
    setPhone("");
    setPartySize(2);
    setSelectedTags([]);
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
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(00) 00000-0000"
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
        <Label className="text-base text-foreground">Observações</Label>
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag) => (
            <Button
              key={tag.value}
              type="button"
              variant={selectedTags.includes(tag.value) ? "default" : "outline"}
              className={`h-12 px-5 text-base gap-2 border-border ${
                selectedTags.includes(tag.value)
                  ? "bg-primary text-primary-foreground"
                  : ""
              }`}
              onClick={() => toggleTag(tag.value)}
            >
              {tag.icon}
              {tag.label}
            </Button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        className="h-16 text-xl font-semibold mt-auto bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <UserPlus className="w-6 h-6 mr-2" />
        ADICIONAR À FILA
      </Button>
    </form>
  );
}
