-- Fix infinite recursion in role_assignments policies
-- The issue is that the policy queries role_assignments from within a policy on role_assignments

begin;

-- Drop the problematic policies
drop policy if exists "role_assignments_select_visible" on public.role_assignments;
drop policy if exists "role_assignments_insert_admins" on public.role_assignments;
drop policy if exists "role_assignments_delete_admins" on public.role_assignments;

-- Create a simpler, non-recursive policy for role_assignments
create policy "role_assignments_select_own"
  on public.role_assignments
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or scope_org_id in (
      select o.id
      from public.organizations o
      where o.owner_user_id = auth.uid()
    )
  );

create policy "role_assignments_insert_own"
  on public.role_assignments
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or scope_org_id in (
      select o.id
      from public.organizations o
      where o.owner_user_id = auth.uid()
    )
  );

create policy "role_assignments_delete_own"
  on public.role_assignments
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or scope_org_id in (
      select o.id
      from public.organizations o
      where o.owner_user_id = auth.uid()
    )
  );

commit;
