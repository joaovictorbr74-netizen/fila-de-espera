import { useState, useCallback, useEffect, useRef } from "react";
import { QueueClient } from "@/lib/queue-store";
import {
  fetchQueue,
  insertClient,
  updateClientRow,
  deleteClientRow,
  restoreClient,
  subscribeToQueue,
} from "@/lib/queue-api";
import QueueForm from "@/components/QueueForm";
import QueueList from "@/components/QueueList";
import { toast } from "sonner";
import { Pizza, Loader2 } from "lucide-react";

const Index = () => {
  const [queue, setQueue] = useState<QueueClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadQueue = useCallback(async () => {
    try {
      const data = await fetchQueue();
      setQueue(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Erro ao carregar a fila."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega a fila ao abrir a página e assina atualizações em tempo real,
  // assim qualquer dispositivo (tablet, celular, outro computador) vê a
  // mesma fila, sempre atualizada.
  useEffect(() => {
    reloadQueue();
    const unsubscribe = subscribeToQueue(() => {
      reloadQueue();
    });
    return unsubscribe;
  }, [reloadQueue]);

  const addClient = useCallback(
    async (client: Omit<QueueClient, "id">) => {
      try {
        await insertClient(client);
        toast.success(`${client.name} adicionado à fila!`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erro ao adicionar cliente."
        );
      }
    },
    []
  );

  const callClient = useCallback(
    async (id: string) => {
      const client = queue.find((c) => c.id === id);
      try {
        await updateClientRow(id, { status: "called" });
        toast("📱 Mensagem enviada!", {
          description: `"Sua mesa está pronta" → ${client?.name}`,
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erro ao chamar cliente."
        );
      }
    },
    [queue]
  );

  const seatClient = useCallback(async (id: string) => {
    try {
      await deleteClientRow(id);
      toast.success("Cliente acomodado!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao acomodar cliente."
      );
    }
  }, []);

  const removeClient = useCallback(
    async (id: string) => {
      const client = queue.find((c) => c.id === id);
      if (!client) return;

      try {
        await deleteClientRow(id);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erro ao remover cliente."
        );
        return;
      }

      toast("Cliente removido da fila", {
        description: client.name,
        action: {
          label: "Desfazer",
          onClick: async () => {
            try {
              await restoreClient(client);
              toast.success(`${client.name} voltou para a fila`);
            } catch (err) {
              toast.error(
                err instanceof Error
                  ? err.message
                  : "Não foi possível desfazer."
              );
            }
          },
        },
        duration: 6000,
      });
    },
    [queue]
  );

  const updateClient = useCallback(
    async (id: string, updatedData: Partial<QueueClient>) => {
      try {
        await updateClientRow(id, updatedData);
        toast.success("Cliente atualizado com sucesso");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erro ao atualizar cliente."
        );
      }
    },
    []
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border bg-card shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
            <Pizza className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-foreground tracking-tight">
              Grano <span className="text-primary">Pizza & Bar</span>
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">Fila de Espera</p>
          </div>
        </div>
        <span className="text-muted-foreground text-sm bg-secondary px-4 py-2 rounded-full">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
      </header>

      {/* Main Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando fila...
        </div>
      ) : loadError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <p className="text-destructive font-semibold">
            Não foi possível carregar a fila
          </p>
          <p className="text-muted-foreground text-sm max-w-md">{loadError}</p>
          <button onClick={reloadQueue} className="text-primary underline text-sm">
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left - Form */}
          <div className="w-[400px] flex-shrink-0 border-r border-border p-7 overflow-y-auto bg-card/50">
            <QueueForm onAdd={addClient} queue={queue} />
          </div>

          {/* Right - Queue */}
          <div className="flex-1 p-7 overflow-hidden">
            <QueueList
              queue={queue}
              onCall={callClient}
              onSeat={seatClient}
              onRemove={removeClient}
              onUpdate={updateClient}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
