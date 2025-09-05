import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppSidebar, CustomSidebarTrigger } from "@/components/Sidebar/AppSidebar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ChatPage from "./pages/ChatPage";
import Pricing from "./pages/Pricing";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <SidebarInset>
                {/* Header with sidebar trigger */}
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="flex items-center gap-2 px-4 w-full">
                    <CustomSidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      ShadowAI
                    </h1>
                  </div>
                </header>
                
                {/* Main content */}
                <main className="flex flex-1 flex-col">
                  <div className="flex-1 p-4">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/chat/:conversationId" element={<ChatPage />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/success" element={<Success />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
