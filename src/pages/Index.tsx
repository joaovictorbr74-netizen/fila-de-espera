import { useState, useCallback, useEffect } from "react";
import { QueueClient, loadQueue, saveQueue } from "@/lib/queue-store";
import QueueForm from "@/components/QueueForm";
import QueueList from "@/components/QueueList";
import { toast } from "sonner";
import { UtensilsCrossed } from "lucide-react";

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
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="w-8 h-8 text-primary" />
          <h1 className="font-display text-3xl text-foreground">
            Fila <span className="text-primary">Premium</span>
          </h1>
        </div>
        <span className="text-muted-foreground text-sm">
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
        <div className="w-[380px] flex-shrink-0 border-r border-border p-6 overflow-y-auto">
          <QueueForm onAdd={addClient} />
        </div>

        {/* Right - Queue */}
        <div className="flex-1 p-6 overflow-hidden">
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
