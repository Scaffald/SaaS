import { DEFAULT_CONFIG, type ScaffaldConfig, type ScaffaldConfigInternal } from './config.js'
import { HttpClient, type RateLimitInfo } from './http/client.js'
import { Auth } from './resources/auth.js'
import { CMS } from './resources/cms.js'
import { Jobs } from './resources/jobs.js'
import { Applications } from './resources/applications.js'
import { Profiles } from './resources/profiles.js'
import { Industries } from './resources/industries.js'
import { Organizations } from './resources/organizations.js'
import { Teams } from './resources/teams.js'
import { Prerequisites } from './resources/prerequisites.js'
import { ApiKeys } from './resources/api-keys.js'
import { WebhooksManagement } from './resources/webhooks-management.js'
import { Connections } from './resources/connections.js'
import { Follows } from './resources/follows.js'
import { Engagement } from './resources/engagement.js'
import { BackgroundChecks } from './resources/background-checks.js'
import { Inquiries } from './resources/inquiries.js'
import { WorkLogs } from './resources/work-logs.js'
import { Skills } from './resources/skills.js'
import { Experience } from './resources/experience.js'
import { Employment } from './resources/employment.js'
import { Education } from './resources/education.js'
import { Certifications } from './resources/certifications.js'
import { ProfileWidgets } from './resources/profile-widgets.js'
import { ProfileCompletion } from './resources/profile-completion.js'
import { ProfileImport } from './resources/profile-import.js'
import { Notifications } from './resources/notifications.js'
import { Employers } from './resources/employers.js'
import { ONET } from './resources/onet.js'
import { Portfolio } from './resources/portfolio.js'
import { Reviews } from './resources/reviews.js'
import { Projects } from './resources/projects.js'
import { ProfileViews } from './resources/profile-views.js'
import { UserProfiles } from './resources/user-profiles.js'
import { Workers } from './resources/workers.js'
import { PersonalityAssessments } from './resources/personality-assessment.js'
import { Feedback } from './resources/feedback.js'
import { IdVerification } from './resources/id-verification.js'
import { SuccessFees } from './resources/success-fees.js'
import { StripeSettings } from './resources/stripe-settings.js'
import { News } from './resources/news.js'
import { DocumentsStorage } from './resources/documents-storage.js'
import { LegalAgreements } from './resources/legal-agreements.js'
import { NotificationsAdmin } from './resources/notifications-admin.js'
import { AccountDeletion } from './resources/account-deletion.js'
import { Map } from './resources/map.js'
import { Resume } from './resources/resume.js'

export class Scaffald {
  private http: HttpClient

  public readonly auth: Auth
  public readonly cms: CMS
  public readonly jobs: Jobs
  public readonly applications: Applications
  public readonly profiles: Profiles
  public readonly industries: Industries
  public readonly organizations: Organizations
  public readonly teams: Teams
  public readonly prerequisites: Prerequisites
  public readonly apiKeys: ApiKeys
  public readonly webhooks: WebhooksManagement
  public readonly connections: Connections
  public readonly follows: Follows
  public readonly engagement: Engagement
  public readonly backgroundChecks: BackgroundChecks
  public readonly inquiries: Inquiries
  public readonly workLogs: WorkLogs
  public readonly skills: Skills
  public readonly experience: Experience
  public readonly employment: Employment
  public readonly education: Education
  public readonly certifications: Certifications
  public readonly profileWidgets: ProfileWidgets
  public readonly profileCompletion: ProfileCompletion
  public readonly profileImport: ProfileImport
  public readonly notifications: Notifications
  public readonly employers: Employers
  public readonly onet: ONET
  public readonly portfolio: Portfolio
  public readonly reviews: Reviews
  public readonly projects: Projects
  public readonly profileViews: ProfileViews
  public readonly userProfiles: UserProfiles
  public readonly workers: Workers
  public readonly personalityAssessments: PersonalityAssessments
  public readonly feedback: Feedback
  public readonly idVerification: IdVerification
  public readonly successFees: SuccessFees
  public readonly stripeSettings: StripeSettings
  public readonly news: News
  public readonly documentsStorage: DocumentsStorage
  public readonly legalAgreements: LegalAgreements
  public readonly notificationsAdmin: NotificationsAdmin
  public readonly accountDeletion: AccountDeletion
  public readonly map: Map
  public readonly resume: Resume

  constructor(config: ScaffaldConfig) {
    if (!config.apiKey && !config.accessToken && !config.supabaseToken) {
      throw new Error('Either apiKey, accessToken, or supabaseToken must be provided')
    }

    const internalConfig: ScaffaldConfigInternal = {
      ...DEFAULT_CONFIG,
      ...config,
    }

    this.http = new HttpClient(internalConfig)
    this.auth = new Auth(this.http)
    this.cms = new CMS(this.http)
    this.jobs = new Jobs(this.http)
    this.applications = new Applications(this.http)
    this.profiles = new Profiles(this.http)
    this.industries = new Industries(this.http)
    this.organizations = new Organizations(this.http)
    this.teams = new Teams(this.http)
    this.prerequisites = new Prerequisites(this.http)
    this.apiKeys = new ApiKeys(this.http)
    this.webhooks = new WebhooksManagement(this.http)
    this.connections = new Connections(this.http)
    this.follows = new Follows(this.http)
    this.engagement = new Engagement(this.http)
    this.backgroundChecks = new BackgroundChecks(this.http)
    this.inquiries = new Inquiries(this.http)
    this.workLogs = new WorkLogs(this.http)
    this.skills = new Skills(this.http)
    this.experience = new Experience(this.http)
    this.employment = new Employment(this.http)
    this.education = new Education(this.http)
    this.certifications = new Certifications(this.http)
    this.profileWidgets = new ProfileWidgets(this.http)
    this.profileCompletion = new ProfileCompletion(this.http)
    this.profileImport = new ProfileImport(this.http)
    this.notifications = new Notifications(this.http)
    this.employers = new Employers(this.http)
    this.onet = new ONET(this.http)
    this.portfolio = new Portfolio(this.http)
    this.reviews = new Reviews(this.http)
    this.projects = new Projects(this.http)
    this.profileViews = new ProfileViews(this.http)
    this.userProfiles = new UserProfiles(this.http)
    this.workers = new Workers(this.http)
    this.personalityAssessments = new PersonalityAssessments(this.http)
    this.feedback = new Feedback(this.http)
    this.idVerification = new IdVerification(this.http)
    this.successFees = new SuccessFees(this.http)
    this.stripeSettings = new StripeSettings(this.http)
    this.news = new News(this.http)
    this.documentsStorage = new DocumentsStorage(this.http)
    this.legalAgreements = new LegalAgreements(this.http)
    this.notificationsAdmin = new NotificationsAdmin(this.http)
    this.accountDeletion = new AccountDeletion(this.http)
    this.map = new Map(this.http)
    this.resume = new Resume(this.http)
  }

  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.http.getRateLimitInfo()
  }
}
