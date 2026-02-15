import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { ProtectedRoute } from "@/components/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { QueryProvider } from "@/lib/query-provider";

// Auth pages
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";

// App pages
import DashboardPage from "@/pages/dashboard";
import IncidentsPage from "@/pages/incidents/index";
import IncidentDetailPage from "@/pages/incidents/[id]";
import ResourcesPage from "@/pages/resources/index";
import ResourceDetailPage from "@/pages/resources/[id]";
import MapPage from "@/pages/map";
import AlertsPage from "@/pages/alerts";
import {
  TasksPage,
  MessagingPage,
  TeamsPage,
  DonationsPage,
  ReportsPage,
  EvacuationPage,
  DocumentsPage,
  SettingsPage,
  AdminPage,
} from "@/pages/placeholder-pages";

import "./index.css";

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes (wrapped in AppShell) */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/resources/:id" element={<ResourceDetailPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/messaging" element={<MessagingPage />} />
            <Route path="/messaging/:channelId" element={<MessagingPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/donations" element={<DonationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/evacuation" element={<EvacuationPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
