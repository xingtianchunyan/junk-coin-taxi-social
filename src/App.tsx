
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AccessCodeProvider } from "@/components/AccessCodeProvider";
import Layout from "./components/Layout";
import RoleSelection from "./pages/RoleSelection";
import PassengerService from "./pages/PassengerService";
import VehicleSharing from "./pages/VehicleSharing";
import VehicleApplication from "./pages/VehicleApplication";
import WorkSchedule from "./pages/WorkSchedule";
import PaymentManagement from "./pages/PaymentManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
              <Route path="/vehicle-sharing" element={<VehicleSharing />} />
              <Route path="/vehicle-application" element={<VehicleApplication />} />
              <Route path="/work-schedule" element={<WorkSchedule />} />
              <Route path="/payment-management" element={<PaymentManagement />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </AccessCodeProvider>
  </QueryClientProvider>
);

export default App;
