import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/layouts/ProtectedRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";

import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Search from "@/pages/Search";
import ProfessionalProfile from "@/pages/ProfessionalProfile";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";

import DashboardHome from "@/pages/dashboard/Index";
import DashCalendar from "@/pages/dashboard/Calendar";
import DashBookings from "@/pages/dashboard/Bookings";
import DashAvailability from "@/pages/dashboard/Availability";
import DashNotifications from "@/pages/dashboard/Notifications";
import DashProfile from "@/pages/dashboard/Profile";
import DashAnalytics from "@/pages/dashboard/Analytics";
import DashSettings from "@/pages/dashboard/Settings";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<Search />} />
            <Route path="/professionals/:id" element={<ProfessionalProfile />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="calendar" element={<DashCalendar />} />
              <Route path="bookings" element={<DashBookings />} />
              <Route path="availability" element={<DashAvailability />} />
              <Route path="notifications" element={<DashNotifications />} />
              <Route path="profile" element={<DashProfile />} />
              <Route path="analytics" element={<DashAnalytics />} />
              <Route path="settings" element={<DashSettings />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
