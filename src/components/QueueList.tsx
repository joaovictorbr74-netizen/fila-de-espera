import { useState } from "react";
import { QueueClient, getWaitingTime } from "@/lib/queue-store";
import QueueCard from "./QueueCard";
import { Users, PartyPopper, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

interface QueueListProps {
  queue: QueueClient[];
  onCall: (id: string) => void;
  onSeat: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<QueueClient>) => void;
}

export default function QueueList({
  queue,
  onCall,
  onSeat,
  onRemove,
  onUpdate,
}: QueueListProps) {
  const [search, setSearch] = useState("");

  const activeQueue = queue.filter((c) => c.status !== "seated");

  const totalPeople = activeQueue.reduce(
    (sum, c) => sum + c.partySize,
    0
  );
  const seatedClients = queue.filter(
  (c) => c.status === "seated"
);
  const longestWaitMinutes = activeQueue.reduce((max, c) => {
    const minutes = Math.floor((Date.now() - c.arrivalTime) / 60000);
    return Math.max(max, minutes);
  }, 0);

  const filteredQueue = activeQueue.filter((client) => {
    const searchTerm = search.toLowerCase();

    return (
      client.name.toLowerCase().includes(searchTerm) ||
      client.phone.includes(search)
    );
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display text-2xl text-primary">
          Fila de Espera
        </h2>

        <div className="flex items-center gap-4 text-muted-foreground text-base flex-wrap">
          <span className="flex items-center gap-1.5">
            <Users className="w-5 h-5" />
            {activeQueue.length} {activeQueue.length === 1 ? "cliente" : "clientes"}
          </span>

          <span>• {totalPeople} {totalPeople === 1 ? "pessoa" : "pessoas"}</span>

          <span>
          • {seatedClients.length} atendidos
          </span>
          {activeQueue.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Maior espera: {longestWaitMinutes} min
            </span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <>
  {filteredQueue.length === 0 ? (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
      {search ? (
        <p className="text-muted-foreground text-xl">
          Nenhum cliente encontrado
        </p>
      ) : (
        <>
          <PartyPopper className="w-10 h-10 text-primary mb-1" />
          <p className="text-foreground text-xl font-semibold">
            Nenhum cliente aguardando
          </p>
          <p className="text-muted-foreground text-base">
            A fila está vazia no momento.
          </p>
        </>
      )}
    </div>
  ) : (
    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
      {filteredQueue.map((client, index) => (
        <QueueCard
          key={client.id}
          client={client}
          position={index + 1}
          queue={queue}
          onCall={onCall}
          onSeat={onSeat}
          onRemove={onRemove}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  )}

  {seatedClients.length > 0 && (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
        Clientes Atendidos ({seatedClients.length})
      </h3>

      <div className="space-y-2 max-h-56 overflow-y-auto">
        {seatedClients
          .slice()
          .reverse()
          .map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between rounded-lg border p-3 bg-muted/30"
            >
              <div>
                <p className="font-medium">
                  {client.name}
                </p>

                <p className="text-sm text-muted-foreground">
                  {client.partySize} pessoa(s)
                </p>
              </div>

              <span className="text-sm text-green-600 font-medium">
                ✓ Atendido
              </span>
            </div>
          ))}
      </div>
    </div>
  )}
</>   </div>);
}