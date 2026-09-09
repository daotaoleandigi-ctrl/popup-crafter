import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import { lazy, Suspense } from "react";
const Index = lazy(() => import("./pages/Index"));
const Demo = lazy(() => import("./pages/Demo"));
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthGate>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Suspense
            fallback={
              <p role="status" className="p-10 text-center">
                Đang tải…
              </p>
            }
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/demo" element={<Demo />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
