import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server'

describe('Teams', () => {
  let client: Scaffald

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
    client = new Scaffald({
      apiKey: 'test_key',
      baseUrl: 'https://api.scaffald.com',
    })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  // ===== Core Operations =====

  describe('list()', () => {
    it('should list teams', async () => {
      const result = await client.teams.list()

      expect(result).toBeDefined()
      expect(result.teams).toBeInstanceOf(Array)
      expect(result.teams).toHaveLength(2)
    })

    it('should include full team details', async () => {
      const result = await client.teams.list()

      const team = result.teams[0]
      expect(team.id).toBe('team_1')
      expect(team.organizationId).toBe('org_1')
      expect(team.name).toBe('Engineering Hiring Team')
      expect(team.slug).toBe('eng-hiring')
      expect(team.purpose).toBe('Hire software engineers')
      expect(team.visibility).toBe('organization')
      expect(team.invitationPolicy).toBe('invite_only')
      expect(team.defaultRole).toEqual({
        id: 'role_1',
        key: 'member',
        name: 'Member',
      })
    })

    it('should handle optional list parameters', async () => {
      const result = await client.teams.list({
        organizationId: 'org_1',
        includeArchived: true,
      })

      expect(result).toBeDefined()
      expect(result.teams).toBeInstanceOf(Array)
    })
  })

  describe('retrieve()', () => {
    it('should retrieve a team by ID', async () => {
      const result = await client.teams.retrieve('team_123')

      expect(result).toBeDefined()
      expect(result.team).toBeDefined()
      expect(result.team.id).toBe('team_123')
      expect(result.team.name).toBe('Engineering Hiring Team')
    })

    it('should include team configuration settings', async () => {
      const result = await client.teams.retrieve('team_123')

      const { team } = result
      expect(team.allowSelfJoin).toBe(false)
      expect(team.autoAssignJobs).toBe(true)
      expect(team.invitationExpirationDays).toBe(7)
      expect(team.workloadStrategy).toBe('auto_balanced')
      expect(team.analyticsRefreshIntervalMinutes).toBe(60)
    })
  })

  describe('create()', () => {
    it('should create a new team', async () => {
      const result = await client.teams.create({
        organizationId: 'org_1',
        name: 'Product Hiring Team',
        purpose: 'Hire product managers',
        visibility: 'organization',
        invitationPolicy: 'invite_only',
      })

      expect(result).toBeDefined()
      expect(result.team).toBeDefined()
      expect(result.team.id).toBe('team_new_123')
      expect(result.team.name).toBe('Product Hiring Team')
      expect(result.team.organizationId).toBe('org_1')
    })

    it('should create team with minimal params', async () => {
      const result = await client.teams.create({
        organizationId: 'org_1',
        name: 'Simple Team',
      })

      expect(result).toBeDefined()
      expect(result.team.id).toBeDefined()
      expect(result.team.visibility).toBe('organization') // default
      expect(result.team.invitationPolicy).toBe('invite_only') // default
    })

    it('should create team with full configuration', async () => {
      const result = await client.teams.create({
        organizationId: 'org_1',
        name: 'Advanced Team',
        slug: 'advanced',
        purpose: 'Advanced hiring',
        description: 'Full featured team',
        allowSelfJoin: true,
        autoAssignJobs: true,
        workloadStrategy: 'auto_round_robin',
        invitationExpirationDays: 14,
      })

      expect(result).toBeDefined()
      expect(result.team.name).toBe('Advanced Team')
    })
  })

  describe('update()', () => {
    it('should update a team', async () => {
      const result = await client.teams.update('team_123', {
        name: 'Updated Team Name',
        description: 'Updated description',
      })

      expect(result).toBeDefined()
      expect(result.team).toBeDefined()
      expect(result.team.id).toBe('team_123')
      // updatedAt should be recent
      const updatedTime = new Date(result.team.updatedAt).getTime()
      expect(updatedTime).toBeGreaterThan(Date.now() - 5000)
    })

    it('should update team configuration', async () => {
      const result = await client.teams.update('team_123', {
        allowSelfJoin: true,
        autoAssignJobs: false,
        workloadStrategy: 'manual',
      })

      expect(result).toBeDefined()
      expect(result.team).toBeDefined()
    })
  })

  describe('archive()', () => {
    it('should archive a team', async () => {
      const result = await client.teams.archive('team_123')

      expect(result).toBeDefined()
      expect(result.team).toBeDefined()
      expect(result.team.id).toBe('team_123')
      expect(result.team.isArchived).toBe(true)
      expect(result.team.archivedAt).toBeDefined()
      expect(result.team.archivedBy).toBe('user_1')
    })

    it('should archive team with reason', async () => {
      const result = await client.teams.archive('team_123', {
        reason: 'Hiring season ended',
      })

      expect(result).toBeDefined()
      expect(result.team.isArchived).toBe(true)
    })
  })

  // ===== Member Management =====

  describe('listMembers()', () => {
    it('should list team members', async () => {
      const result = await client.teams.listMembers('team_123')

      expect(result).toBeDefined()
      expect(result.members).toBeInstanceOf(Array)
      expect(result.members).toHaveLength(2)
    })

    it('should include member details with roles and users', async () => {
      const result = await client.teams.listMembers('team_123')

      const member = result.members[0]
      expect(member.id).toBe('member_1')
      expect(member.teamId).toBe('team_1')
      expect(member.userId).toBe('user_1')
      expect(member.status).toBe('active')
      expect(member.role).toEqual({
        id: 'role_admin',
        key: 'admin',
        name: 'Team Admin',
      })
      expect(member.user).toEqual({
        id: 'user_1',
        displayName: 'Alice Johnson',
        username: 'alice',
        avatarPath: '/avatars/alice.jpg',
      })
    })
  })

  describe('addMember()', () => {
    it('should add a member to the team', async () => {
      const result = await client.teams.addMember('team_123', {
        userId: 'user_3',
        roleKey: 'recruiter',
      })

      expect(result).toBeDefined()
      expect(result.member).toBeDefined()
      expect(result.member.id).toBe('member_new_123')
      expect(result.member.teamId).toBe('team_123')
      expect(result.member.userId).toBe('user_3')
      expect(result.member.status).toBe('active')
    })

    it('should add member with metadata', async () => {
      const result = await client.teams.addMember('team_123', {
        userId: 'user_4',
        roleKey: 'reviewer',
        metadata: { department: 'engineering' },
      })

      expect(result).toBeDefined()
      expect(result.member).toBeDefined()
    })
  })

  describe('updateMember()', () => {
    it('should update a team member', async () => {
      const result = await client.teams.updateMember('team_123', 'user_2', {
        roleKey: 'lead',
        status: 'active',
      })

      expect(result).toBeDefined()
      expect(result.member).toBeDefined()
      expect(result.member.userId).toBe('user_2')
    })
  })

  describe('removeMember()', () => {
    it('should remove a member from the team', async () => {
      const result = await client.teams.removeMember('team_123', 'user_2')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should remove member with reason', async () => {
      const result = await client.teams.removeMember('team_123', 'user_2', {
        reason: 'Role ended',
      })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  // ===== Invitation Management =====

  describe('listInvitations()', () => {
    it('should list team invitations', async () => {
      const result = await client.teams.listInvitations('team_123')

      expect(result).toBeDefined()
      expect(result.invitations).toBeInstanceOf(Array)
      expect(result.invitations).toHaveLength(1)
    })

    it('should include invitation details', async () => {
      const result = await client.teams.listInvitations('team_123')

      const invitation = result.invitations[0]
      expect(invitation.id).toBe('inv_1')
      expect(invitation.teamId).toBe('team_1')
      expect(invitation.email).toBe('newrecruiter@example.com')
      expect(invitation.status).toBe('pending')
      expect(invitation.role).toEqual({
        id: 'role_recruiter',
        key: 'recruiter',
        name: 'Recruiter',
      })
      expect(invitation.team).toEqual({
        id: 'team_1',
        name: 'Engineering Hiring Team',
        organizationId: 'org_1',
        organizationName: 'ACME Corporation',
      })
    })
  })

  describe('inviteMember()', () => {
    it('should invite a member to the team', async () => {
      const result = await client.teams.inviteMember('team_123', {
        email: 'newuser@example.com',
        roleKey: 'member',
        message: 'Join our team!',
      })

      expect(result).toBeDefined()
      expect(result.invitation).toBeDefined()
      expect(result.invitation.id).toBe('inv_new_123')
      expect(result.invitation.email).toBe('newuser@example.com')
      expect(result.invitation.status).toBe('pending')
    })

    it('should invite member with minimal params', async () => {
      const result = await client.teams.inviteMember('team_123', {
        email: 'simple@example.com',
      })

      expect(result).toBeDefined()
      expect(result.invitation.email).toBe('simple@example.com')
    })
  })

  describe('cancelInvitation()', () => {
    it('should cancel a team invitation', async () => {
      const result = await client.teams.cancelInvitation('team_123', 'inv_456')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  // ===== User-Facing Invitation Operations =====

  describe('listMyInvitations()', () => {
    it('should list invitations for the current user', async () => {
      const result = await client.teams.listMyInvitations()

      expect(result).toBeDefined()
      expect(result.invitations).toBeInstanceOf(Array)
      expect(result.invitations).toHaveLength(2)
    })

    it('should filter invitations by status', async () => {
      const result = await client.teams.listMyInvitations({ status: 'pending' })

      expect(result).toBeDefined()
      expect(result.invitations).toBeInstanceOf(Array)
      // All invitations should be pending
      result.invitations.forEach((inv) => {
        expect(inv.status).toBe('pending')
      })
    })

    it('should include team and organization details', async () => {
      const result = await client.teams.listMyInvitations()

      const invitation = result.invitations[0]
      expect(invitation.id).toBe('inv_1')
      expect(invitation.teamId).toBe('team_1')
      expect(invitation.status).toBe('pending')
      expect(invitation.team).toEqual({
        id: 'team_1',
        name: 'Engineering Hiring Team',
        organizationId: 'org_1',
        organizationName: 'Acme Corp',
      })
      expect(invitation.role).toEqual({
        id: 'role_1',
        key: 'member',
        name: 'Member',
      })
    })
  })

  describe('respondToInvitation()', () => {
    it('should accept an invitation', async () => {
      const result = await client.teams.respondToInvitation('inv_123', { action: 'accept' })

      expect(result).toBeDefined()
      expect(result.invitation).toBeDefined()
      expect(result.invitation.id).toBe('inv_123')
      expect(result.invitation.status).toBe('accepted')
    })

    it('should decline an invitation', async () => {
      const result = await client.teams.respondToInvitation('inv_456', { action: 'decline' })

      expect(result).toBeDefined()
      expect(result.invitation).toBeDefined()
      expect(result.invitation.id).toBe('inv_456')
      expect(result.invitation.status).toBe('declined')
    })
  })

  // ===== Job Assignment Management =====

  describe('listJobAssignments()', () => {
    it('should list team job assignments', async () => {
      const result = await client.teams.listJobAssignments('team_123')

      expect(result).toBeDefined()
      expect(result.assignments).toBeInstanceOf(Array)
      expect(result.assignments).toHaveLength(2)
    })

    it('should include job assignment details', async () => {
      const result = await client.teams.listJobAssignments('team_123')

      const assignment = result.assignments[0]
      expect(assignment.id).toBe('assignment_1')
      expect(assignment.teamId).toBe('team_1')
      expect(assignment.jobId).toBe('job_1')
      expect(assignment.isPrimary).toBe(true)
      expect(assignment.assignedBy).toBe('user_1')
      expect(assignment.job).toEqual({
        id: 'job_1',
        title: 'Senior Software Engineer',
        status: 'published',
        organizationId: 'org_1',
      })
    })

    it('should distinguish primary and secondary assignments', async () => {
      const result = await client.teams.listJobAssignments('team_123')

      const primary = result.assignments.filter((a) => a.isPrimary)
      const secondary = result.assignments.filter((a) => !a.isPrimary)

      expect(primary).toHaveLength(1)
      expect(secondary).toHaveLength(1)
    })
  })

  describe('createJobAssignment()', () => {
    it('should create a job assignment', async () => {
      const result = await client.teams.createJobAssignment('team_123', {
        jobId: 'job_3',
        isPrimary: true,
      })

      expect(result).toBeDefined()
      expect(result.assignment).toBeDefined()
      expect(result.assignment.id).toBe('assignment_new_123')
      expect(result.assignment.teamId).toBe('team_123')
      expect(result.assignment.jobId).toBe('job_3')
      expect(result.assignment.isPrimary).toBe(true)
    })

    it('should create assignment with default isPrimary', async () => {
      const result = await client.teams.createJobAssignment('team_123', {
        jobId: 'job_4',
      })

      expect(result).toBeDefined()
      expect(result.assignment.isPrimary).toBe(false) // default
    })
  })

  describe('deleteJobAssignment()', () => {
    it('should delete a job assignment', async () => {
      const result = await client.teams.deleteJobAssignment('team_123', 'assignment_456')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })
})
