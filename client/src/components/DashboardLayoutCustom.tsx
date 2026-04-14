import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import {
  Menu, LogOut, LayoutDashboard, Users, FileText,
  CalendarClock, BarChart3, HelpCircle, UserCircle, Headphones,
  ChevronRight, ShieldCheck, Calculator,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { label: 'Dashboard',    href: '/',            icon: LayoutDashboard },
  { label: 'Clientes',     href: '/customers',   icon: Users },
  { label: 'Contratos',    href: '/contracts',   icon: FileText },
  { label: 'Vencimentos',  href: '/expirations', icon: CalendarClock },
  { label: 'Relatórios',   href: '/reports',     icon: BarChart3 },
  { label: 'Calculadora',  href: '/calculator',  icon: Calculator },
];

const adminItems = [
  { label: 'Usuários',     href: '/admin/users', icon: ShieldCheck },
];

const bottomItems = [
  { label: 'Perfil',    href: '/profile', icon: UserCircle },
  { label: 'Como usar', href: '/help',    icon: HelpCircle },
  { label: 'Suporte',   href: '/support', icon: Headphones },
];

// Mobile bottom nav items (most used)
const mobileNavItems = [
  { label: 'Início',       href: '/',            icon: LayoutDashboard },
  { label: 'Clientes',     href: '/customers',   icon: Users },
  { label: 'Vencimentos',  href: '/expirations', icon: CalendarClock },
  { label: 'Calc',         href: '/calculator',  icon: Calculator },
  { label: 'Contratos',    href: '/contracts',   icon: FileText },
];

// Bolt + Dollar SVG logo component (mask technique — $ as negative space cuts)
function BoltDollarLogo({ size = 36 }: { size?: number }) {
  const id = `bolt-mask-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`bg-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d4ed8"/>
          <stop offset="100%" stopColor="#0a1628"/>
        </linearGradient>
        <mask id={id}>
          <rect width="512" height="512" fill="black"/>
          <path d="M296 46 L138 272 L242 272 L208 466 L374 240 L270 240 Z" fill="white"/>
          <rect x="0" y="186" width="512" height="28" fill="black"/>
          <rect x="0" y="322" width="512" height="28" fill="black"/>
        </mask>
      </defs>
      <rect width="512" height="512" rx="88" fill={`url(#bg-${size})`}/>
      <rect width="512" height="512" fill="white" mask={`url(#${id})`}/>
    </svg>
  );
}

export default function DashboardLayoutCustom({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  const handleNavigation = (href: string) => {
    navigate(href);
    setSidebarOpen(false);
  };

  const NavItem = ({ item }: { item: typeof navigationItems[0] }) => {
    const isActive = location === item.href;
    const Icon = item.icon;
    return (
      <li>
        <button
          onClick={() => handleNavigation(item.href)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
            isActive
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-blue-200 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} />
          <span className="flex-1 text-left">{item.label}</span>
          {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
        </button>
      </li>
    );
  };

  return (
    <div className="flex h-[100dvh] bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-40 flex flex-col h-[100dvh] w-60 flex-shrink-0 bg-gradient-to-b from-[#1e3a6e] to-[#142954] shadow-xl transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <BoltDollarLogo size={36} />
            <div>
              <p className="font-bold text-white text-sm leading-tight">Conferência</p>
              <p className="font-extrabold text-blue-300 text-base leading-tight tracking-wide">Valores Easy</p>
            </div>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-blue-400 text-[10px] font-semibold uppercase tracking-widest mb-2 px-3">Menu</p>
          <ul className="space-y-0.5">
            {navigationItems.map(item => <NavItem key={item.href} item={item} />)}
          </ul>

          {user?.role === "admin" && (
            <>
              <p className="text-blue-400 text-[10px] font-semibold uppercase tracking-widest mb-2 mt-6 px-3">Admin</p>
              <ul className="space-y-0.5">
                {adminItems.map(item => <NavItem key={item.href} item={item} />)}
              </ul>
            </>
          )}

          <p className="text-blue-400 text-[10px] font-semibold uppercase tracking-widest mb-2 mt-6 px-3">Conta</p>
          <ul className="space-y-0.5">
            {bottomItems.map(item => <NavItem key={item.href} item={item} />)}
          </ul>
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/10">
            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name || 'Usuário'}</p>
              <p className="text-blue-300 text-xs capitalize">{user?.role || 'user'}</p>
            </div>
            <button
              onClick={logout}
              className="text-blue-300 hover:text-white transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 h-14 flex items-center justify-between flex-shrink-0 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <BoltDollarLogo size={28} />
              <span className="font-bold text-slate-700 text-sm">Conferência <span className="text-blue-600">Valores Easy</span></span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:block text-sm text-slate-500">Olá,</span>
            <span className="hidden md:block text-sm font-semibold text-slate-700">{user?.name || 'Usuário'}</span>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ml-1">
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto overscroll-contain pb-16 md:pb-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-area-inset-bottom">
          <div className="flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {mobileNavItems.map(item => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 md:hidden z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
