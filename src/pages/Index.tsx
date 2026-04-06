import { useState, useCallback, useEffect } from "react";
import { QueueClient, loadQueue, saveQueue } from "@/lib/queue-store";
import QueueForm from "@/components/QueueForm";
import QueueList from "@/components/QueueList";
import { toast } from "sonner";
import { Pizza } from "lucide-react";

const Index = () => {
  const [queue, setQueue] = useState<QueueClient[]>(loadQueue);

  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  const addClient = useCallback((client: QueueClient) => {
    setQueue((prev) => [...prev, client]);
    toast.success(`${client.name} adicionado à fila!`);
  }, []);

  const callClient = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "called" as const } : c))
    );
    const client = queue.find((c) => c.id === id);
    toast("📱 Mensagem enviada!", {
      description: `"Sua mesa está pronta" → ${client?.name}`,
    });
  }, [queue]);

  const seatClient = useCallback((id: string) => {
    setQueue((prev) => prev.filter((c) => c.id !== id));
    toast.success("Cliente acomodado!");
  }, []);

  const removeClient = useCallback((id: string) => {
    setQueue((prev) => prev.filter((c) => c.id !== id));
    toast("Cliente removido da fila");
  }, []);

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
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Form */}
        <div className="w-[400px] flex-shrink-0 border-r border-border p-7 overflow-y-auto bg-card/50">
          <QueueForm onAdd={addClient} />
        </div>

        {/* Right - Queue */}
        <div className="flex-1 p-7 overflow-hidden">
          <QueueList
            queue={queue}
            onCall={callClient}
            onSeat={seatClient}
            onRemove={removeClient}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
