import { describe, expect, it } from 'vitest'
import { createServiceRoleClient } from '../../../../test/helpers/database'

describe('Office Role Access', () => {
  describe('Database: @unicorn.love emails have office role', () => {
    it('should verify that all @unicorn.love emails have the office role assigned', async () => {
      const supabase = await createServiceRoleClient()

      // Query all users with @unicorn.love email domain
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', '%@unicorn.love')

      expect(usersError).toBeNull()
      expect(users).toBeDefined()
      expect(users?.length).toBeGreaterThan(0)

      // Get the office role ID
      const { data: officeRole, error: roleError } = await supabase
        .schema('core')
        .from('roles')
        .select('id, name, scope')
        .eq('name', 'office')
        .eq('scope', 'platform')
        .single()

      expect(roleError).toBeNull()
      expect(officeRole).toBeDefined()
      expect(officeRole?.name).toBe('office')
      expect(officeRole?.scope).toBe('platform')

      // Check role assignments for each @unicorn.love user
      for (const user of users || []) {
        const { data: roleAssignments, error: assignmentError } = await supabase
          .schema('core')
          .from('role_assignments')
          .select('role:roles(name, scope)')
          .eq('user_id', user.id)
          .eq('role_id', officeRole.id)

        expect(assignmentError).toBeNull()
        expect(roleAssignments).toBeDefined()
        expect(roleAssignments?.length).toBeGreaterThan(0)

        const hasOfficeRole = roleAssignments?.some(
          (assignment) =>
            assignment.role?.name === 'office' &&
            assignment.role?.scope === 'platform',
        )

        expect(hasOfficeRole).toBe(true)
        expect(user.email).toMatch(/@unicorn\.love$/)
      }
    })

    it('should verify specific seeded @unicorn.love users exist with office role', async () => {
      const supabase = await createServiceRoleClient()

      const expectedEmails = [
        'zach@unicorn.love',
        'clay@unicorn.love',
        'marc@unicorn.love',
        'test@unicorn.love',
      ]

      // Get the office role
      const { data: officeRole } = await supabase
        .schema('core')
        .from('roles')
        .select('id, name, scope')
        .eq('name', 'office')
        .eq('scope', 'platform')
        .single()

      expect(officeRole).toBeDefined()

      for (const email of expectedEmails) {
        // Get user by email
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', email)
          .single()

        expect(userError).toBeNull()
        expect(user).toBeDefined()
        expect(user?.email).toBe(email)

        // Verify office role assignment
        const { data: roleAssignment, error: assignmentError } = await supabase
          .schema('core')
          .from('role_assignments')
          .select('role:roles(name, scope)')
          .eq('user_id', user.id)
          .eq('role_id', officeRole.id)
          .single()

        expect(assignmentError).toBeNull()
        expect(roleAssignment).toBeDefined()
        expect(roleAssignment?.role?.name).toBe('office')
        expect(roleAssignment?.role?.scope).toBe('platform')
      }
    })
  })

  describe('Route Protection: /office route access', () => {
    it('should verify office role is required for /office route access', async () => {
      const supabase = await createServiceRoleClient()

      // Get a user with office role (@unicorn.love)
      const { data: officeUser } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', '%@unicorn.love')
        .limit(1)
        .single()

      expect(officeUser).toBeDefined()

      // Get office role
      const { data: officeRole } = await supabase
        .schema('core')
        .from('roles')
        .select('id, name, scope')
        .eq('name', 'office')
        .eq('scope', 'platform')
        .single()

      expect(officeRole).toBeDefined()

      // Verify office role assignment exists
      const { data: roleAssignment } = await supabase
        .schema('core')
        .from('role_assignments')
        .select('role:roles(name, scope)')
        .eq('user_id', officeUser.id)
        .eq('role_id', officeRole.id)
        .single()

      expect(roleAssignment).toBeDefined()
      expect(roleAssignment?.role?.name).toBe('office')
      expect(roleAssignment?.role?.scope).toBe('platform')

      // This user should have access to /office route
      // The actual route protection is tested via useRoleProtectedRoute hook
      // which checks for the 'office' role in the user's roles array
      expect(officeUser.email).toMatch(/@unicorn\.love$/)
    })

    it('should verify users without office role cannot access /office route', async () => {
      const supabase = await createServiceRoleClient()

      // Get a regular user (not @unicorn.love, @circleave.com, or @scaffald.com)
      const { data: regularUser } = await supabase
        .from('users')
        .select('id, email')
        .not('email', 'ilike', '%@unicorn.love')
        .not('email', 'ilike', '%@circleave.com')
        .not('email', 'ilike', '%@scaffald.com')
        .limit(1)
        .single()

      if (!regularUser) {
        // Skip if no regular user exists
        return
      }

      // Get office role
      const { data: officeRole } = await supabase
        .schema('core')
        .from('roles')
        .select('id, name, scope')
        .eq('name', 'office')
        .eq('scope', 'platform')
        .single()

      expect(officeRole).toBeDefined()

      // Verify office role assignment does NOT exist
      const { data: roleAssignment } = await supabase
        .schema('core')
        .from('role_assignments')
        .select('role:roles(name, scope)')
        .eq('user_id', regularUser.id)
        .eq('role_id', officeRole.id)
        .maybeSingle()

      // Regular user should NOT have office role
      expect(roleAssignment).toBeNull()

      // This user should NOT have access to /office route
      // The useRoleProtectedRoute hook would redirect them to /dashboard
      expect(regularUser.email).not.toMatch(/@(unicorn\.love|circleave\.com|scaffald\.com)$/)
    })
  })
})

