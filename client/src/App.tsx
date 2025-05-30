import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import RaffleDetail from "@/pages/RaffleDetail";
import Winners from "@/pages/Winners";
import HowItWorks from "@/pages/HowItWorks";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Admin from "@/pages/Admin";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import HowToBuyCrypto from "@/pages/HowToBuyCrypto";
import { useEffect } from "react";
import { webSocketService } from "@/lib/websocket";
import { ThemeProvider } from "@/contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/raffles" component={Home} />
      <Route path="/raffle/:id" component={RaffleDetail} />
      <Route path="/winners" component={Winners} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/how-to-buy-crypto" component={HowToBuyCrypto} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/login" component={Login} />
      <Route path="/admin-login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Connect to WebSocket on mount
  useEffect(() => {
    webSocketService.connect();
    
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
