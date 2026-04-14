import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Loader2, Users, FileText, AlertTriangle, CalendarCheck, TrendingUp, Wallet, Banknote, ArrowDownCircle, Clock3, Percent, PiggyBank, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

function fmtBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: investment } = trpc.dashboard.investmentStats.useQuery();
  const { data: masterStats } = trpc.dashboard.masterStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const summaryCards = [
    { label: "Clientes", value: stats.customerCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50", href: "/customers" },
    { label: "Contratos ativos", value: stats.contractCount, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50", href: "/contracts" },
    { label: "Vencendo hoje", value: stats.todayCount, icon: CalendarCheck, color: "text-amber-600", bg: "bg-amber-50", href: "/expirations" },
    { label: "Em atraso", value: stats.overdueCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", href: "/expirations" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Resumo da sua carteira de contratos</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-95"
              onClick={() => navigate(card.href)}
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                    <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/contracts")}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total em contratos</p>
                <p className="text-xl font-bold text-gray-800">{fmtBRL(stats.totalContractsValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/expirations")}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total recebido</p>
                <p className="text-xl font-bold text-emerald-600">{fmtBRL(stats.totalReceived)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment tracking */}
      {investment && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Meu Investimento</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Capital investido", value: fmtBRL(investment.totalInvested), icon: Banknote, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Capital recuperado", value: fmtBRL(investment.capitalRecovered), icon: ArrowDownCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Falta recuperar", value: fmtBRL(investment.capitalRemaining), icon: Clock3, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Juros recebidos", value: fmtBRL(investment.totalInterestReceived), icon: Percent, color: "text-green-600", bg: "bg-green-50" },
              { label: "Total recebido", value: fmtBRL(investment.totalReceived), icon: PiggyBank, color: "text-indigo-600", bg: "bg-indigo-50" },
            ].map(card => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="border-0 shadow-sm">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                        <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {investment.totalInvested > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Capital recuperado</span>
                <span>{Math.round((investment.capitalRecovered / investment.totalInvested) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (investment.capitalRecovered / investment.totalInvested) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Master admin stats */}
      {user?.role === "admin" && masterStats && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Visão Master — Todos os Usuários
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin/users")}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500 mb-1">Usuários ativos</p>
                <p className="text-2xl font-bold text-blue-600">{masterStats.userCount}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500 mb-1">Contratos na plataforma</p>
                <p className="text-2xl font-bold text-indigo-600">{masterStats.contractCount}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500 mb-1">Parcelas em atraso</p>
                <p className="text-2xl font-bold text-red-600">{masterStats.overdueCount}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500 mb-1">Total em contratos</p>
                <p className="text-lg font-bold text-gray-800">{fmtBRL(masterStats.totalContractsValue)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500 mb-1">Total recebido</p>
                <p className="text-lg font-bold text-emerald-600">{fmtBRL(masterStats.totalReceived)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500 mb-1">A receber (pendente)</p>
                <p className="text-lg font-bold text-amber-600">{fmtBRL(masterStats.totalPending)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800">Previsto × Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyChart.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Nenhum dado ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.monthlyChart} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => fmtBRL(v)} />
                  <Legend />
                  <Bar dataKey="previsto" name="Previsto" fill="#bfdbfe" radius={[4,4,0,0]} />
                  <Bar dataKey="recebido" name="Recebido" fill="#2563eb" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800">Recebimentos ao longo do tempo</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.monthlyChart.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                Nenhum dado ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => fmtBRL(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="recebido" name="Recebido" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="previsto" name="Previsto" stroke="#93c5fd" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
