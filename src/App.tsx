
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { config } from '@/config/wagmi';
import { AccessCodeProvider } from "@/components/AccessCodeProvider";
import Layout from "./components/Layout";
import RoleSelection from "./pages/RoleSelection";
import PassengerService from "./pages/PassengerService";
import WorkSchedule from "./pages/WorkSchedule";
import CommunityManagement from "./pages/CommunityManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <AccessCodeProvider>
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
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </AccessCodeProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
