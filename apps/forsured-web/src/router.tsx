// src/router.tsx
// REQ-126: OAuth 2.0 + RBAC Authentication System
//
// Application routing with integrated auth guards
// Uses React.lazy() for code splitting to reduce initial bundle size
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from './components/common/LoadingSpinner';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout - loaded immediately (needed for all routes)
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';

// Suspense wrapper for lazy components
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);

// === LAZY LOADED COMPONENTS ===
// Public pages
const DesignSystemHome = lazy(() => import('./components/DesignSystem/DesignSystemHome'));
const Colors = lazy(() => import('./components/Features/Colors'));
const TestingPage = lazy(() => import('./components/Features/TestingPage'));
const TestSupabase = lazy(() => import('./pages/TestSupabase'));
const SignupPage = lazy(() => import('./pages/Signup'));
const StartPage = lazy(() => import('./pages/Start'));
const CallbackPage = lazy(() => import('./pages/Callback'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmail'));
const UnauthorizedPage = lazy(() => import('./pages/Unauthorized'));
const InvitationLandingPage = lazy(() => import('./pages/InvitationLanding'));

// Dashboards
const EnhancedManagerDashboard = lazy(() => import('./components/Dashboard/EnhancedManagerDashboard'));
const EnhancedSubcontractorDashboard = lazy(() => import('./components/Dashboard/EnhancedSubcontractorDashboard'));
const EnhancedBrokerDashboard = lazy(() => import('./components/Dashboard/EnhancedBrokerDashboard'));

// Onboarding
const ManagerOnboarding = lazy(() => import('./components/Onboarding/ManagerOnboarding'));
const SubcontractorOnboarding = lazy(() => import('./components/Onboarding/SubcontractorOnboarding'));
const BrokerOnboarding = lazy(() => import('./components/Onboarding/BrokerOnboarding'));

// Manager components
const ManagerTasksPage = lazy(() => import('./components/Manager/ManagerTasksPage'));
const ManagerProjectsPage = lazy(() => import('./components/Manager/ManagerProjectsPage'));
const SubcontractorsPage = lazy(() => import('./components/Manager/SubcontractorsPage'));
const ManagerAcknowledgementsList = lazy(() => import('./components/Manager/ManagerAcknowledgementsList'));
const ManagerMyBrokerPage = lazy(() => import('./pages/manager/MyBrokerPage'));

// Subcontractor components
const MyManagersPage = lazy(() => import('./components/Subcontractor/MyManagersPage'));
const SubcontractorProjectsPage = lazy(() => import('./components/Subcontractor/SubcontractorProjectsPage'));
const DocumentsPage = lazy(() => import('./components/Subcontractor/DocumentsPage'));
const ContractorTasks = lazy(() => import('./pages/contractor/ContractorTasks'));
const SubcontractorMyBrokerPage = lazy(() => import('./pages/subcontractor/MyBrokerPage'));

// Broker components
const BrokerProjectsPage = lazy(() => import('./components/Broker/BrokerProjectsPage'));
const BrokerClientsPage = lazy(() => import('./components/Broker/BrokerClientsPage'));
const BrokerTeamPage = lazy(() => import('./components/Broker/BrokerTeamPage'));
const BrokerTasksPage = lazy(() => import('./components/Broker/BrokerTasksPage'));
const BrokerTaskDetailPage = lazy(() => import('./components/Broker/BrokerTaskDetailPage'));
const BrokerClientProfilePage = lazy(() => import('./components/Broker/BrokerClientProfilePage'));
const BrokerInsurancePage = lazy(() => import('./components/Broker/BrokerInsurancePage'));
const BrokerPolicyDetailPage = lazy(() => import('./components/Broker/BrokerPolicyDetailPage'));
const BrokerAcknowledgementFormPage = lazy(() => import('./components/BrokerAcknowledgement/BrokerAcknowledgementFormPage'));
const BrokerAcknowledgementList = lazy(() => import('./components/BrokerAcknowledgement/BrokerAcknowledgementList'));

// Shared components
const ProjectDetailPage = lazy(() => import('./components/Project/ProjectDetailPage'));
const ProjectCreatePage = lazy(() => import('./components/Project/ProjectCreatePage'));
const InsuranceMarketplace = lazy(() => import('./components/Features/InsuranceMarketplace'));
// TODO: Re-enable when integrations feature is ready
// const IntegrationsMarketplace = lazy(() => import('./components/Features/IntegrationsMarketplace'));
const NotificationsAndApprovalsPage = lazy(() => import('./components/Notifications/NotificationsAndApprovalsPage'));
const UserManagementPage = lazy(() => import('./components/User/UserManagementPage'));
const ClientProfilePage = lazy(() => import('./app/(dashboard)/clients/[clientId]/page')); // REQ-274

// GC Settings
const GCProfileSettings = lazy(() => import('./pages/gc/settings/ProfileSettings'));
const GCCompanySettings = lazy(() => import('./pages/gc/settings/CompanySettings'));
const GCInsuranceSettings = lazy(() => import('./pages/gc/settings/InsuranceSettings'));
const GCNotificationSettings = lazy(() => import('./pages/gc/settings/NotificationSettings'));
const GCTeamSettings = lazy(() => import('./pages/gc/settings/TeamSettings'));
const GCIntegrationSettings = lazy(() => import('./pages/gc/settings/IntegrationSettings'));

// Contractor Settings
const ContractorProfileSettings = lazy(() => import('./pages/contractor/settings/ProfileSettings'));
const ContractorCompanySettings = lazy(() => import('./pages/contractor/settings/CompanySettings'));
const ContractorInsuranceSettings = lazy(() => import('./pages/contractor/settings/InsuranceSettings'));
const ContractorNotificationSettings = lazy(() => import('./pages/contractor/settings/NotificationSettings'));
const ContractorDocumentSettings = lazy(() => import('./pages/contractor/settings/DocumentSettings'));

// Broker Settings
const BrokerProfileSettings = lazy(() => import('./pages/broker/settings/ProfileSettings'));
const BrokerAgencySettings = lazy(() => import('./pages/broker/settings/AgencySettings'));
const BrokerClientSettings = lazy(() => import('./pages/broker/settings/ClientSettings'));
const BrokerNotificationSettings = lazy(() => import('./pages/broker/settings/NotificationSettings'));

// Admin - AdminLayout is NOT lazy loaded to prevent esbuild service crashes
// Layout components should be eagerly loaded to avoid dependency resolution issues
import AdminLayout from './components/admin/AdminLayout';
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminBrokers = lazy(() => import('./pages/admin/Brokers'));
const AdminEnums = lazy(() => import('./pages/admin/Enums'));
const AdminAuditLog = lazy(() => import('./pages/admin/AuditLog'));
const AdminCompanies = lazy(() => import('./pages/admin/Companies'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminUserSetTypes = lazy(() => import('./pages/admin/UserSetTypes'));
const AdminLexiconEditor = lazy(() => import('./pages/admin/LexiconEditor'));
const AdminCCPA = lazy(() => import('./app/(dashboard)/admin/ccpa/page'));

// Privacy Settings (REQ-3: CCPA Compliance)
const PrivacySettings = lazy(() => import('./app/(dashboard)/settings/privacy/page'));

// Documentation (public)
const DocsHome = lazy(() => import('./pages/docs/index'));
const DocsComponents = lazy(() => import('./pages/docs/Components'));
const DocsTokens = lazy(() => import('./pages/docs/Tokens'));
const DocsIcons = lazy(() => import('./pages/docs/Icons'));
const DocsPatterns = lazy(() => import('./pages/docs/Patterns'));
const DocsChangelog = lazy(() => import('./pages/docs/Changelog'));

// Help Center (protected)
const GCHelp = lazy(() => import('./pages/gc/help/index'));
const ContractorHelp = lazy(() => import('./pages/contractor/help/index'));
const BrokerHelp = lazy(() => import('./pages/broker/help/index'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes - always accessible */}
        <Route path="/" element={<StartPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/auth/verify" element={<VerifyEmailPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/invite/:code" element={<InvitationLandingPage />} />
        <Route path="/design-system" element={<DesignSystemHome />} />
        <Route path="/colors" element={<Colors />} />
        <Route path="/testing" element={<TestingPage />} />
        <Route path="/test-supabase" element={<TestSupabase />} />

        {/* Documentation routes - public */}
        <Route path="/docs" element={<DocsHome />} />
        <Route path="/docs/components" element={<DocsComponents />} />
        <Route path="/docs/tokens" element={<DocsTokens />} />
        <Route path="/docs/icons" element={<DocsIcons />} />
        <Route path="/docs/patterns" element={<DocsPatterns />} />
        <Route path="/docs/changelog" element={<DocsChangelog />} />

        {/* Onboarding routes - require auth but not completed onboarding */}
        <Route
          path="/manager/onboarding"
          element={
            <ProtectedRoute allowedTypes={['manager']} requireOnboarding={false}>
              <ManagerOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subcontractor/onboarding"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']} requireOnboarding={false}>
              <SubcontractorOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/broker/onboarding"
          element={
            <ProtectedRoute allowedTypes={['broker']} requireOnboarding={false}>
              <BrokerOnboarding />
            </ProtectedRoute>
          }
        />

      {/* Protected routes within Layout */}
      <Route path="/" element={<Layout />}>
        {/* Manager routes */}
        <Route
          path="manager/dashboard"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <EnhancedManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/tasks"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <ManagerTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/projects"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <ManagerProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/projects/new"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <ProjectCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/projects/:projectId"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/subcontractors"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <SubcontractorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/broker"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <ManagerMyBrokerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/subcontractors/new"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <Navigate to="/manager/subcontractors" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/documents"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/marketplace"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <InsuranceMarketplace />
            </ProtectedRoute>
          }
        />
        {/* TODO: Re-enable when integrations feature is ready */}
        {/* <Route
          path="manager/integrations"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <IntegrationsMarketplace />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="manager/acknowledgements"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <ManagerAcknowledgementsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/notifications"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <NotificationsAndApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/users"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Manager Settings routes */}
        <Route
          path="manager/settings/profile"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <GCProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/settings/company"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <GCCompanySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/settings/insurance"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <GCInsuranceSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/settings/notifications"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <GCNotificationSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/settings/team"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <GCTeamSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/settings/integrations"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <GCIntegrationSettings />
            </ProtectedRoute>
          }
        />

        {/* Manager Help */}
        <Route
          path="manager/help"
          element={
            <ProtectedRoute allowedTypes={['manager']}>
              <GCHelp />
            </ProtectedRoute>
          }
        />

        {/* Subcontractor routes */}
        <Route
          path="subcontractor/dashboard"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <EnhancedSubcontractorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="subcontractor/relationships"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <MyManagersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="subcontractor/broker"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <SubcontractorMyBrokerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="subcontractor/projects"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <SubcontractorProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="subcontractor/projects/:projectId"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="subcontractor/documents"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="subcontractor/notifications"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <NotificationsAndApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="subcontractor/tasks"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <ContractorTasks />
            </ProtectedRoute>
          }
        />

        {/* Subcontractor Settings routes */}
        <Route
          path="subcontractor/settings/profile"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <ContractorProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="subcontractor/settings/company"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <ContractorCompanySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="subcontractor/settings/insurance"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <ContractorInsuranceSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="subcontractor/settings/notifications"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <ContractorNotificationSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="subcontractor/settings/documents"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <ContractorDocumentSettings />
            </ProtectedRoute>
          }
        />

        {/* Subcontractor Help */}
        <Route
          path="subcontractor/help"
          element={
            <ProtectedRoute allowedTypes={['subcontractor']}>
              <ContractorHelp />
            </ProtectedRoute>
          }
        />

        {/* Broker routes */}
        <Route
          path="broker/dashboard"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <EnhancedBrokerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/tasks"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/tasks/:taskId"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerTaskDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/clients"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerClientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/clients/:clientId"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerClientProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="clients/:clientId"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <ClientProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/projects"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/projects/:projectId"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/team"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerTeamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/documents"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/insurance"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerInsurancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/insurance/policies/:policyId"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerPolicyDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/acknowledgements"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerAcknowledgementList />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/acknowledgements/:formId"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerAcknowledgementFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/marketplace"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <InsuranceMarketplace />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/notifications"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <NotificationsAndApprovalsPage />
            </ProtectedRoute>
          }
        />

        {/* Broker Settings routes */}
        <Route
          path="broker/settings/profile"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/settings/agency"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerAgencySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/settings/clients"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerClientSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="broker/settings/notifications"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerNotificationSettings />
            </ProtectedRoute>
          }
        />

        {/* Broker Help */}
        <Route
          path="broker/help"
          element={
            <ProtectedRoute allowedTypes={['broker']}>
              <BrokerHelp />
            </ProtectedRoute>
          }
        />

        {/* Privacy Settings (REQ-3: CCPA Compliance) - Accessible to all authenticated users */}
        <Route
          path="settings/privacy"
          element={
            <ProtectedRoute allowedTypes={['manager', 'subcontractor', 'broker']}>
              <PrivacySettings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin routes with AdminLayout and ErrorBoundary */}
      <Route
        path="/admin"
        element={
          <ErrorBoundary>
            <ProtectedRoute allowedTypes={['admin']} requireOnboarding={false}>
              <AdminLayout />
            </ProtectedRoute>
          </ErrorBoundary>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="brokers" element={<AdminBrokers />} />
        <Route path="enums" element={<AdminEnums />} />
        <Route path="audit-log" element={<AdminAuditLog />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="user-set-types" element={<AdminUserSetTypes />} />
        <Route path="lexicon" element={<AdminLexiconEditor />} />
        <Route path="ccpa" element={<AdminCCPA />} />
      </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
