import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayoutCustom from "./components/DashboardLayoutCustom";
import Home from "./pages/Home";
import Customers from "./pages/Customers";
import Contracts from "./pages/Contracts";
import Expirations from "./pages/Expirations";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Support from "./pages/Support";
import Calculator from "./pages/Calculator";
import AdminUsers from "./pages/AdminUsers";
import CustomerDetail from "./pages/CustomerDetail";
import ContractDetail from "./pages/ContractDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-blue-600 animate-fade-out">
      <img src="/icons/icon.svg" alt="Logo" className="w-24 h-24 rounded-2xl shadow-2xl mb-4" />
      <span className="text-white text-2xl font-bold tracking-wide">Conferência Easy</span>
      <span className="text-blue-200 text-sm mt-1">Gestão de juros e contratos</span>
    </div>
  );
}

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (adminOnly && user?.role !== "admin") {
    navigate("/");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Rotas públicas */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Rotas protegidas */}
      <Route path="/">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={Home} />
          </DashboardLayoutCustom>
        )}
      </Route>
      <Route path="/customers/:id">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={CustomerDetail} />
          </DashboardLayoutCustom>
        )}
      </Route>
      <Route path="/customers">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={Customers} />
          </DashboardLayoutCustom>
        )}
      </Route>
      <Route path="/contracts/:id">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={ContractDetail} />
          </DashboardLayoutCustom>
        )}
      </Route>
      <Route path="/contracts">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={Contracts} />
          </DashboardLayoutCustom>
        )}
      </Route>
      <Route path="/expirations">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={Expirations} />
          </DashboardLayoutCustom>
        )}
      </Route>
      <Route path="/reports">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={Reports} />
          </DashboardLayoutCustom>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={Profile} />
          </DashboardLayoutCustom>
        )}
      </Route>
      <Route path="/help">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={Help} />
          </DashboardLayoutCustom>
        )}
      </Route>
      <Route path="/support">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={Support} />
          </DashboardLayoutCustom>
        )}
      </Route>
      <Route path="/admin/users">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={AdminUsers} adminOnly />
          </DashboardLayoutCustom>
        )}
      </Route>
      <Route path="/calculator">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={Calculator} />
          </DashboardLayoutCustom>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {showSplash && <SplashScreen />}
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
