-- Tablas para el panel de JFA Bolsas. Pegar entero en Supabase > SQL Editor > Run.
-- Antes de correrlo, reemplazá el email de abajo por el que va a usar tu papá para entrar.

create table if not exists admins (email text primary key);
insert into admins (email) values ('EMAIL_DE_TU_PAPA@gmail.com') on conflict do nothing;

-- Todo lo del panel (pedidos, clientes, pagos, gastos, precios). Solo lo ven los admins.
create table if not exists estado (
  id int primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Lo que lee el cotizador de la página: precios y bolsas pendientes. Sin datos de clientes.
create table if not exists publico (
  id int primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table admins enable row level security;
alter table estado enable row level security;
alter table publico enable row level security;

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = auth.jwt() ->> 'email');
$$;

drop policy if exists "admins usan el panel" on estado;
create policy "admins usan el panel" on estado
  for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists "cualquiera lee precios" on publico;
create policy "cualquiera lee precios" on publico
  for select to anon, authenticated using (true);

drop policy if exists "admins publican precios" on publico;
create policy "admins publican precios" on publico
  for insert to authenticated with check (es_admin());

drop policy if exists "admins actualizan precios" on publico;
create policy "admins actualizan precios" on publico
  for update to authenticated using (es_admin()) with check (es_admin());
