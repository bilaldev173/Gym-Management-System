create extension if not exists "pgcrypto";

create table public.members (
                                id uuid primary key default gen_random_uuid(),
                                full_name text not null,
                                email text unique,
                                phone text unique,
                                status text not null default 'active'
                                    check (status in ('active', 'inactive')),
                                join_date date not null default current_date,
                                created_at timestamptz default now(),
                                updated_at timestamptz default now()
);


create table public.membership_plans (
                                         id uuid primary key default gen_random_uuid(),
                                         name text not null unique,
                                         price numeric(10,2) not null,
                                         duration_days integer not null,
                                         description text,
                                         created_at timestamptz default now()
);


create table public.subscriptions (
                                      id uuid primary key default gen_random_uuid(),

                                      member_id uuid not null
                                          references public.members(id)
                                              on delete cascade,

                                      plan_id uuid not null
                                          references public.membership_plans(id),

                                      start_date date not null default current_date,
                                      end_date date not null,

                                      status text not null default 'active'
                                          check (status in ('active','expired','cancelled')),

                                      created_at timestamptz default now()
);


create table public.check_ins (
                                  id uuid primary key default gen_random_uuid(),

                                  member_id uuid not null
                                      references public.members(id)
                                          on delete cascade,

                                  check_in_time timestamptz default now()
);


create table public.payments (
                                 id uuid primary key default gen_random_uuid(),

                                 member_id uuid not null
                                     references public.members(id)
                                         on delete cascade,

                                 subscription_id uuid
                                                references public.subscriptions(id)
                                                    on delete set null,

                                 amount numeric(10,2) not null,

                                 payment_method text
                                     check (payment_method in ('cash','card','transfer')),

                                 payment_date timestamptz default now(),

                                 notes text
);


create table public.profiles (
                                 id uuid primary key references auth.users(id),

                                 full_name text,

                                 role text not null default 'staff'
                                     check (role in ('admin','staff')),

                                 created_at timestamptz default now()
);


create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
return new;
end;
$$;


create trigger members_updated_at
    before update on public.members
    for each row
    execute function public.handle_updated_at();


alter table public.members enable row level security;
alter table public.membership_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.check_ins enable row level security;
alter table public.payments enable row level security;
alter table public.profiles enable row level security;



create policy "Allow all members access"
on public.members
for all
using (true)
with check (true);


   create policy "Allow all plans access"
on public.membership_plans
for all
using (true)
with check (true);


    create policy "Allow all subscriptions access"
on public.subscriptions
for all
using (true)
with check (true);


 create policy "Allow all checkins access"
on public.check_ins
for all
using (true)
with check (true);


 create policy "Allow all payments access"
on public.payments
for all
using (true)
with check (true);


   create policy "Allow all profiles access"
on public.profiles
for all
using (true)
with check (true);


insert into public.membership_plans
(name, price, duration_days, description)
values
    ('Monthly', 300, 30, 'Monthly membership'),
    ('Quarterly', 800, 90, '3-month membership'),
    ('Annual', 3000, 365, '12-month membership');















