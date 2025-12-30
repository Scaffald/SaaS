/**
 * Authenticated Router
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 *
 * Router configuration with OAuth authentication and RBAC protection
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage, CallbackPage, UnauthorizedPage } from './components/auth';
import { Permission } from './lib/auth/types';

// Layout
import Layout from './components/Layout/Layout';

// Design System & Marketing
import DesignSystemHome from './components/DesignSystem/DesignSystemHome';
import Colors from './components/Features/Colors';

// Dashboards
import EnhancedManagerDashboard from './components/Dashboard/EnhancedManagerDashboard';
import EnhancedSubcontractorDashboard from './components/Dashboard/EnhancedSubcontractorDashboard';
import EnhancedBrokerDashboard from './components/Dashboard/EnhancedBrokerDashboard';

// Onboarding
import ManagerOnboarding from './components/Onboarding/ManagerOnboarding';
import SubcontractorOnboarding from './components/Onboarding/SubcontractorOnboarding';
import BrokerOnboarding from './components/Onboarding/BrokerOnboarding';

// Manager Pages
import ManagerTasksPage from './components/Manager/ManagerTasksPage';
import ManagerProjectsPage from './components/Manager/ManagerProjectsPage';
import SubcontractorsPage from './components/Manager/SubcontractorsPage';
import ManagerAcknowledgementsList from './components/Manager/ManagerAcknowledgementsList';
import ManagerMyBrokerPage from './pages/manager/MyBrokerPage';

// Subcontractor Pages
import MyManagersPage from './components/Subcontractor/MyManagersPage';
import MyBrokerPage from './pages/subcontractor/MyBrokerPage';
import SubcontractorProjectsPage from './components/Subcontractor/SubcontractorProjectsPage';
import DocumentsPage from './components/Subcontractor/DocumentsPage';

// Broker Pages
import BrokerProjectsPage from './components/Broker/BrokerProjectsPage';
import BrokerClientsPage from './components/Broker/BrokerClientsPage';
import BrokerTeamPage from './components/Broker/BrokerTeamPage';
import BrokerAcknowledgementFormPage from './components/BrokerAcknowledgement/BrokerAcknowledgementFormPage';
import BrokerAcknowledgementList from './components/BrokerAcknowledgement/BrokerAcknowledgementList';

// Shared Pages
import ProjectDetailPage from './components/Project/ProjectDetailPage';
import NotificationsAndApprovalsPage from './components/Notifications/NotificationsAndApprovalsPage';
import UserManagementPage from './components/User/UserManagementPage';

// Features
import InsuranceMarketplace from './components/Features/InsuranceMarketplace';
// TODO: Re-enable when integrations feature is ready
// import IntegrationsMarketplace from './components/Features/IntegrationsMarketplace';

// Hooks
import { usePermissions } from './hooks/usePermissions';

// GC Settings Pages
import GCProfileSettings from './pages/gc/settings/ProfileSettings';
import GCCompanySettings from './pages/gc/settings/CompanySettings';
import GCInsuranceSettings from './pages/gc/settings/InsuranceSettings';
import GCNotificationSettings from './pages/gc/settings/NotificationSettings';
import GCTeamSettings from './pages/gc/settings/TeamSettings';
import GCIntegrationSettings from './pages/gc/settings/IntegrationSettings';

// Contractor Settings Pages
import ContractorProfileSettings from './pages/contractor/settings/ProfileSettings';
import ContractorCompanySettings from './pages/contractor/settings/CompanySettings';
import ContractorInsuranceSettings from './pages/contractor/settings/InsuranceSettings';
import ContractorNotificationSettings from './pages/contractor/settings/NotificationSettings';
import ContractorDocumentSettings from './pages/contractor/settings/DocumentSettings';

// Broker Settings Pages
import BrokerProfileSettings from './pages/broker/settings/ProfileSettings';
import BrokerAgencySettings from './pages/broker/settings/AgencySettings';
import BrokerClientSettings from './pages/broker/settings/ClientSettings';
import BrokerNotificationSettings from './pages/broker/settings/NotificationSettings';

// Shared Settings Pages
import ReferralSettings from './pages/shared/settings/ReferralSettings';

// Admin Pages
import ReferralManagementPage from './pages/admin/ReferralManagementPage';

/**
 * Authenticated App Routes
 * Includes OAuth authentication and RBAC protection
 */
const AuthenticatedAppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<CallbackPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Public Design System Routes */}
      <Route path="/" element={<DesignSystemHome />} />
      <Route path="/colors" element={<Colors />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard - Role-based redirect */}
        <Route path="dashboard" element={<DashboardRedirect />} />

        {/* Manager Routes */}
        <Route
          path="manager/*"
          element={
            <ProtectedRoute requiredRole="manager">
              <Routes>
                <Route index element={<Navigate to="/manager/dashboard" replace />} />
                <Route path="dashboard" element={<EnhancedManagerDashboard />} />
                <Route path="onboarding" element={<ManagerOnboarding />} />
                <Route path="tasks" element={<ManagerTasksPage />} />
                <Route path="projects" element={<ManagerProjectsPage />} />
                <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="subcontractors" element={<SubcontractorsPage />} />
                <Route path="broker" element={<ManagerMyBrokerPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="marketplace" element={<InsuranceMarketplace />} />
                {/* TODO: Re-enable when integrations feature is ready */}
                {/* <Route path="integrations" element={<IntegrationsMarketplace />} /> */}
                <Route path="acknowledgements" element={<ManagerAcknowledgementsList />} />
                <Route path="notifications" element={<NotificationsAndApprovalsPage />} />
                <Route
                  path="users"
                  element={
                    <ProtectedRoute requiredPermission={Permission.USER_VIEW}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />
                {/* Settings Routes */}
                <Route path="settings" element={<Navigate to="/manager/settings/profile" replace />} />
                <Route path="settings/profile" element={<GCProfileSettings />} />
                <Route path="settings/company" element={<GCCompanySettings />} />
                <Route path="settings/insurance" element={<GCInsuranceSettings />} />
                <Route path="settings/notifications" element={<GCNotificationSettings />} />
                <Route path="settings/team" element={<GCTeamSettings />} />
                <Route path="settings/integrations" element={<GCIntegrationSettings />} />
                <Route path="settings/referrals" element={<ReferralSettings />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Subcontractor Routes */}
        <Route
          path="subcontractor/*"
          element={
            <ProtectedRoute requiredRole="subcontractor">
              <Routes>
                <Route index element={<Navigate to="/subcontractor/dashboard" replace />} />
                <Route path="dashboard" element={<EnhancedSubcontractorDashboard />} />
                <Route path="onboarding" element={<SubcontractorOnboarding />} />
                <Route path="relationships" element={<MyManagersPage />} />
                <Route path="broker" element={<MyBrokerPage />} />
                <Route path="projects" element={<SubcontractorProjectsPage />} />
                <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="notifications" element={<NotificationsAndApprovalsPage />} />
                {/* Settings Routes */}
                <Route path="settings" element={<Navigate to="/subcontractor/settings/profile" replace />} />
                <Route path="settings/profile" element={<ContractorProfileSettings />} />
                <Route path="settings/company" element={<ContractorCompanySettings />} />
                <Route path="settings/insurance" element={<ContractorInsuranceSettings />} />
                <Route path="settings/notifications" element={<ContractorNotificationSettings />} />
                <Route path="settings/documents" element={<ContractorDocumentSettings />} />
                <Route path="settings/referrals" element={<ReferralSettings />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Broker Routes */}
        <Route
          path="broker/*"
          element={
            <ProtectedRoute requiredRole="broker">
              <Routes>
                <Route index element={<Navigate to="/broker/dashboard" replace />} />
                <Route path="dashboard" element={<EnhancedBrokerDashboard />} />
                <Route path="onboarding" element={<BrokerOnboarding />} />
                <Route path="clients" element={<BrokerClientsPage />} />
                <Route path="projects" element={<BrokerProjectsPage />} />
                <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="team" element={<BrokerTeamPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="acknowledgements" element={<BrokerAcknowledgementList />} />
                <Route path="acknowledgements/:formId" element={<BrokerAcknowledgementFormPage />} />
                <Route path="marketplace" element={<InsuranceMarketplace />} />
                <Route path="notifications" element={<NotificationsAndApprovalsPage />} />
                {/* Settings Routes */}
                <Route path="settings" element={<Navigate to="/broker/settings/profile" replace />} />
                <Route path="settings/profile" element={<BrokerProfileSettings />} />
                <Route path="settings/agency" element={<BrokerAgencySettings />} />
                <Route path="settings/clients" element={<BrokerClientSettings />} />
                <Route path="settings/notifications" element={<BrokerNotificationSettings />} />
                <Route path="settings/referrals" element={<ReferralSettings />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Placeholder for future */}
        <Route
          path="admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <Routes>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<div>Admin Dashboard (Coming Soon)</div>} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="referrals" element={<ReferralManagementPage />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Route Aliases - Map old paths to new paths for backward compatibility */}
        <Route path="gc/*" element={<RouteAlias from="gc" to="manager" />} />
        <Route path="contractor/*" element={<RouteAlias from="contractor" to="subcontractor" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

/**
 * Dashboard Redirect Component
 * Redirects to role-specific dashboard
 */
const DashboardRedirect = () => {
  const { currentRole } = usePermissions();

  switch (currentRole) {
    case 'manager':
      return <Navigate to="/manager/dashboard" replace />;
    case 'subcontractor':
      return <Navigate to="/subcontractor/dashboard" replace />;
    case 'broker':
      return <Navigate to="/broker/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

/**
 * Route Alias Redirect Component
 * Redirects from old paths to new paths while preserving the rest of the URL
 */
interface RouteAliasProps {
  from: string;
  to: string;
}

const RouteAlias = ({ from, to }: RouteAliasProps) => {
  const location = useLocation();
  // Replace the prefix in the pathname
  const newPath = location.pathname.replace(`/${from}`, `/${to}`);
  return <Navigate to={newPath + location.search + location.hash} replace />;
};

export default AuthenticatedAppRoutes;
