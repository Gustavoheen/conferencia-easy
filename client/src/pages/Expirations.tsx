import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronRight, CalendarDays, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function fmtBRL(val: any) {
  return `R$ ${parseFloat(val || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function fmtDate(val: any) {
  const d = new Date(val);
  return d.toLocaleDateString("pt-BR");
}

function toLocalDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function SmartCalendar({
  installments,
  selectedDay,
  onSelectDay,
}: {
  installments: any[];
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
}) {
  const today = new Date();
  const [calMonth, setCalMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });

  // Build map: dateStr → { overdue, pending, paid }
  const dayMap = useMemo(() => {
    const map = new Map<string, { overdue: number; pending: number; paid: number }>();
    installments.forEach(item => {
      const d = new Date(item.dueDate);
      const key = toLocalDateStr(d);
      if (!map.has(key)) map.set(key, { overdue: 0, pending: 0, paid: 0 });
      const entry = map.get(key)!;
      if (item.status === "paid") entry.paid++;
      else if (item.status === "overdue") entry.overdue++;
      else entry.pending++;
    });
    return map;
  }, [installments]);

  const firstDay = new Date(calMonth.year, calMonth.month, 1);
  const lastDay = new Date(calMonth.year, calMonth.month + 1, 0);
  const startOffset = firstDay.getDay(); // 0=Sun

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    setCalMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };
  const nextMonth = () => {
    setCalMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const todayStr = toLocalDateStr(today);

  return (
    <Card className="border-0 shadow-sm mb-6">
      <CardContent className="pt-4 pb-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-gray-800 text-sm">
            {MONTH_NAMES[calMonth.month]} {calMonth.year}
          </span>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(w => (
            <div key={w} className="text-center text-[10px] font-semibold text-gray-400 py-1">{w}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = `${calMonth.year}-${String(calMonth.month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const entry = dayMap.get(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;

            return (
              <button
                key={idx}
                onClick={() => onSelectDay(isSelected ? null : dateStr)}
                className={`relative flex flex-col items-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected ? "bg-blue-600 text-white" :
                  isToday ? "bg-blue-50 text-blue-700 font-bold" :
                  "text-gray-600 hover:bg-slate-100"
                } ${entry ? "cursor-pointer" : "cursor-default"}`}
              >
                <span>{day}</span>
                {entry && (
                  <div className="flex gap-0.5 mt-0.5">
                    {entry.overdue > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    {entry.pending > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    {entry.paid > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 justify-center">
          <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Atrasado</span>
          <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Pendente</span>
          <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Pago</span>
        </div>
        {selectedDay && (
          <div className="mt-2 text-center">
            <button onClick={() => onSelectDay(null)} className="text-xs text-blue-600 hover:underline">
              Limpar filtro de data
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Expirations() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "paid" | "overdue">("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [payingItem, setPayingItem] = useState<any | null>(null);
  const [capitalInput, setCapitalInput] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data, isLoading, refetch } = trpc.installments.listByUser.useQuery({
    limit: 500,
    offset: 0,
  });

  const markAsPaidMutation = trpc.installments.markAsPaid.useMutation({
    onSuccess: () => {
      toast.success("Parcela marcada como paga!");
      setPayingItem(null);
      setCapitalInput("");
      refetch();
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const revertMutation = trpc.installments.revertPayment.useMutation({
    onSuccess: () => {
      toast.success("Pagamento estornado!");
      refetch();
    },
    onError: (err) => toast.error("Erro ao estornar: " + err.message),
  });

  const getPaymentInfo = (item: any) => {
    const principal = parseFloat(item.contractOriginalValue || "0");
    const rate = parseFloat(item.contractInterestRate || "0");
    const interest = principal * rate / 100;
    const installmentValue = parseFloat(item.value || "0");
    const capital = Math.max(0, installmentValue - interest);
    return { interest, capital, installmentValue };
  };

  const isFixedInstallmentContract = (item: any) =>
    item.contractType === "sac" || item.contractType === "installment";

  const handlePayInstallment = (item: any) => {
    const { installmentValue, capital } = getPaymentInfo(item);
    markAsPaidMutation.mutate({
      id: item.id,
      paidValue: installmentValue.toFixed(2),
      capitalPaid: capital.toFixed(2),
    });
  };

  const handlePayMinimum = (item: any) => {
    const { interest } = getPaymentInfo(item);
    markAsPaidMutation.mutate({ id: item.id, paidValue: interest.toFixed(2) });
  };

  const handlePayWithCapital = () => {
    if (!payingItem) return;
    const { interest } = getPaymentInfo(payingItem);
    const capital = parseFloat(capitalInput) || 0;
    if (capital <= 0) { toast.error("Informe um valor de capital maior que zero"); return; }
    const total = interest + capital;
    markAsPaidMutation.mutate({ id: payingItem.id, paidValue: total.toFixed(2), capitalPaid: capital.toFixed(2) });
  };

  const installments: any[] = data?.data || [];

  const uniqueCustomers = useMemo(() => {
    const seen = new Set<string>();
    const result: { name: string }[] = [];
    installments.forEach(i => {
      const name = i.customerName || "—";
      if (!seen.has(name)) { seen.add(name); result.push({ name }); }
    });
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [installments]);

  const filtered = useMemo(() => {
    let list = installments;
    if (customerFilter) list = list.filter(i => (i.customerName || "—") === customerFilter);
    if (statusFilter) list = list.filter(i => i.status === statusFilter);
    if (selectedDay) {
      list = list.filter(i => toLocalDateStr(new Date(i.dueDate)) === selectedDay);
    }
    return list;
  }, [installments, customerFilter, statusFilter, selectedDay]);

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

      {/* Smart Calendar */}
      <SmartCalendar
        installments={installments}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
      />

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

      {/* Customer filter */}
      {uniqueCustomers.length > 1 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2 font-medium">Filtrar por cliente:</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCustomerFilter("")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                customerFilter === ""
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
              }`}
            >
              Todos os clientes
            </button>
            {uniqueCustomers.map(c => (
              <button
                key={c.name}
                onClick={() => setCustomerFilter(customerFilter === c.name ? "" : c.name)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  customerFilter === c.name
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status filter */}
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
                        className={`flex items-center gap-2 md:gap-4 px-3 md:px-5 py-3 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} ${item.status === "overdue" ? "bg-red-50/50" : ""}`}
                      >
                        {/* Date */}
                        <div className="w-16 md:w-20 flex-shrink-0 text-xs md:text-sm text-gray-500">{fmtDate(item.dueDate)}</div>

                        {/* Client + contract - clickable */}
                        <button
                          className="flex-1 min-w-0 text-left hover:opacity-75 transition-opacity"
                          onClick={() => navigate(`/contracts/${item.contractId}`)}
                        >
                          <p className="font-medium text-gray-800 text-sm truncate">{item.customerName || "—"}</p>
                          <p className="text-xs text-gray-400">{item.contractNumber} · Parcela #{item.installmentNumber}</p>
                        </button>

                        {/* Value */}
                        <div className="text-sm font-semibold text-gray-800 w-24 text-right flex-shrink-0">{fmtBRL(item.value)}</div>

                        {/* Status */}
                        <div className="hidden md:flex w-24 justify-center">{getStatusBadge(item.status)}</div>

                        {/* Action */}
                        <div className="w-24 md:w-32 flex flex-col items-end gap-1 flex-shrink-0">
                          {item.status !== "paid" ? (
                            <Button
                              size="sm"
                              onClick={() => { setPayingItem(item); setCapitalInput(""); }}
                              disabled={markAsPaidMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-2 md:px-3"
                            >
                              Receber
                            </Button>
                          ) : (
                            <>
                              <span className="text-xs text-gray-400">{item.paidDate ? fmtDate(item.paidDate) : "—"}</span>
                              <button
                                onClick={() => {
                                  if (confirm("Estornar este pagamento?")) {
                                    revertMutation.mutate({ id: item.id });
                                  }
                                }}
                                disabled={revertMutation.isPending}
                                className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-40"
                              >
                                Estornar
                              </button>
                            </>
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

      {/* Modal de pagamento */}
      {payingItem && (() => {
        const info = getPaymentInfo(payingItem);
        const isFixed = isFixedInstallmentContract(payingItem);
        const extraCapital = parseFloat(capitalInput) || 0;
        const revolvingTotal = info.interest + extraCapital;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Registrar Recebimento</h2>
              <p className="text-sm text-gray-500 mb-4">
                {payingItem.customerName} · {payingItem.contractNumber} · Parcela #{payingItem.installmentNumber}
              </p>

              <div className="flex justify-between text-sm mb-4 px-1">
                <span className="text-gray-500">Saldo devedor atual:</span>
                <span className="font-semibold text-gray-800">{fmtBRL(payingItem.contractOriginalValue)}</span>
              </div>

              {isFixed ? (
                /* SAC / Parcelado — mostra parcela + opção de só juros */
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-blue-700 mb-0.5">Valor da parcela</p>
                    <p className="text-xl font-bold text-blue-800">{fmtBRL(info.installmentValue)}</p>
                    <div className="flex gap-4 mt-1 text-xs text-blue-600">
                      <span>Amortização: {fmtBRL(info.capital)}</span>
                      <span>Juros: {fmtBRL(info.interest)}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-medium text-amber-700 mb-0.5">Só juros (sem abater capital)</p>
                    <p className="text-lg font-bold text-amber-800">{fmtBRL(info.interest)}</p>
                    <p className="text-xs text-amber-600 mt-0.5">Saldo devedor permanece inalterado</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPayingItem(null); setCapitalInput(""); }}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handlePayMinimum(payingItem)}
                      disabled={markAsPaidMutation.isPending}
                      className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      Só juros
                    </button>
                    <button
                      onClick={() => handlePayInstallment(payingItem)}
                      disabled={markAsPaidMutation.isPending}
                      className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
                    >
                      Pagar parcela
                    </button>
                  </div>
                </>
              ) : (
                /* Rotativo / Fixo — mínimo + capital extra */
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-amber-700 mb-0.5">Pagamento mínimo (só juros)</p>
                    <p className="text-xl font-bold text-amber-800">{fmtBRL(info.interest)}</p>
                    <p className="text-xs text-amber-600 mt-0.5">Saldo devedor permanece inalterado</p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">Capital adicional (opcional)</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={capitalInput}
                        onChange={e => setCapitalInput(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {extraCapital > 0 && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        Saldo devedor reduzido em {fmtBRL(extraCapital)}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-4 border-t pt-3">
                    <span className="text-sm font-medium text-gray-700">Total a receber:</span>
                    <span className="text-lg font-bold text-blue-700">{fmtBRL(revolvingTotal)}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPayingItem(null); setCapitalInput(""); }}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    {extraCapital <= 0 ? (
                      <button
                        onClick={() => handlePayMinimum(payingItem)}
                        disabled={markAsPaidMutation.isPending}
                        className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50"
                      >
                        Só mínimo
                      </button>
                    ) : (
                      <button
                        onClick={handlePayWithCapital}
                        disabled={markAsPaidMutation.isPending}
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
                      >
                        Confirmar {fmtBRL(revolvingTotal)}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
