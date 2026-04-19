import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Wallet, Percent, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

function fmtBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtPct(val: number) {
  return val.toFixed(1) + "%";
}

export default function Reports() {
  const [, navigate] = useLocation();
  const { data: investment, isLoading: invLoading } = trpc.dashboard.investmentStats.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: installmentsData, isLoading: instLoading } = trpc.installments.listByUser.useQuery({ limit: 2000, offset: 0 });

  const isLoading = invLoading || statsLoading || instLoading;

  const contractStats = useMemo(() => {
    const all: any[] = installmentsData?.data || [];
    const map = new Map<string, {
      contractId: number;
      contractNumber: string;
      customerName: string;
      interestReceived: number;
      capitalPaid: number;
      pending: number;
    }>();

    all.forEach(i => {
      if (!map.has(i.contractNumber)) {
        map.set(i.contractNumber, {
          contractId: i.contractId,
          contractNumber: i.contractNumber,
          customerName: i.customerName || "—",
          interestReceived: 0,
          capitalPaid: 0,
          pending: 0,
        });
      }
      const entry = map.get(i.contractNumber)!;
      if (i.status === "paid") {
        entry.interestReceived += parseFloat(i.interestPaid || i.paidValue || 0);
        entry.capitalPaid += parseFloat(i.capitalPaid || 0);
      } else {
        entry.pending += parseFloat(i.value || 0);
      }
    });

    return Array.from(map.values())
      .filter(c => c.interestReceived > 0 || c.pending > 0)
      .sort((a, b) => b.interestReceived - a.interestReceived);
  }, [installmentsData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const rentabilidade = investment && investment.totalInvested > 0
    ? (investment.totalInterestReceived / investment.totalInvested) * 100
    : 0;

  const monthlyData = stats?.monthlyChart || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Relatórios
        </h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da carteira</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Capital em carteira</p>
                <p className="text-xl font-bold text-gray-800">{fmtBRL(investment?.capitalRemaining ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Juros recebidos</p>
                <p className="text-xl font-bold text-emerald-600">{fmtBRL(investment?.totalInterestReceived ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Percent className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Rentabilidade total</p>
                <p className="text-xl font-bold text-indigo-600">{fmtPct(rentabilidade)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly chart */}
      {monthlyData.length > 0 && (
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700">Recebimentos mensais</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barGap={4} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={48} />
                <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                <Bar dataKey="recebido" name="Recebido" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((_, i) => (
                    <Cell key={i} fill={i === monthlyData.length - 1 ? "#2563eb" : "#93c5fd"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-contract table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-1 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700">Juros por contrato</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {contractStats.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum dado ainda</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-2 text-xs text-gray-400 font-medium">Cliente</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-400 font-medium">Juros recebidos</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-400 font-medium hidden sm:table-cell">A receber</th>
                    <th className="px-5 py-2 w-24 hidden sm:table-cell" />
                  </tr>
                </thead>
                <tbody>
                  {contractStats.map((c, idx) => {
                    const total = c.interestReceived + c.pending;
                    const pct = total > 0 ? (c.interestReceived / total) * 100 : 0;
                    return (
                      <tr
                        key={c.contractNumber}
                        onClick={() => navigate(`/contracts/${c.contractId}`)}
                        className={`cursor-pointer hover:bg-slate-50 transition-colors border-b border-gray-50 last:border-0 ${idx % 2 === 0 ? "" : "bg-slate-50/30"}`}
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800 truncate max-w-[140px] sm:max-w-none">{c.customerName}</p>
                          <p className="text-xs text-gray-400">{c.contractNumber}</p>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-emerald-600">
                          {fmtBRL(c.interestReceived)}
                        </td>
                        <td className="px-3 py-3 text-right text-amber-600 hidden sm:table-cell">
                          {c.pending > 0 ? fmtBRL(c.pending) : "—"}
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <div className="w-20">
                            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                              <span>{fmtPct(pct)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
