export type ClientStatus = "waiting" | "called" | "seated";

export interface QueueClient {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  arrivalTime: number;
  notes: string;
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

/**
 * Aplica a máscara de telefone brasileiro (11) 98765-4321
 * enquanto o usuário digita. Sempre limita a 11 dígitos.
 */
export function maskPhone(rawValue: string): string {
  const value = rawValue.replace(/\D/g, "").slice(0, 11);

  if (value.length <= 2) {
    return value;
  }
  if (value.length <= 7) {
    return `(${value.slice(0, 2)}) ${value.slice(2)}`;
  }
  return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
}

/** Retorna apenas os dígitos do telefone. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Um telefone brasileiro válido (com DDD + celular) tem 11 dígitos. */
export function isValidPhone(value: string): boolean {
  return onlyDigits(value).length === 11;
}

/**
 * Verifica se já existe outro cliente na fila com o mesmo telefone.
 * `excludeId` permite ignorar o próprio cliente ao editar.
 */
export function findDuplicatePhone(
  queue: QueueClient[],
  phone: string,
  excludeId?: string
): QueueClient | undefined {
  const digits = onlyDigits(phone);
  return queue.find(
    (c) => c.id !== excludeId && onlyDigits(c.phone) === digits
  );
}

/** Monta a mensagem padrão enviada via WhatsApp ao chamar o cliente. */
export function buildCallMessage(clientName: string, restaurantName: string): string {
  return `Olá ${clientName}! 😊\n\nSua mesa na ${restaurantName} está pronta.\n\nPor favor, dirija-se à recepção.\n\nAguardamos você! 🍕`;
}