/**
 * Manager Dashboard Service
 * Task Severity Correlation with Compliance Risk
 * Service layer for dashboard API endpoints and data aggregation
 */

import type {
  DashboardOverview,
  SubcontractorScore,
  TaskSummary,
  ExpiringPolicy,
  ActivityEvent,
  ComplianceTrendData,
  DrillDownData,
  SubcontractorDetail,
  DashboardFilters,
  ExportConfig,
  RiskDistribution,
  TaskSeveritySummary,
  ClientRiskProfile,
} from './types'
import type {
  Task,
  PolicyData,
  ComplianceRecord,
  Project,
  BrokerClient,
  TaskSeverity,
} from '../../../types'
import {
  enrichTasksWithSeverity,
  countTasksBySeverity,
  formatSeverityBreakdown,
} from '../../tasks/severityUtils'
import { supabase } from '../../supabase'

class DashboardService {
  /**
   * Get overall dashboard metrics
   */
  async getOverview(): Promise<DashboardOverview> {
    try {
      // Get all compliance scores (use compliance_scores instead of compliance_records)
      const { data: complianceScoresData } = await supabase.schema('forsured').from('compliance_scores').select('*')
      const complianceScores = complianceScoresData ?? []
      // Get all subcontractors (use subcontractors instead of broker_clients)
      const { data: subcontractorsData } = await supabase.schema('forsured').from('subcontractors').select('*')
      const subcontractors = subcontractorsData ?? []
      const { data: projectsData } = await supabase.schema('forsured').from('projects').select('*')
      const projects = projectsData ?? []

      // Calculate compliance status distribution
      let compliantCount = 0
      let warningCount = 0
      let criticalCount = 0

      complianceScores.forEach((record) => {
        // Use 'score' column (not 'overall_score')
        if (record.score >= 90) {
          compliantCount++
        } else if (record.score >= 70) {
          warningCount++
        } else {
          criticalCount++
        }
      })

      // Calculate overall score
      const totalScore = complianceScores.reduce((sum, record) => sum + (record.score || 0), 0)
      const overallScore = complianceScores.length > 0 ? totalScore / complianceScores.length : 0

      // Count active projects (projects table doesn't have end_date, just count all)
      const activeProjects = projects.length

      return {
        overall_compliance_score: Math.round(overallScore),
        total_subcontractors: subcontractors.length,
        compliant_count: compliantCount,
        warning_count: warningCount,
        critical_count: criticalCount,
        total_projects: projects.length,
        active_projects: activeProjects,
        last_updated: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Failed to get dashboard overview:', error)
      throw error
    }
  }

  /**
   * Get compliance scores for all subcontractors
   */
  async getSubcontractorScores(filters?: DashboardFilters): Promise<SubcontractorScore[]> {
    try {
      // Use subcontractors instead of broker_clients
      const { data: subcontractorsData } = await supabase.schema('forsured').from('subcontractors').select('*')
      const subcontractors = subcontractorsData ?? []
      // Use compliance_scores instead of compliance_records
      const { data: complianceScoresData } = await supabase.schema('forsured').from('compliance_scores').select('*')
      const complianceScores = complianceScoresData ?? []
      const { data: tasksData } = await supabase.schema('forsured').from('tasks').select('*')
      const tasks = tasksData ?? []
      const { data: documentsData } = await supabase.schema('forsured').from('documents').select('*')
      const documents = documentsData ?? []
      const { data: policiesData } = await supabase.schema('forsured').from('policies').select('*')
      const policies = policiesData ?? []
      const { data: projectsData } = await supabase.schema('forsured').from('projects').select('*')
      const projects = projectsData ?? []
      const { data: projectSubcontractorsData } = await supabase.schema('forsured').from('project_subcontractors').select('*')
      const projectSubcontractors = projectSubcontractorsData ?? []

      // Build a map of document_id to subcontractor_id for policy lookups
      const documentSubcontractorMap = new Map<string, string>()
      documents.forEach((doc) => {
        if (doc.subcontractor_id) {
          documentSubcontractorMap.set(doc.id, doc.subcontractor_id)
        }
      })

      let scores: SubcontractorScore[] = subcontractors.map((subcontractor) => {
        // Find compliance score for this subcontractor
        const compliance = complianceScores.find((c) => c.subcontractor_id === subcontractor.id)
        // Use subcontractor_id instead of client_id
        const subcontractorTasks = tasks.filter(
          (t) => t.subcontractor_id === subcontractor.id && t.status !== 'completed' && t.status !== 'cancelled'
        )
        // Policies are linked through documents
        const subcontractorPolicies = policies.filter((p) => {
          const subId = documentSubcontractorMap.get(p.document_id)
          return subId === subcontractor.id
        })

        // Count policies expiring within 30 days
        const now = new Date()
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        const expiringPolicies = subcontractorPolicies.filter((p) => {
          const endDate = new Date(p.end_date)
          return endDate > now && endDate <= thirtyDaysFromNow
        })

        // Determine compliance status - use 'score' column (not 'overall_score')
        const score = compliance?.score || subcontractor.compliance_score || 0
        let status: 'compliant' | 'warning' | 'critical' | 'non_compliant' | 'partial'
        if (score >= 90) status = 'compliant'
        else if (score >= 70) status = 'warning'
        else if (score >= 50) status = 'partial'
        else status = 'critical'

        // Count projects for this subcontractor via project_subcontractors junction
        const subcontractorProjectIds = projectSubcontractors
          .filter((ps) => ps.subcontractor_id === subcontractor.id && ps.status === 'active')
          .map((ps) => ps.project_id)

        return {
          id: subcontractor.id,
          // Use 'company' column (not 'company_name')
          company_name: subcontractor.company,
          compliance_score: Math.round(score),
          status,
          open_tasks_count: subcontractorTasks.length,
          policies_expiring_count: expiringPolicies.length,
          last_updated: compliance?.updated_at || subcontractor.updated_at,
          project_count: subcontractorProjectIds.length,
          risk_level: subcontractor.risk_level || 'low',
        }
      })

      // Apply filters
      if (filters) {
        if (filters.project_ids && filters.project_ids.length > 0) {
          // Get subcontractors associated with these projects via junction table
          const projectSubIds = new Set<string>()
          projectSubcontractors
            .filter((ps) => filters.project_ids?.includes(ps.project_id))
            .forEach((ps) => projectSubIds.add(ps.subcontractor_id))

          scores = scores.filter((s) => projectSubIds.has(s.id))
        }

        if (filters.status_filter && filters.status_filter.length > 0) {
          scores = scores.filter((s) => filters.status_filter?.includes(s.status))
        }

        if (filters.subcontractor_search) {
          const searchLower = filters.subcontractor_search.toLowerCase()
          scores = scores.filter((s) => s.company_name.toLowerCase().includes(searchLower))
        }
      }

      // Sort by compliance score descending
      return scores.sort((a, b) => b.compliance_score - a.compliance_score)
    } catch (error) {
      console.error('Failed to get subcontractor scores:', error)
      throw error
    }
  }

  /**
   * Get task summary by priority
   */
  async getTaskSummary(): Promise<TaskSummary> {
    try {
      const { data: tasksData } = await supabase.schema('forsured').from('tasks').select('*')
      const tasks = tasksData ?? []

      // Filter to open tasks only
      const openTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled')

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

      const highPriority = openTasks.filter((t) => t.priority === 'high')
      const mediumPriority = openTasks.filter((t) => t.priority === 'medium')
      const lowPriority = openTasks.filter((t) => t.priority === 'low')
      const urgentPriority = openTasks.filter((t) => t.priority === 'urgent')

      const overdue = openTasks.filter((t) => {
        if (!t.due_date) return false
        return new Date(t.due_date) < now
      })

      const dueToday = openTasks.filter((t) => {
        if (!t.due_date) return false
        const dueDate = new Date(t.due_date)
        return dueDate >= today && dueDate < tomorrow
      })

      return {
        total_open_tasks: openTasks.length,
        high_priority_count: highPriority.length,
        medium_priority_count: mediumPriority.length,
        low_priority_count: lowPriority.length,
        urgent_count: urgentPriority.length,
        overdue_count: overdue.length,
        due_today_count: dueToday.length,
        last_updated: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Failed to get task summary:', error)
      throw error
    }
  }

  /**
   * Get policies expiring within specified days
   */
  async getExpiringPolicies(days: number = 30): Promise<ExpiringPolicy[]> {
    try {
      const { data: policiesData } = await supabase.schema('forsured').from('policies').select('*')
      const policies = policiesData ?? []
      const { data: documentsData } = await supabase.schema('forsured').from('documents').select('*')
      const documents = documentsData ?? []
      // Use subcontractors instead of broker_clients
      const { data: subcontractorsData } = await supabase.schema('forsured').from('subcontractors').select('*')
      const subcontractors = subcontractorsData ?? []
      const { data: projectSubcontractorsData } = await supabase.schema('forsured').from('project_subcontractors').select('*')
      const projectSubcontractors = projectSubcontractorsData ?? []

      // Build maps for lookups
      const documentSubcontractorMap = new Map<string, string>()
      documents.forEach((doc) => {
        if (doc.subcontractor_id) {
          documentSubcontractorMap.set(doc.id, doc.subcontractor_id)
        }
      })

      const now = new Date()
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

      const expiringPolicies: ExpiringPolicy[] = []

      policies.forEach((policy) => {
        const endDate = new Date(policy.end_date)
        if (endDate > now && endDate <= futureDate) {
          // Get subcontractor via document
          const subcontractorId = documentSubcontractorMap.get(policy.document_id)
          const subcontractor = subcontractors.find((s) => s.id === subcontractorId)

          // Count projects for this subcontractor
          const subProjects = projectSubcontractors.filter(
            (ps) => ps.subcontractor_id === subcontractorId && ps.status === 'active'
          )

          const daysRemaining = Math.ceil(
            (endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
          )

          expiringPolicies.push({
            id: policy.id,
            policy_number: policy.policy_number,
            policy_type: policy.coverage_type, // Use coverage_type instead of policy_type
            subcontractor_id: subcontractorId || '',
            subcontractor_name: subcontractor?.company || 'Unknown', // Use 'company' column
            expiration_date: policy.end_date,
            days_remaining: daysRemaining,
            project_count: subProjects.length,
            status: endDate < now ? 'expired' : 'active',
          })
        }
      })

      // Sort by days remaining (ascending)
      return expiringPolicies.sort((a, b) => a.days_remaining - b.days_remaining)
    } catch (error) {
      console.error('Failed to get expiring policies:', error)
      throw error
    }
  }

  /**
   * Get activity feed events
   */
  async getActivityFeed(limit: number = 20, filters?: DashboardFilters): Promise<ActivityEvent[]> {
    try {
      // In a real implementation, this would query an activity log table
      // For now, we'll generate synthetic activities from existing data
      const { data: tasksData } = await supabase.schema('forsured').from('tasks').select('*')
      const tasks = tasksData ?? []
      const { data: policiesData } = await supabase.schema('forsured').from('policies').select('*')
      const policies = policiesData ?? []
      const { data: documentsData } = await supabase.schema('forsured').from('documents').select('*')
      const documents = documentsData ?? []
      // Use subcontractors instead of broker_clients
      const { data: subcontractorsData } = await supabase.schema('forsured').from('subcontractors').select('*')
      const subcontractors = subcontractorsData ?? []

      // Build document to subcontractor map
      const documentSubcontractorMap = new Map<string, string>()
      documents.forEach((doc) => {
        if (doc.subcontractor_id) {
          documentSubcontractorMap.set(doc.id, doc.subcontractor_id)
        }
      })

      const activities: ActivityEvent[] = []

      // Generate activities from completed tasks
      tasks
        .filter((t) => t.status === 'completed')
        .forEach((task) => {
          // Use subcontractor_id instead of client_id
          const subcontractor = subcontractors.find((s) => s.id === task.subcontractor_id)
          activities.push({
            id: `task-completed-${task.id}`,
            event_type: 'task_completed',
            description: `Task "${task.title}" completed`,
            subcontractor_id: task.subcontractor_id,
            subcontractor_name: subcontractor?.company, // Use 'company' column
            project_id: task.project_id,
            timestamp: task.updated_at,
          })
        })

      // Generate activities from recent policies
      policies.forEach((policy) => {
        const subcontractorId = documentSubcontractorMap.get(policy.document_id)
        const subcontractor = subcontractors.find((s) => s.id === subcontractorId)
        activities.push({
          id: `policy-uploaded-${policy.id}`,
          event_type: 'policy_uploaded',
          description: `${policy.coverage_type} policy uploaded`, // Use coverage_type
          subcontractor_id: subcontractorId,
          subcontractor_name: subcontractor?.company, // Use 'company' column
          timestamp: policy.created_at,
        })
      })

      // Generate activities from expired policies
      const now = new Date()
      policies
        .filter((p) => new Date(p.end_date) < now)
        .forEach((policy) => {
          const subcontractorId = documentSubcontractorMap.get(policy.document_id)
          const subcontractor = subcontractors.find((s) => s.id === subcontractorId)
          activities.push({
            id: `policy-expired-${policy.id}`,
            event_type: 'policy_expired',
            description: `${policy.coverage_type} policy expired`, // Use coverage_type
            subcontractor_id: subcontractorId,
            subcontractor_name: subcontractor?.company, // Use 'company' column
            timestamp: policy.end_date,
          })
        })

      // Apply date range filter if provided
      let filteredActivities = activities
      if (filters?.date_range) {
        const startDate = new Date(filters.date_range.start)
        const endDate = new Date(filters.date_range.end)
        filteredActivities = activities.filter((a) => {
          const activityDate = new Date(a.timestamp)
          return activityDate >= startDate && activityDate <= endDate
        })
      }

      // Sort by timestamp descending and limit
      return filteredActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('Failed to get activity feed:', error)
      throw error
    }
  }

  /**
   * Get compliance trend data
   */
  async getComplianceTrend(days: number = 30): Promise<ComplianceTrendData[]> {
    try {
      // In a real implementation, this would query historical compliance data
      // For now, generate synthetic trend data
      // Use compliance_scores instead of compliance_records
      const { data: complianceScoresData } = await supabase.schema('forsured').from('compliance_scores').select('*')
      const complianceScores = complianceScoresData ?? []
      // Use 'score' column instead of 'overall_score'
      const currentOverallScore =
        complianceScores.reduce((sum, r) => sum + (r.score || 0), 0) /
        (complianceScores.length || 1)

      const trendData: ComplianceTrendData[] = []
      const now = new Date()

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)

        // Add some variation to simulate trends
        const variation = (Math.random() - 0.5) * 10
        const score = Math.max(0, Math.min(100, currentOverallScore + variation))

        let compliantCount = 0
        let warningCount = 0
        let criticalCount = 0

        complianceScores.forEach((record) => {
          // Use 'score' column
          const adjustedScore = Math.max(0, Math.min(100, (record.score || 0) + variation))
          if (adjustedScore >= 90) compliantCount++
          else if (adjustedScore >= 70) warningCount++
          else criticalCount++
        })

        trendData.push({
          date: date.toISOString().split('T')[0],
          overall_score: Math.round(score),
          compliant_count: compliantCount,
          warning_count: warningCount,
          critical_count: criticalCount,
        })
      }

      return trendData
    } catch (error) {
      console.error('Failed to get compliance trend:', error)
      throw error
    }
  }

  /**
   * Get drill-down data for a specific metric
   */
  async getDrillDownData(metricName: string): Promise<DrillDownData> {
    try {
      const trendData = await this.getComplianceTrend(30)
      const currentValue = trendData[trendData.length - 1]?.overall_score || 0
      const previousValue = trendData[trendData.length - 8]?.overall_score || 0 // 7 days ago

      const changePercentage =
        previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0

      // Get contributing factors
      const { data: tasksData } = await supabase.schema('forsured').from('tasks').select('*')
      const tasks = tasksData ?? []
      const { data: policiesData } = await supabase.schema('forsured').from('policies').select('*')
      const policies = policiesData ?? []

      const openTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
      const now = new Date()
      const expiredPolicies = policies.filter((p) => new Date(p.end_date) < now)

      return {
        metric_name: metricName,
        current_value: currentValue,
        previous_value: previousValue,
        change_percentage: Math.round(changePercentage * 100) / 100,
        trend_data: trendData,
        contributing_factors: [
          {
            name: 'Open Remediation Tasks',
            value: openTasks.length,
            impact: openTasks.length > 10 ? 'negative' : 'neutral',
            description: `${openTasks.length} tasks requiring attention`,
          },
          {
            name: 'Expired Policies',
            value: expiredPolicies.length,
            impact: expiredPolicies.length > 0 ? 'negative' : 'positive',
            description: `${expiredPolicies.length} policies have expired`,
          },
          {
            name: 'Overall Trend',
            value: changePercentage,
            impact:
              changePercentage > 0 ? 'positive' : changePercentage < 0 ? 'negative' : 'neutral',
            description: `${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(1)}% from last week`,
          },
        ],
      }
    } catch (error) {
      console.error('Failed to get drill-down data:', error)
      throw error
    }
  }

  /**
   * Get detailed information for a subcontractor
   */
  async getSubcontractorDetail(subcontractorId: string): Promise<SubcontractorDetail> {
    try {
      // Use subcontractors instead of broker_clients
      const { data: subcontractor } = await supabase.schema('forsured').from('subcontractors')
        .select('*')
        .eq('id', subcontractorId)
        .single()

      if (!subcontractor) {
        throw new Error('Subcontractor not found')
      }

      // Use compliance_scores instead of compliance_records
      const { data: complianceScoresData } = await supabase.schema('forsured').from('compliance_scores')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
      const complianceScores = complianceScoresData ?? []
      const compliance = complianceScores[0]

      // Get documents for this subcontractor to find policies
      const { data: documentsData } = await supabase.schema('forsured').from('documents')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
      const documents = documentsData ?? []

      const documentIds = documents.map((d) => d.id)
      const policiesResult = documentIds.length > 0
        ? await supabase.schema('forsured').from('policies')
            .select('*')
            .in('document_id', documentIds)
        : { data: [] }
      const policies = policiesResult.data ?? []

      // Use subcontractor_id instead of client_id
      const { data: tasksData } = await supabase.schema('forsured').from('tasks')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .neq('status', 'completed')
        .neq('status', 'cancelled')
      const tasks = tasksData ?? []

      const now = new Date()
      // Use 'score' column instead of 'overall_score'
      const score = compliance?.score || subcontractor.compliance_score || 0
      let status: 'compliant' | 'warning' | 'critical' | 'non_compliant' | 'partial'
      if (score >= 90) status = 'compliant'
      else if (score >= 70) status = 'warning'
      else if (score >= 50) status = 'partial'
      else status = 'critical'

      // Map policies
      const policyInfos = (policies || []).map((p) => {
        const endDate = new Date(p.end_date)
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

        let policyStatus: 'active' | 'expired' | 'expiring_soon'
        if (endDate < now) policyStatus = 'expired'
        else if (daysRemaining <= 30) policyStatus = 'expiring_soon'
        else policyStatus = 'active'

        return {
          id: p.id,
          policy_number: p.policy_number,
          policy_type: p.coverage_type, // Use coverage_type
          provider: p.carrier, // Use carrier instead of provider
          expiration_date: p.end_date,
          days_remaining: Math.max(0, daysRemaining),
          status: policyStatus,
        }
      })

      // Map tasks
      const taskInfos = (tasks || []).map((t) => {
        let daysUntilDue: number | undefined
        if (t.due_date) {
          daysUntilDue = Math.ceil(
            (new Date(t.due_date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
          )
        }

        return {
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
          due_date: t.due_date,
          days_until_due: daysUntilDue,
        }
      })

      // Get recent activity for this subcontractor
      const allActivities = await this.getActivityFeed(100)
      const recentActivity = allActivities
        .filter((a) => a.subcontractor_id === subcontractorId)
        .slice(0, 10)

      // Get compliance history (stub - would be real data in production)
      const complianceHistory = await this.getComplianceTrend(30)

      return {
        id: subcontractor.id,
        company_name: subcontractor.company, // Use 'company' column
        compliance_score: Math.round(score),
        status,
        policies: policyInfos,
        open_tasks: taskInfos,
        recent_activity: recentActivity,
        compliance_history: complianceHistory,
      }
    } catch (error) {
      console.error('Failed to get subcontractor detail:', error)
      throw error
    }
  }

  /**
   * Export dashboard data
   */
  async exportDashboard(config: ExportConfig): Promise<string | Record<string, any>> {
    try {
      if (config.format === 'csv') {
        const scores = await this.getSubcontractorScores(config.filters)

        // Generate CSV
        const headers = [
          'Company Name',
          'Compliance Score',
          'Status',
          'Open Tasks',
          'Expiring Policies',
          'Projects',
          'Risk Level',
        ]
        const rows = scores.map((s) => [
          s.company_name,
          s.compliance_score.toString(),
          s.status,
          s.open_tasks_count.toString(),
          s.policies_expiring_count.toString(),
          s.project_count.toString(),
          s.risk_level,
        ])

        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
        return csv
      } else {
        // PDF format - return structured data
        const overview = await this.getOverview()
        const scores = await this.getSubcontractorScores(config.filters)
        const taskSummary = await this.getTaskSummary()
        const expiringPolicies = await this.getExpiringPolicies()
        const trendData = config.include_charts ? await this.getComplianceTrend() : []

        return {
          report_date: config.report_date,
          overview,
          subcontractor_scores: scores,
          task_summary: taskSummary,
          expiring_policies: expiringPolicies,
          trend_data: trendData,
        }
      }
    } catch (error) {
      console.error('Failed to export dashboard:', error)
      throw error
    }
  }

  /**
   * Check if dashboard needs refresh based on last update time
   */
  async needsRefresh(lastUpdateTime: string): Promise<boolean> {
    const lastUpdate = new Date(lastUpdateTime)
    const now = new Date()
    const diffSeconds = (now.getTime() - lastUpdate.getTime()) / 1000

    // Refresh every 30 seconds
    return diffSeconds >= 30
  }

  // ==========================================================================
  // Task Severity and Risk Distribution Methods
  // ==========================================================================

  /**
   * Get task summary with severity breakdown
   * Extends getTaskSummary with severity-based metrics
   */
  async getTaskSeveritySummary(): Promise<TaskSeveritySummary> {
    try {
      const baseSummary = await this.getTaskSummary()
      const { data: tasksData } = await supabase.schema('forsured').from('tasks').select('*')
      const tasks = tasksData ?? []

      // Filter to open tasks only
      const openTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled')

      // Enrich tasks with severity and count
      const enrichedTasks = enrichTasksWithSeverity(openTasks)
      const severityCounts = countTasksBySeverity(enrichedTasks)
      const severitySummary = formatSeverityBreakdown(enrichedTasks)
      const urgentCount = severityCounts.critical + severityCounts.high

      return {
        ...baseSummary,
        severity_counts: severityCounts,
        severity_summary: severitySummary,
        urgent_severity_count: urgentCount,
      }
    } catch (error) {
      console.error('Failed to get task severity summary:', error)
      throw error
    }
  }

  /**
   * Calculate risk distribution based on task severity
   * Correlates tasks with compliance risk levels
   */
  async getRiskDistribution(): Promise<RiskDistribution> {
    try {
      const { data: tasksData } = await supabase.schema('forsured').from('tasks').select('*')
      const tasks = tasksData ?? []
      // Use subcontractors instead of broker_clients
      const { data: subcontractorsData } = await supabase.schema('forsured').from('subcontractors').select('*')
      const subcontractors = subcontractorsData ?? []

      // Filter to open tasks
      const openTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled')

      // Enrich and count by severity
      const enrichedTasks = enrichTasksWithSeverity(openTasks)
      const severityBreakdown = countTasksBySeverity(enrichedTasks)

      // Count subcontractors with critical tasks (compliance gaps)
      // Use subcontractor_id instead of client_id
      const subcontractorsWithCriticalTasks = new Set<string>()
      enrichedTasks.forEach((task) => {
        if (task.severity === 'critical' && task.subcontractor_id) {
          subcontractorsWithCriticalTasks.add(task.subcontractor_id)
        }
      })

      const clientsWithGaps = subcontractorsWithCriticalTasks.size
      const totalClients = subcontractors.length
      const complianceRate =
        totalClients > 0 ? Math.round(((totalClients - clientsWithGaps) / totalClients) * 100) : 100

      // Determine overall risk level based on severity distribution
      const riskLevel = this.calculateOverallRiskLevel(severityBreakdown, totalClients)

      // Generate summary and explanation
      const summary = this.generateRiskSummary(
        openTasks.length,
        severityBreakdown,
        clientsWithGaps,
        totalClients
      )

      const correlationExplanation = this.generateCorrelationExplanation(
        severityBreakdown,
        clientsWithGaps,
        totalClients
      )

      return {
        total_tasks: openTasks.length,
        severity_breakdown: severityBreakdown,
        risk_level: riskLevel,
        clients_with_gaps: clientsWithGaps,
        total_clients: totalClients,
        compliance_rate: complianceRate,
        summary,
        correlation_explanation: correlationExplanation,
        last_updated: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Failed to get risk distribution:', error)
      throw error
    }
  }

  /**
   * Get risk profiles for all subcontractors based on task severity
   */
  async getClientRiskProfiles(): Promise<ClientRiskProfile[]> {
    try {
      const { data: tasksData } = await supabase.schema('forsured').from('tasks').select('*')
      const tasks = tasksData ?? []
      // Use subcontractors instead of broker_clients
      const { data: subcontractorsData } = await supabase.schema('forsured').from('subcontractors').select('*')
      const subcontractors = subcontractorsData ?? []

      // Filter to open tasks
      const openTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled')

      // Enrich tasks with severity
      const enrichedTasks = enrichTasksWithSeverity(openTasks)

      // Build risk profile for each subcontractor
      const profiles: ClientRiskProfile[] = subcontractors.map((subcontractor) => {
        // Use subcontractor_id instead of client_id
        const subcontractorTasks = enrichedTasks.filter((t) => t.subcontractor_id === subcontractor.id)
        const severityCounts = countTasksBySeverity(subcontractorTasks)
        const urgentCount = severityCounts.critical + severityCounts.high
        const hasCritical = severityCounts.critical > 0

        // Determine risk level for this subcontractor
        let riskLevel: 'low' | 'medium' | 'high' | 'critical'
        if (severityCounts.critical > 0) {
          riskLevel = 'critical'
        } else if (severityCounts.high > 0) {
          riskLevel = 'high'
        } else if (severityCounts.medium > 0) {
          riskLevel = 'medium'
        } else {
          riskLevel = 'low'
        }

        return {
          client_id: subcontractor.id,
          client_name: subcontractor.company, // Use 'company' column
          task_severity_counts: severityCounts,
          risk_level: riskLevel,
          has_compliance_gap: hasCritical,
          urgent_task_count: urgentCount,
        }
      })

      // Sort by risk level (critical first)
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return profiles.sort((a, b) => riskOrder[a.risk_level] - riskOrder[b.risk_level])
    } catch (error) {
      console.error('Failed to get client risk profiles:', error)
      throw error
    }
  }

  /**
   * Calculate overall risk level based on severity distribution
   */
  private calculateOverallRiskLevel(
    severityCounts: Record<TaskSeverity, number>,
    totalClients: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical if any critical tasks exist
    if (severityCounts.critical > 0) {
      return 'critical'
    }

    // High if many high-severity tasks
    if (severityCounts.high > 3) {
      return 'high'
    }

    // Medium if some high or many medium tasks
    if (severityCounts.high > 0 || severityCounts.medium > 5) {
      return 'medium'
    }

    // Low otherwise
    return 'low'
  }

  /**
   * Generate human-readable risk summary
   */
  private generateRiskSummary(
    totalTasks: number,
    severityCounts: Record<TaskSeverity, number>,
    clientsWithGaps: number,
    totalClients: number
  ): string {
    const urgentCount = severityCounts.critical + severityCounts.high
    const compliantClients = totalClients - clientsWithGaps

    if (urgentCount === 0) {
      return `${totalTasks} tasks, all clients compliant`
    }

    return `${totalTasks} tasks (${urgentCount} urgent), ${compliantClients}/${totalClients} clients compliant`
  }

  /**
   * Generate correlation explanation for dashboard display
   */
  private generateCorrelationExplanation(
    severityCounts: Record<TaskSeverity, number>,
    clientsWithGaps: number,
    totalClients: number
  ): string {
    if (severityCounts.critical === 0 && severityCounts.high === 0) {
      return 'No urgent tasks. All clients are in compliance.'
    }

    const explanations: string[] = []

    if (severityCounts.critical > 0) {
      explanations.push(
        `${severityCounts.critical} critical tasks indicate immediate compliance gaps requiring action.`
      )
    }

    if (clientsWithGaps > 0) {
      explanations.push(
        `${clientsWithGaps} client(s) have compliance gaps (critical tasks pending).`
      )
    }

    if (severityCounts.high > 0) {
      explanations.push(`${severityCounts.high} high-severity tasks represent elevated risk.`)
    }

    return explanations.join(' ')
  }
}

export const dashboardService = new DashboardService()
