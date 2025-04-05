import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BettingGame from "@/pages/BettingGame";
import GameHistory from "@/pages/GameHistory";
import AdminPanel from "@/pages/AdminPanel";
import Login from "@/pages/Login";
import Support from "@/pages/Support";
import { useAuth, AuthProvider } from "@/hooks/use-auth";

function Main() {
  const { user, loading, checkAuth } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Redirect to login if not authenticated and trying to access protected routes
    if (!loading && !user && location !== "/login") {
      setLocation("/login");
      toast({
        title: "Authentication required",
        description: "Please login to access the betting game.",
        variant: "destructive",
      });
    }
    
    // Redirect to betting if admin tries to access admin panel without permissions
    if (!loading && user && !user.isAdmin && location === "/admin") {
      setLocation("/");
      toast({
        title: "Access denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
    }
  }, [user, loading, location, setLocation, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-primary"></div>
      </div>
    );
  }

  // If the user is not logged in, show only the login page
  if (!user && location !== "/login") {
    return <Login />;
  }

  // If we're on the login page and already logged in, redirect to home
  if (user && location === "/login") {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-grow p-4 md:p-6 overflow-auto">
          <Switch>
            <Route path="/" component={BettingGame} />
            <Route path="/history" component={GameHistory} />
            <Route path="/admin" component={AdminPanel} />
            <Route path="/support" component={Support} />
            <Route path="/login" component={Login} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Main />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
