import { useState, useCallback, useEffect } from "react";
import {
  QueueClient,
  GaveUpReason,
  GAVE_UP_LABELS,
  buildFeedbackMessage,
  openWhatsApp,
} from "@/lib/queue-store";
import { RESTAURANT_NAME, REVIEW_URL } from "@/lib/config";
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
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Loader2, LogOut, Plus } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import BambooLogo from "@/components/BambooLogo";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [queue, setQueue] = useState<QueueClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openNewClient, setOpenNewClient] = useState(false);
  // Sessão do Supabase Auth: undefined = ainda verificando, null = deslogado
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const authenticated = !!session;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

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
    async (client: Omit<QueueClient, "id">): Promise<boolean> => {
      try {
        await insertClient(client);
        toast.success(`${client.name} adicionado à fila!`);
        return true;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erro ao adicionar cliente."
        );
        return false;
      }
    },
    []
  );

  const callClient = useCallback(
    async (id: string) => {
      const client = queue.find((c) => c.id === id);

      try {
        await updateClientRow(id, { status: "called" });

        toast("Cliente chamado!", {
          description: `WhatsApp aberto para ${client?.name}`,
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
        gaveUpAt: null,
        gaveUpReason: null,
      });

      toast.success("Cliente voltou para a fila");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao voltar cliente para fila."
      );
    }
  }, []);

  const giveUpClient = useCallback(
    async (id: string, reason: GaveUpReason) => {
      try {
        await updateClientRow(id, {
          status: "gave_up",
          gaveUpAt: Date.now(),
          gaveUpReason: reason,
        });

        toast(`Marcado como "${GAVE_UP_LABELS[reason]}"`, {
          description: "Ficou registrado em Atendidos › Desistências",
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erro ao registrar desistência."
        );
      }
    },
    []
  );

  const requestFeedback = useCallback(async (client: QueueClient) => {
    const opened = openWhatsApp(
      client.phone,
      buildFeedbackMessage(client.name, RESTAURANT_NAME, REVIEW_URL)
    );

    if (!opened) {
      toast.error("Telefone inválido");
      return;
    }

    try {
      const now = Date.now();
      await updateClientRow(client.id, {
        feedbackSentAt: now,
        archivedAt: now,
      });

      toast.success(`Feedback pedido para ${client.name}`, {
        description: "Cliente movido para o Histórico",
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao registrar feedback."
      );
    }
  }, []);

  const archiveClient = useCallback(async (id: string) => {
    try {
      await updateClientRow(id, { archivedAt: Date.now() });
      toast.success("Enviado para o histórico");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao enviar para o histórico."
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
      (client) =>
        (client.status === "seated" || client.status === "gave_up") &&
        client.archivedAt
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setQueue([]);
    setLoading(true);
    setLoadError(null);
  };

  if (session === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-bamboo">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated) {
    return <Login />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bamboo">
      <header className="flex items-center justify-between gap-4 px-4 lg:px-5 xl:px-10 py-3 lg:py-4 xl:py-5 border-b border-border">
        <h1 className="min-w-0">
          <BambooLogo subtitle="Fila de espera" />
        </h1>

        <div className="flex items-center gap-2 xl:gap-3 flex-shrink-0">
          <span className="hidden sm:inline-flex text-muted-foreground text-sm border border-border px-4 py-2 rounded-full">
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
            aria-label="Sair"
            className="h-11 w-11 rounded-full border border-border text-muted-foreground"
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
          {/* PC/tablet: formulário fixo à esquerda */}
          <div className="hidden lg:block w-[340px] xl:w-[400px] flex-shrink-0 p-5 xl:p-7 overflow-y-auto">
            <QueueForm
              onAdd={addClient}
              queue={queue.filter((client) => !client.archivedAt)}
            />
          </div>

          <div className="flex-1 min-w-0 p-4 lg:p-5 xl:p-7 overflow-hidden">
            <QueueList
              queue={queue}
              onCall={callClient}
              onSeat={seatClient}
              onRemove={removeClient}
              onUpdate={updateClient}
              onReturnToQueue={returnClientToQueue}
              onGiveUp={giveUpClient}
              onRequestFeedback={requestFeedback}
              onArchive={archiveClient}
              onClearSeated={clearSeatedClients}
              onClearHistory={clearHistory}
            />
          </div>

          {/* Celular: botão flutuante abre o formulário numa gaveta */}
          <Drawer open={openNewClient} onOpenChange={setOpenNewClient}>
            <DrawerTrigger asChild>
              <Button
                type="button"
                className="lg:hidden fixed right-4 bottom-6 z-40 h-[60px] rounded-full pl-5 pr-6 text-sm font-extrabold tracking-[0.14em] shadow-[0_14px_30px_-8px_hsl(var(--primary)/0.65)]"
              >
                <Plus className="w-6 h-6" />
                NOVO CLIENTE
              </Button>
            </DrawerTrigger>
            <DrawerContent className="lg:hidden bg-secondary border-primary/30 max-h-[92vh]">
              <DrawerTitle className="sr-only">Novo cliente</DrawerTitle>
              <DrawerDescription className="sr-only">
                Adicionar um cliente à fila de espera
              </DrawerDescription>
              <div className="overflow-y-auto p-4 pb-8">
                <QueueForm
                  onAdd={async (client) => {
                    if (await addClient(client)) setOpenNewClient(false);
                  }}
                  queue={queue.filter((client) => !client.archivedAt)}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      )}
    </div>
  );
};

export default Index;