import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Loader2, Users, FileText, AlertTriangle, CalendarCheck, TrendingUp, Wallet } from "lucide-react";

function fmtBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Home() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const summaryCards = [
    { label: "Clientes", value: stats.customerCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Contratos ativos", value: stats.contractCount, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Vencendo hoje", value: stats.todayCount, icon: CalendarCheck, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Em atraso", value: stats.overdueCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
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
            <Card key={card.label} className="border-0 shadow-sm">
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
        <Card className="border-0 shadow-sm">
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
        <Card className="border-0 shadow-sm">
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
