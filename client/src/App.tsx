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
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();

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
      <Route path="/customers">
        {() => (
          <DashboardLayoutCustom>
            <ProtectedRoute component={Customers} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
