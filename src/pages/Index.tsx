import { useState, useCallback, useEffect } from "react";
import { QueueClient } from "@/lib/queue-store";
import {
  fetchQueue,
  insertClient,
  updateClientRow,
  deleteClientRow,
  restoreClient,
  subscribeToQueue,
  archiveSeatedClients,
} from "@/lib/queue-api";
import QueueForm from "@/components/QueueForm";
import QueueList from "@/components/QueueList";
import Login from "@/pages/Login";
import { toast } from "sonner";
import { Pizza, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [queue, setQueue] = useState<QueueClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(
    localStorage.getItem("queue-authenticated") === "true"
  );

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

  useEffect(() => {
    if (!authenticated) return;

    reloadQueue();
    const unsubscribe = subscribeToQueue(() => {
      reloadQueue();
    });

    return unsubscribe;
  }, [authenticated, reloadQueue]);

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

        toast("Mensagem enviada!", {
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
      await updateClientRow(id, {
        status: "seated",
        seatedTime: Date.now(),
        archivedAt: null,
      });

      toast.success("Cliente acomodado!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao acomodar cliente."
      );
    }
  }, []);

  const returnClientToQueue = useCallback(async (id: string) => {
    try {
      await updateClientRow(id, {
        status: "waiting",
        seatedTime: null,
        archivedAt: null,
      });

      toast.success("Cliente voltou para a fila");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao voltar cliente para fila."
      );
    }
  }, []);

  const clearSeatedClients = useCallback(async () => {
    try {
      await archiveSeatedClients();
      toast.success("Atendidos enviados para o histórico");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao limpar atendidos."
      );
    }
  }, []);

  const clearHistory = useCallback(async () => {
    const historyClients = queue.filter(
      (client) => client.status === "seated" && client.archivedAt
    );

    try {
      await Promise.all(
        historyClients.map((client) => deleteClientRow(client.id))
      );

      toast.success("Histórico apagado com sucesso");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao apagar histórico."
      );
    }
  }, [queue]);

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

  const handleLogout = () => {
    localStorage.removeItem("queue-authenticated");
    setAuthenticated(false);
    setQueue([]);
    setLoading(true);
    setLoadError(null);
  };

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-4 px-5 xl:px-8 py-4 xl:py-5 border-b border-border bg-card shadow-lg">
        <div className="flex items-center gap-3 xl:gap-4 min-w-0">
          <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Pizza className="w-5 h-5 xl:w-6 xl:h-6 text-primary" />
          </div>

          <div className="min-w-0">
            <h1 className="font-display text-2xl xl:text-3xl text-foreground tracking-tight truncate">
              Grano <span className="text-primary">Pizza & Bar</span>
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">
              Fila de Espera
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 xl:gap-3 flex-shrink-0">
          <span className="hidden sm:inline-flex text-muted-foreground text-sm bg-secondary px-4 py-2 rounded-full">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sair"
            className="h-10 w-10"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

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

          <p className="text-muted-foreground text-sm max-w-md">
            {loadError}
          </p>

          <button
            onClick={reloadQueue}
            className="text-primary underline text-sm"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[340px] xl:w-[400px] flex-shrink-0 border-r border-border p-5 xl:p-7 overflow-y-auto bg-card/50">
            <QueueForm
              onAdd={addClient}
              queue={queue.filter((client) => !client.archivedAt)}
            />
          </div>

          <div className="flex-1 p-5 xl:p-7 overflow-hidden">
            <QueueList
              queue={queue}
              onCall={callClient}
              onSeat={seatClient}
              onRemove={removeClient}
              onUpdate={updateClient}
              onReturnToQueue={returnClientToQueue}
              onClearSeated={clearSeatedClients}
              onClearHistory={clearHistory}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;