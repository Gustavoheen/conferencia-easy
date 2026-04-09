import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronRight, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

function fmtBRL(val: any) {
  return `R$ ${parseFloat(val || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function fmtDate(val: any) {
  return new Date(val).toLocaleDateString("pt-BR");
}

export default function Expirations() {
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "paid" | "overdue">("");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = trpc.installments.listByUser.useQuery({
    limit: 200,
    offset: 0,
  });

  const markAsPaidMutation = trpc.installments.markAsPaid.useMutation({
    onSuccess: () => { toast.success("Parcela marcada como paga!"); refetch(); },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const installments: any[] = data?.data || [];

  const filtered = useMemo(() =>
    statusFilter ? installments.filter(i => i.status === statusFilter) : installments,
    [installments, statusFilter]
  );

  // Group by month/year
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    filtered.forEach(item => {
      const d = new Date(item.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const totals = useMemo(() => ({
    total: installments.length,
    pending: installments.filter(i => i.status === "pending").length,
    overdue: installments.filter(i => i.status === "overdue").length,
    paid: installments.filter(i => i.status === "paid").length,
    pendingValue: installments.filter(i => i.status !== "paid").reduce((s, i) => s + parseFloat(i.value || 0), 0),
  }), [installments]);

  const toggleMonth = (key: string) => {
    setCollapsedMonths(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === "paid")    return <span className="badge-paid flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/>Pago</span>;
    if (status === "overdue") return <span className="badge-overdue flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>Atrasado</span>;
    return <span className="badge-pending flex items-center gap-1"><Clock className="w-3 h-3"/>Pendente</span>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Carregando vencimentos...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-600" />
          Vencimentos
        </h1>
        <p className="text-gray-500 text-sm mt-1">Parcelas agrupadas por mês de vencimento</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Total parcelas</p>
            <p className="text-2xl font-bold text-gray-800">{totals.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600">{totals.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Atrasadas</p>
            <p className="text-2xl font-bold text-red-600">{totals.overdue}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">A receber</p>
            <p className="text-lg font-bold text-blue-600">{fmtBRL(totals.pendingValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["", "pending", "overdue", "paid"] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
            }`}
          >
            {s === "" ? "Todos" : s === "pending" ? "Pendentes" : s === "overdue" ? "Atrasados" : "Pagos"}
          </button>
        ))}
      </div>

      {/* Month groups */}
      {grouped.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-gray-400">
            Nenhuma parcela encontrada
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([key, items]) => {
            const [year, month] = key.split("-");
            const monthName = MONTH_NAMES[parseInt(month) - 1];
            const isCollapsed = collapsedMonths.has(key);
            const monthTotal = items.reduce((s, i) => s + parseFloat(i.value || 0), 0);
            const hasOverdue = items.some(i => i.status === "overdue");
            const allPaid = items.every(i => i.status === "paid");

            return (
              <Card key={key} className={`border-0 shadow-sm overflow-hidden ${hasOverdue ? "ring-1 ring-red-200" : ""}`}>
                {/* Month header */}
                <button
                  onClick={() => toggleMonth(key)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    <div className="text-left">
                      <span className="font-semibold text-gray-800">{monthName} {year}</span>
                      <span className="ml-3 text-sm text-gray-500">{items.length} parcela{items.length !== 1 ? "s" : ""}</span>
                    </div>
                    {hasOverdue && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Atrasado</span>}
                    {allPaid && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Tudo pago</span>}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-800">{fmtBRL(monthTotal)}</span>
                  </div>
                </button>

                {/* Items */}
                {!isCollapsed && (
                  <div className="border-t border-gray-100">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 px-5 py-3 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} ${item.status === "overdue" ? "bg-red-50/50" : ""}`}
                      >
                        {/* Date */}
                        <div className="w-20 flex-shrink-0 text-sm text-gray-500">{fmtDate(item.dueDate)}</div>

                        {/* Client + contract */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{item.customerName || "—"}</p>
                          <p className="text-xs text-gray-400">{item.contractNumber} · Parcela #{item.installmentNumber}</p>
                        </div>

                        {/* Value */}
                        <div className="text-sm font-semibold text-gray-800 w-28 text-right">{fmtBRL(item.value)}</div>

                        {/* Status */}
                        <div className="w-24 flex justify-center">{getStatusBadge(item.status)}</div>

                        {/* Action */}
                        <div className="w-24 flex justify-end">
                          {item.status !== "paid" ? (
                            <Button
                              size="sm"
                              onClick={() => markAsPaidMutation.mutate({ id: item.id, paidValue: item.value })}
                              disabled={markAsPaidMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-3"
                            >
                              Receber
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">{item.paidDate ? fmtDate(item.paidDate) : "—"}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
