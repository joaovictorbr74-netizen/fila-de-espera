import { QueueClient, getWaitingTime, formatTime } from "@/lib/queue-store";
import { Button } from "@/components/ui/button";
import { Clock, Users, X, Bell, Check } from "lucide-react";
import { useEffect, useState } from "react";

interface QueueCardProps {
  client: QueueClient;
  position: number;
  onCall: (id: string) => void;
  onSeat: (id: string) => void;
  onRemove: (id: string) => void;
}

const statusConfig = {
  waiting: {
    label: "Aguardando",
    className: "bg-status-waiting/20 text-status-waiting border-status-waiting/30",
    dot: "bg-status-waiting",
  },
  called: {
    label: "Chamado",
    className: "bg-status-called/20 text-status-called border-status-called/30",
    dot: "bg-status-called",
  },
  seated: {
    label: "Sentou",
    className: "bg-status-seated/20 text-status-seated border-status-seated/30",
    dot: "bg-status-seated",
  },
};

export default function QueueCard({ client, position, onCall, onSeat, onRemove }: QueueCardProps) {
  const [waitTime, setWaitTime] = useState(getWaitingTime(client.arrivalTime));
  const config = statusConfig[client.status];

  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime(getWaitingTime(client.arrivalTime));
    }, 10000);
    return () => clearInterval(interval);
  }, [client.arrivalTime]);

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 transition-all hover:border-primary/30">
      {/* Position */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground">
        {position}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-semibold text-foreground truncate">{client.name}</span>
          {client.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" /> {client.partySize}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> {formatTime(client.arrivalTime)}
          </span>
          <span className="font-medium text-foreground">⏱ {waitTime}</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`px-3 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-1.5 ${config.className}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        {config.label}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {client.status === "waiting" && (
          <Button
            onClick={() => onCall(client.id)}
            className="h-12 px-5 text-base font-bold bg-status-called hover:bg-status-called/80 text-background"
          >
            <Bell className="w-5 h-5 mr-1" />
            CHAMAR
          </Button>
        )}
        {client.status === "called" && (
          <Button
            onClick={() => onSeat(client.id)}
            className="h-12 px-5 text-base font-bold bg-status-seated hover:bg-status-seated/80 text-background"
          >
            <Check className="w-5 h-5 mr-1" />
            SENTOU
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => onRemove(client.id)}
          className="h-12 w-12 border-border text-muted-foreground hover:text-destructive hover:border-destructive"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
