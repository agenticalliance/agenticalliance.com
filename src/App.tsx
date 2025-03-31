import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Initialize React Query client
const queryClient = new QueryClient();

/**
 * The root application component.
 * Sets up essential context providers (React Query, Tooltip, Toasters)
 * and defines the main application routing using React Router.
 */
const App = () => (
  // Provide React Query client to the app
  <QueryClientProvider client={queryClient}>
    {/* Provide tooltip functionality */}
    <TooltipProvider>
      {/* Toaster components for displaying notifications */}
      <Toaster />
      <Sonner />
      {/* Set up client-side routing */}
      <BrowserRouter>
        <Routes>
          {/* Main index route */}
          <Route path="/" element={<Index />} />
          {/* --- Add Custom Routes Above This Line --- */}
          {/* Catch-all route for pages not found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
