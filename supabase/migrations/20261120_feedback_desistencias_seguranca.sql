-- Fila de espera Bamboo: feedback, desistências e segurança
--
-- 1. Colunas novas para feedback e desistências
-- 2. Status "gave_up" (desistência)
-- 3. Troca as regras públicas (anon) por regras só para usuários logados
-- 4. Fecha a função rls_auto_enable para a API

-- 1. Colunas novas -----------------------------------------------------------
alter table public.queue_clients
  add column if not exists feedback_sent_at timestamptz,
  add column if not exists gave_up_at timestamptz,
  add column if not exists gave_up_reason text;

alter table public.queue_clients
  drop constraint if exists queue_clients_gave_up_reason_check;

alter table public.queue_clients
  add constraint queue_clients_gave_up_reason_check
  check (gave_up_reason is null or gave_up_reason in ('desistiu', 'nao_apareceu'));

-- 2. Status de desistência ---------------------------------------------------
alter table public.queue_clients
  drop constraint if exists queue_clients_status_check;

alter table public.queue_clients
  add constraint queue_clients_status_check
  check (status in ('waiting', 'called', 'seated', 'gave_up'));

-- 3. Segurança: só quem está logado acessa a fila ----------------------------
alter table public.queue_clients enable row level security;

drop policy if exists "Permitir leitura pública" on public.queue_clients;
drop policy if exists "Permitir insercao publica" on public.queue_clients;
drop policy if exists "Permitir atualizacao publica" on public.queue_clients;
drop policy if exists "Permitir remocao publica" on public.queue_clients;

drop policy if exists "Recepcao pode ler" on public.queue_clients;
drop policy if exists "Recepcao pode inserir" on public.queue_clients;
drop policy if exists "Recepcao pode atualizar" on public.queue_clients;
drop policy if exists "Recepcao pode remover" on public.queue_clients;

create policy "Recepcao pode ler"
  on public.queue_clients for select
  to authenticated
  using (true);

create policy "Recepcao pode inserir"
  on public.queue_clients for insert
  to authenticated
  with check (true);

create policy "Recepcao pode atualizar"
  on public.queue_clients for update
  to authenticated
  using (true)
  with check (true);

create policy "Recepcao pode remover"
  on public.queue_clients for delete
  to authenticated
  using (true);

revoke all on table public.queue_clients from anon;
grant select, insert, update, delete on table public.queue_clients to authenticated;

-- 4. Função interna que não deve ser chamada pela API ------------------------
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
