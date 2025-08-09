
-- 1) Create a secure RPC to create driver users (access codes) either for
-- the caller's destination (community_admin) or any destination (super_admin)

create or replace function public.create_driver_user(p_destination_id uuid default null)
returns table (
  id uuid,
  access_code uuid,
  role text,
  destination_id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  dest_id uuid;
  new_user public.users%rowtype;
begin
  -- Only community_admin or super_admin can create driver users
  if not (public.is_role('community_admin') or public.is_role('super_admin')) then
    raise exception 'Only community_admin or super_admin can create driver users' using errcode = '42501';
  end if;

  -- Determine the destination_id to use:
  -- - super_admin may pass any p_destination_id (required if creating for a specific destination)
  -- - community_admin must use their own destination (from JWT)
  if public.is_role('super_admin') then
    dest_id := p_destination_id; -- may be null if driver is not tied yet
  else
    dest_id := public.get_current_destination_id();
    if dest_id is null then
      raise exception 'Community admin has no destination bound' using errcode = '42501';
    end if;

    -- If a destination was passed by a community_admin, ensure it matches their own
    if p_destination_id is not null and p_destination_id <> dest_id then
      raise exception 'Not allowed to create driver for another destination' using errcode = '42501';
    end if;
  end if;

  insert into public.users (access_code, role, destination_id)
  values (gen_random_uuid(), 'driver', dest_id)
  returning * into new_user;

  return query
  select new_user.id, new_user.access_code, new_user.role, new_user.destination_id, new_user.created_at;
end;
$$;

-- 2) Ensure authenticated users can execute the function
grant execute on function public.create_driver_user(uuid) to authenticated;
