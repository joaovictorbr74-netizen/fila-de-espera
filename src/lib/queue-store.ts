export type ClientStatus = "waiting" | "called" | "seated" | "gave_up";

/** Motivo da desistência: avisou que não vem, ou foi chamado e não apareceu. */
export type GaveUpReason = "desistiu" | "nao_apareceu";

export const GAVE_UP_LABELS: Record<GaveUpReason, string> = {
  desistiu: "Desistiu",
  nao_apareceu: "Não apareceu",
};

export interface QueueClient {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  arrivalTime: number;
  seatedTime?: number | null;
  archivedAt?: number | null;
  feedbackSentAt?: number | null;
  gaveUpAt?: number | null;
  gaveUpReason?: GaveUpReason | null;
  notes: string;
  status: ClientStatus;
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
    (c) =>
      c.id !== excludeId &&
      (c.status === "waiting" || c.status === "called") &&
      onlyDigits(c.phone) === digits
  );
}

/** Monta a mensagem padrão enviada via WhatsApp ao chamar o cliente. */
export function buildCallMessage(
  clientName: string,
  restaurantName: string
): string {
  return [
    `Olá, ${clientName}!`,
    "",
    `Sua mesa na ${restaurantName} está pronta.`,
    "",
    "Por favor, dirija-se à recepção para ser acomodado.",
    "",
    "Aguardamos você!",
  ].join("\n");
}
/** Abre o WhatsApp do cliente com a mensagem já escrita. */
export function openWhatsApp(phone: string, message: string): boolean {
  const digits = onlyDigits(phone);
  if (!digits) return false;

  const url = `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

/** Mensagem de agradecimento pedindo avaliação, enviada depois que o cliente sentou. */
export function buildFeedbackMessage(
  clientName: string,
  restaurantName: string,
  reviewUrl: string
): string {
  const lines = [
    `Oi, ${clientName}! 🧡`,
    "",
    `Ficamos muito felizes com a sua visita ao ${restaurantName} hoje. Obrigado por dividir essa noite com a gente!`,
    "",
  ];

  if (reviewUrl) {
    lines.push(
      "Se puder, conta pra gente como foi a sua experiência. Leva menos de um minuto e ajuda muito o nosso trabalho:",
      "",
      `⭐ ${reviewUrl}`,
      ""
    );
  } else {
    lines.push("Se puder, conta pra gente como foi a sua experiência!", "");
  }

  lines.push("Esperamos você de volta em breve!", `Equipe ${restaurantName}`);
  return lines.join("\n");
}
