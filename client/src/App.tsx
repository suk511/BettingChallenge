import { useEffect, useState } from "react";
import { Switch, Route, useLocation, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BettingGame from "@/pages/BettingGame";
import NewBettingGame from "@/pages/NewBettingGame";
import MobileBettingGame from "@/pages/MobileBettingGame";
import GameHistory from "@/pages/GameHistory";
import AdminPanel from "@/pages/AdminPanel";
import Login from "@/pages/Login";
import Support from "@/pages/Support";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

// Get the base path for GitHub Pages
const basePath = import.meta.env.VITE_BASE_PATH || '';

function Main() {
  const { user, loading, checkAuth } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobileDevice = useIsMobile();
  
  // Check if we're on an admin route
  const isAdminRoute = location.startsWith("/admin");
  // Check if we're using the mobile UI
  const isMobileUI = location === "/mobile";
  // Direct admin panel path for quick access
  const isAdminPanel = location === "/adminpanel";

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Handle admin routes separately
    if (isAdminRoute || isAdminPanel) {
      // Allow access to admin login page always
      if (location === "/admin/login") return;
      
      // Redirect to admin login if not authenticated on other admin pages
      if (!loading && !user) {
        setLocation("/admin/login");
        toast({
          title: "Authentication required",
          description: "Please login to access the admin panel.",
          variant: "destructive",
        });
      }
      
      // Redirect to main site if authenticated but not an admin
      if (!loading && user && !user.isAdmin) {
        setLocation("/");
        toast({
          title: "Access denied",
          description: "You don't have permission to access the admin panel.",
          variant: "destructive",
        });
      }
      
      // Redirect from /adminpanel to /admin
      if (isAdminPanel && !loading && user && user.isAdmin) {
        setLocation("/admin");
      }
      
      return;
    }
    
    // Non-admin routes: Standard authentication checks
    if (!loading && !user && location !== "/login") {
      setLocation("/login");
      toast({
        title: "Authentication required",
        description: "Please login to access the betting game.",
        variant: "destructive",
      });
    }
    
    // If we're on the login page and already logged in, redirect to home
    if (!loading && user && location === "/login") {
      setLocation("/");
    }
  }, [user, loading, location, setLocation, toast, isAdminRoute]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-primary"></div>
      </div>
    );
  }
  
  // Handle admin routes
  if (isAdminRoute) {
    // Show only the login for admin routes when not authenticated
    if (!user && location !== "/admin/login") {
      return <AdminLogin />;
    }
    
    // Show the admin dashboard based on routes
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // For mobile UI path or if on a mobile device, show the mobile interface without sidebar/header
  if (isMobileUI || isMobileDevice) {
    // Show login for mobile UI when not authenticated
    if (!user) {
      return <Login />;
    }
    
    return <MobileBettingGame />;
  }

  // Standard user login check for main site
  if (!user && location !== "/login") {
    return <Login />;
  }

  // Standard website UI with header and sidebar
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-grow p-4 md:p-6 overflow-auto">
          <Switch>
            <Route path="/" component={BettingGame} />
            <Route path="/new" component={NewBettingGame} />
            <Route path="/history" component={GameHistory} />
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
      <Router base={basePath}>
        <AuthProvider>
          <Main />
          <Toaster />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
