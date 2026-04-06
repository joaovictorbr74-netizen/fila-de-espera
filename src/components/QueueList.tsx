import { QueueClient } from "@/lib/queue-store";
import QueueCard from "./QueueCard";
import { Users } from "lucide-react";

interface QueueListProps {
  queue: QueueClient[];
  onCall: (id: string) => void;
  onSeat: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function QueueList({ queue, onCall, onSeat, onRemove }: QueueListProps) {
  const activeQueue = queue.filter((c) => c.status !== "seated");
  const totalPeople = activeQueue.reduce((sum, c) => sum + c.partySize, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl text-primary">Fila de Espera</h2>
        <div className="flex items-center gap-4 text-muted-foreground text-base">
          <span className="flex items-center gap-1.5">
            <Users className="w-5 h-5" />
            {activeQueue.length} na fila
          </span>
          <span>• {totalPeople} pessoas</span>
        </div>
      </div>

      {activeQueue.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-xl">
          Nenhum cliente na fila
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activeQueue.map((client, index) => (
            <QueueCard
              key={client.id}
              client={client}
              position={index + 1}
              onCall={onCall}
              onSeat={onSeat}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
