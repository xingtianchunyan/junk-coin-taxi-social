
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "./components/Layout";
import RoleSelection from "./pages/RoleSelection";
import PassengerService from "./pages/PassengerService";
import WorkSchedule from "./pages/WorkSchedule";
import CommunityManagement from "./pages/CommunityManagement";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<RoleSelection />} />
              <Route path="/passenger" element={<PassengerService />} />
              <Route path="/work-schedule" element={<WorkSchedule />} />
              <Route path="/community-management" element={<CommunityManagement />} />
              <Route path="/super-admin" element={<SuperAdmin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
