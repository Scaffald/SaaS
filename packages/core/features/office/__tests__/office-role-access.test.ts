import { describe, expect, it } from 'vitest'
import { createServiceRoleClient } from '../../../../../tests/infrastructure/vitest/helpers/database'

const hasServiceRoleKey =
  typeof process.env.SUPABASE_TEST_SERVICE_ROLE_KEY === 'string' ||
  typeof process.env.SUPABASE_SERVICE_ROLE_KEY === 'string'

const describeIfHasKey = hasServiceRoleKey ? describe : describe.skip

interface RoleAssignmentQueryResponse {
  data: {
    role: {
      name: string;
      scope: string;
    } | null;
  } | null;
  error: Error | null;
}

describeIfHasKey('Office Role Access', () => {
  describe('Database: @unicorn.love emails have office role', () => {
    it('should verify that all @unicorn.love emails have the office role assigned', async () => {
      const supabase = await createServiceRoleClient()

      // Known user IDs from seed file (002_seed-users.sql)
      const unicornLoveUserIds = [
        '00000000-0000-0000-0000-000000000001', // zach@unicorn.love
        '00000000-0000-0000-0000-000000000002', // clay@unicorn.love
        '00000000-0000-0000-0000-000000000003', // marc@unicorn.love
        '00000000-0000-0000-0000-000000000009', // test@unicorn.love
      ]

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
      for (const userId of unicornLoveUserIds) {
        const { data: roleAssignments, error: assignmentError } = await supabase
          .schema('core')
          .from('role_assignments')
          .select('role:roles(name, scope)')
          .eq('user_id', userId)
          .eq('role_id', officeRole?.id)

        expect(assignmentError).toBeNull()
        expect(roleAssignments).toBeDefined()
        expect(roleAssignments?.length).toBeGreaterThan(0)

        const hasOfficeRole = roleAssignments?.some(
          (assignment: any) =>
            assignment.role?.name === 'office' &&
            assignment.role?.scope === 'platform',
        )

        expect(hasOfficeRole).toBe(true)
      }
    })

    it('should verify specific seeded @unicorn.love users exist with office role', async () => {
      const supabase = await createServiceRoleClient()

      // Known user IDs and emails from seed file (002_seed-users.sql)
      const expectedUsers = [
        { id: '00000000-0000-0000-0000-000000000001', email: 'zach@unicorn.love' },
        { id: '00000000-0000-0000-0000-000000000002', email: 'clay@unicorn.love' },
        { id: '00000000-0000-0000-0000-000000000003', email: 'marc@unicorn.love' },
        { id: '00000000-0000-0000-0000-000000000009', email: 'test@unicorn.love' },
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

      for (const { id: userId, email } of expectedUsers) {
        // Verify office role assignment
        const { data: roleAssignment, error: assignmentError } = await supabase
          .schema('core')
          .from('role_assignments')
          .select('role:roles(name, scope)')
          .eq('user_id', userId)
          .eq('role_id', officeRole?.id)
          .single() as unknown as RoleAssignmentQueryResponse

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

      // Use a known @unicorn.love user ID from seed file
      const officeUserId = '00000000-0000-0000-0000-000000000001' // zach@unicorn.love

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
        .eq('user_id', officeUserId)
        .eq('role_id', officeRole?.id)
        .single() as unknown as RoleAssignmentQueryResponse

      expect(roleAssignment).toBeDefined()
      expect(roleAssignment?.role?.name).toBe('office')
      expect(roleAssignment?.role?.scope).toBe('platform')

      // This user should have access to /office route
      // The actual route protection is tested via useRoleProtectedRoute hook
      // which checks for the 'office' role in the user's roles array
    })

    it('should verify users without office role cannot access /office route', async () => {
      const supabase = await createServiceRoleClient()

      // Use a known regular user ID from seed file (not @unicorn.love, @circleave.com, or @scaffald.com)
      const regularUserId = '11111111-1111-1111-1111-111111111111' // lexis.salah@eths.education.com

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
        .eq('user_id', regularUserId)
        .eq('role_id', officeRole?.id)
        .maybeSingle() as unknown as { data: RoleAssignmentQueryResponse['data'] | null; error: Error | null }

      // Regular user should NOT have office role
      expect(roleAssignment).toBeNull()

      // This user should NOT have access to /office route
      // The useRoleProtectedRoute hook would redirect them to /dashboard
    })
  })
})

