import { useState } from "react";
import { QueueClient } from "@/lib/queue-store";
import QueueCard from "./QueueCard";
import {
  Users,
  PartyPopper,
  Clock,
  CheckCircle2,
  History,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface QueueListProps {
  queue: QueueClient[];
  onCall: (id: string) => void;
  onSeat: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<QueueClient>) => void;
  onReturnToQueue: (id: string) => void;
  onClearSeated: () => void;
  onClearHistory: () => void;
}

export default function QueueList({
  queue,
  onCall,
  onSeat,
  onRemove,
  onUpdate,
  onReturnToQueue,
  onClearSeated,
  onClearHistory,
}: QueueListProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"waiting" | "seated" | "history">(
    "waiting"
  );

  const activeQueue = queue.filter((client) => client.status !== "seated");
  const seatedClients = queue.filter(
    (client) => client.status === "seated" && !client.archivedAt
  );
  const historyClients = queue.filter(
    (client) => client.status === "seated" && client.archivedAt
  );

  const totalPeople = activeQueue.reduce(
    (sum, client) => sum + client.partySize,
    0
  );

  const longestWaitMinutes = activeQueue.reduce((max, client) => {
    const minutes = Math.floor((Date.now() - client.arrivalTime) / 60000);
    return Math.max(max, minutes);
  }, 0);

  const searchClient = (client: QueueClient) => {
    const searchTerm = search.toLowerCase();

    return (
      client.name.toLowerCase().includes(searchTerm) ||
      client.phone.includes(search)
    );
  };

  const filteredQueue = activeQueue.filter(searchClient);
  const filteredSeatedClients = seatedClients.filter(searchClient);
  const filteredHistoryClients = historyClients.filter(searchClient);

  const formatTime = (timestamp?: number | null) => {
    if (!timestamp) return "--:--";

    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (timestamp?: number | null) => {
    if (!timestamp) return "--/-- --:--";

    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWaitMinutes = (client: QueueClient) => {
    const endTime = client.seatedTime ?? Date.now();
    return Math.max(0, Math.floor((endTime - client.arrivalTime) / 60000));
  };

  const tabClass = (active: boolean) =>
    active
      ? "h-10 px-4 rounded-full text-sm font-bold bg-foreground text-background hover:bg-foreground/90 hover:text-background"
      : "h-10 px-4 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground"

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1 flex-wrap rounded-full border border-border bg-card/60 p-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("waiting")}
            aria-pressed={activeTab === "waiting"}
            className={tabClass(activeTab === "waiting")}
          >
            <Users className="w-4 h-4" />
            Fila de Espera
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("seated")}
            aria-pressed={activeTab === "seated"}
            className={tabClass(activeTab === "seated")}
          >
            <CheckCircle2 className="w-4 h-4" />
            Atendidos
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("history")}
            aria-pressed={activeTab === "history"}
            className={tabClass(activeTab === "history")}
          >
            <History className="w-4 h-4" />
            Histórico
          </Button>
        </div>

        <div className="flex items-center gap-4 text-muted-foreground text-base flex-wrap">
          {activeTab === "waiting" && (
            <>
              <span className="flex items-center gap-1.5">
                <Users className="w-5 h-5" />
                {activeQueue.length}{" "}
                {activeQueue.length === 1 ? "cliente" : "clientes"}
              </span>

              <span>
                • {totalPeople} {totalPeople === 1 ? "pessoa" : "pessoas"}
              </span>

              {activeQueue.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Maior espera: {longestWaitMinutes} min
                </span>
              )}
            </>
          )}

          {activeTab === "seated" && (
            <>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                {seatedClients.length} atendidos
              </span>

              {seatedClients.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClearSeated}
                  className="h-9"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar atendidos
                </Button>
              )}
            </>
          )}

          {activeTab === "history" && (
            <>
              <span className="flex items-center gap-1.5">
                <History className="w-5 h-5" />
                {historyClients.length} no histórico
              </span>

              {historyClients.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9"
                    >
                      <Trash2 className="w-4 h-4" />
                      Limpar histórico
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>

                      <AlertDialogDescription>
                        Essa ação vai apagar definitivamente todos os clientes do
                        histórico. A fila atual e os atendidos ainda não
                        arquivados não serão afetados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>

                      <AlertDialogAction onClick={onClearHistory}>
                        Apagar histórico
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 text-base rounded-full px-5 bg-card/60"
        />
      </div>

      {activeTab === "waiting" && (
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
        </>
      )}

      {activeTab === "seated" && (
        <>
          {filteredSeatedClients.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground mb-1" />
              <p className="text-foreground text-xl font-semibold">
                Nenhum cliente atendido
              </p>
              <p className="text-muted-foreground text-base">
                Os clientes que sentarem aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredSeatedClients
                .slice()
                .reverse()
                .map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border p-5 bg-card/80"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {client.name}
                      </p>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mt-1">
                        <span>
                          {client.partySize}{" "}
                          {client.partySize === 1 ? "pessoa" : "pessoas"}
                        </span>

                        <span>• {client.phone}</span>

                        <span>• Chegou às {formatTime(client.arrivalTime)}</span>

                        <span>• Sentou às {formatTime(client.seatedTime)}</span>

                        <span>• Esperou {getWaitMinutes(client)} min</span>
                      </div>

                      {client.notes && (
                        <p className="mt-2 text-sm text-muted-foreground italic">
                          Obs: {client.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onReturnToQueue(client.id)}
                        className="h-10"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Voltar
                      </Button>

                      <span className="flex items-center gap-1.5 text-sm text-status-seated font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Atendido
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {activeTab === "history" && (
        <>
          {filteredHistoryClients.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
              <History className="w-10 h-10 text-muted-foreground mb-1" />
              <p className="text-foreground text-xl font-semibold">
                Histórico vazio
              </p>
              <p className="text-muted-foreground text-base">
                Ao limpar os atendidos, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredHistoryClients
                .slice()
                .reverse()
                .map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border p-5 bg-card/50"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {client.name}
                      </p>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mt-1">
                        <span>
                          {client.partySize}{" "}
                          {client.partySize === 1 ? "pessoa" : "pessoas"}
                        </span>

                        <span>• {client.phone}</span>

                        <span>
                          • Chegou em {formatDateTime(client.arrivalTime)}
                        </span>

                        <span>
                          • Sentou em {formatDateTime(client.seatedTime)}
                        </span>

                        <span>• Esperou {getWaitMinutes(client)} min</span>
                      </div>

                      {client.notes && (
                        <p className="mt-2 text-sm text-muted-foreground italic">
                          Obs: {client.notes}
                        </p>
                      )}
                    </div>

                    <span className="flex-shrink-0" />
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}