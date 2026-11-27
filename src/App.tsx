/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RequireAdmin, RequireAuth } from './components/auth/RouteGuards';
import { ToastStack } from './components/ui/ToastStack';
import { AdminLayout } from './layouts/AdminLayout';
import { AppLayout } from './layouts/AppLayout';
import { CalendarPage } from './pages/CalendarPage';
import { CheckInPage } from './pages/CheckInPage';
import { HomePage } from './pages/HomePage';
import { InsightsPage } from './pages/InsightsPage';
import { JournalPage } from './pages/JournalPage';
import { LoginPage } from './pages/LoginPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { WisdomPage } from './pages/WisdomPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';
import { AdminExportPage } from './pages/admin/AdminExportPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminParametersPage } from './pages/admin/AdminParametersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AuthProvider } from './providers/AuthProvider';
import { LunaraProvider } from './providers/LunaraProvider';

export default function App() {
  return (
    <AuthProvider>
      <LunaraProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Protected User & App Routes */}
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/check-in" element={<CheckInPage />} />
                <Route path="/journal" element={<JournalPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/wisdom" element={<WisdomPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Role-Protected Admin Routes */}
            <Route element={<RequireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminOverviewPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
                <Route path="/admin/export" element={<AdminExportPage />} />
                <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                <Route path="/admin/content" element={<AdminContentPage />} />
                <Route path="/admin/parameters" element={<AdminParametersPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/audit" element={<AdminAuditPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastStack />
        </BrowserRouter>
      </LunaraProvider>
    </AuthProvider>
  );
}
