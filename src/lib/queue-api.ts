import { supabase } from "@/lib/supabase";
import { QueueClient, ClientStatus, GaveUpReason } from "@/lib/queue-store";

/**
 * Formato da linha como ela existe na tabela `queue_clients` do Supabase.
 * Usa snake_case porque é a convenção do Postgres.
 */
interface QueueClientRow {
   id: string;
  name: string;
  phone: string;
  party_size: number;
  arrival_time: string;
  seated_time: string | null;
  archived_at: string | null;
  feedback_sent_at: string | null;
  gave_up_at: string | null;
  gave_up_reason: GaveUpReason | null;
  notes: string | null;
  status: ClientStatus;
}

/**
 * Avisos locais de mudança: toda alteração feita por este aparelho chama
 * notifyLocalChange() para a tela recarregar na hora, sem depender só do
 * realtime do Supabase.
 */
const localListeners = new Set<() => void>();

function notifyLocalChange() {
  localListeners.forEach((listener) => listener());
}

/** Converte um timestamp (ms) em ISO para o banco, ou null. */
function toIso(timestamp?: number | null): string | null {
  return timestamp ? new Date(timestamp).toISOString() : null;
}

/** Converte uma linha do banco (snake_case) para o formato usado no app (camelCase). */
function rowToClient(row: QueueClientRow): QueueClient {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    partySize: row.party_size,
    arrivalTime: new Date(row.arrival_time).getTime(),
    seatedTime: row.seated_time ? new Date(row.seated_time).getTime() : null,
    archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : null,
    feedbackSentAt: row.feedback_sent_at
      ? new Date(row.feedback_sent_at).getTime()
      : null,
    gaveUpAt: row.gave_up_at ? new Date(row.gave_up_at).getTime() : null,
    gaveUpReason: row.gave_up_reason,
    notes: row.notes ?? "",
    status: row.status,
  };
}

/** Busca a fila inteira (clientes ainda não removidos), ordenada por chegada. */
export async function fetchQueue(): Promise<QueueClient[]> {
  const { data, error } = await supabase
    .from("queue_clients")
    .select("*")
    .order("arrival_time", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar a fila: ${error.message}`);
  }

  return (data as QueueClientRow[]).map(rowToClient);
}

/** Insere um novo cliente na fila e retorna o registro criado pelo banco. */
export async function insertClient(
  client: Omit<QueueClient, "id">
): Promise<QueueClient> {
  const { data, error } = await supabase
    .from("queue_clients")
    .insert({
      name: client.name,
      phone: client.phone,
      party_size: client.partySize,
      arrival_time: new Date(client.arrivalTime).toISOString(),
      notes: client.notes,
      status: client.status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao adicionar cliente: ${error.message}`);
  }

  notifyLocalChange();
  return rowToClient(data as QueueClientRow);
}

/** Atualiza campos de um cliente existente. */
export async function updateClientRow(
  id: string,
  updatedData: Partial<QueueClient>
): Promise<void> {
  const payload: Record<string, unknown> = {};

  if (updatedData.name !== undefined) payload.name = updatedData.name;
if (updatedData.phone !== undefined) payload.phone = updatedData.phone;
if (updatedData.partySize !== undefined) payload.party_size = updatedData.partySize;
if (updatedData.notes !== undefined) payload.notes = updatedData.notes;
if (updatedData.status !== undefined) payload.status = updatedData.status;

if (updatedData.seatedTime !== undefined) {
  payload.seated_time = updatedData.seatedTime
    ? new Date(updatedData.seatedTime).toISOString()
    : null;
}

if (updatedData.archivedAt !== undefined) {
  payload.archived_at = updatedData.archivedAt
    ? new Date(updatedData.archivedAt).toISOString()
    : null;
}

if (updatedData.feedbackSentAt !== undefined) {
  payload.feedback_sent_at = toIso(updatedData.feedbackSentAt);
}

if (updatedData.gaveUpAt !== undefined) {
  payload.gave_up_at = toIso(updatedData.gaveUpAt);
}

if (updatedData.gaveUpReason !== undefined) {
  payload.gave_up_reason = updatedData.gaveUpReason;
}

  const { error } = await supabase
    .from("queue_clients")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao atualizar cliente: ${error.message}`);
  }

  notifyLocalChange();
}

/** Remove um cliente da fila definitivamente. */
export async function deleteClientRow(id: string): Promise<void> {
  const { error } = await supabase.from("queue_clients").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao remover cliente: ${error.message}`);
  }

  notifyLocalChange();
}

/** Reinsere um cliente removido (usado pelo "Desfazer"). */
export async function restoreClient(client: QueueClient): Promise<QueueClient> {
  const { data, error } = await supabase
    .from("queue_clients")
    .insert({
      id: client.id,
      name: client.name,
      phone: client.phone,
      party_size: client.partySize,
      arrival_time: new Date(client.arrivalTime).toISOString(),
      seated_time: client.seatedTime
        ? new Date(client.seatedTime).toISOString()
        : null,
      archived_at: toIso(client.archivedAt),
      feedback_sent_at: toIso(client.feedbackSentAt),
      gave_up_at: toIso(client.gaveUpAt),
      gave_up_reason: client.gaveUpReason ?? null,
      notes: client.notes,
      status: client.status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao restaurar cliente: ${error.message}`);
  }

  notifyLocalChange();
  return rowToClient(data as QueueClientRow);
}

/**
 * Assina mudanças em tempo real na tabela da fila.
 * Toda vez que qualquer dispositivo inserir, atualizar ou remover um
 * cliente, o `callback` é chamado para que a tela possa se atualizar.
 */
export function subscribeToQueue(callback: () => void): () => void {
  localListeners.add(callback);

  // O realtime precisa do token do usuário logado, senão o RLS bloqueia
  // os eventos (a tabela não é mais pública).
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) supabase.realtime.setAuth(data.session.access_token);
  });

  const channel = supabase
    .channel("queue_clients_changes")
    .on(
      "postgres_changes" as never,
      { event: "*", schema: "public", table: "queue_clients" },
      callback
    )
    .subscribe();

  return () => {
    localListeners.delete(callback);
    supabase.removeChannel(channel);
  };
}
export async function archiveSeatedClients(): Promise<void> {
  const { error } = await supabase
    .from("queue_clients")
    .update({
      archived_at: new Date().toISOString(),
    })
    .in("status", ["seated", "gave_up"])
    .is("archived_at", null);

  if (error) {
    throw new Error(`Erro ao limpar atendidos: ${error.message}`);
  }

  notifyLocalChange();
}
