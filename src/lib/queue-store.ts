export type ClientStatus = "waiting" | "called" | "seated";

export type ClientTag = "criança" | "idoso" | "pcd";

export interface QueueClient {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  arrivalTime: number; // timestamp
  tags: ClientTag[];
  status: ClientStatus;
}

const STORAGE_KEY = "restaurant-queue";

export function loadQueue(): QueueClient[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveQueue(queue: QueueClient[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function getWaitingTime(arrivalTime: number): string {
  const minutes = Math.floor((Date.now() - arrivalTime) / 60000);
  if (minutes < 1) return "Agora";
  return `${minutes} min`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
