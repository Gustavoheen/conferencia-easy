import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertTriangle, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];
const WEEKDAYS = ["D","S","T","Q","Q","S","S"];

function fmtBRL(val: any) {
  return `R$ ${parseFloat(val || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function fmtDate(val: any) {
  return new Date(val).toLocaleDateString("pt-BR");
}

function toLocalDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function MiniCalendar({
  installments, selMonth, onMonthChange, selectedDay, onSelectDay,
}: {
  installments: any[];
  selMonth: { year: number; month: number };
  onMonthChange: (m: { year: number; month: number }) => void;
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
}) {
  const today = new Date();
  const todayStr = toLocalDateStr(today);

  const dayMap = useMemo(() => {
    const map = new Map<string, { overdue: number; pending: number; paid: number }>();
    installments.forEach(item => {
      const d = new Date(item.dueDate);
      if (d.getFullYear() !== selMonth.year || d.getMonth() !== selMonth.month) return;
      const key = toLocalDateStr(d);
      if (!map.has(key)) map.set(key, { overdue: 0, pending: 0, paid: 0 });
      const e = map.get(key)!;
      if (item.status === "paid") e.paid++;
      else if (item.status === "overdue") e.overdue++;
      else e.pending++;
    });
    return map;
  }, [installments, selMonth.year, selMonth.month]);

  const firstDay = new Date(selMonth.year, selMonth.month, 1).getDay();
  const daysInMonth = new Date(selMonth.year, selMonth.month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevM = () => onMonthChange(selMonth.month === 0 ? { year: selMonth.year - 1, month: 11 } : { ...selMonth, month: selMonth.month - 1 });
  const nextM = () => onMonthChange(selMonth.month === 11 ? { year: selMonth.year + 1, month: 0 } : { ...selMonth, month: selMonth.month + 1 });

  return (
    <Card className="border-0 shadow-sm mb-4">
      <CardContent className="pt-3 pb-3 px-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={prevM} className="p-1 rounded hover:bg-slate-100 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-semibold text-gray-800">{MONTH_NAMES[selMonth.month]} {selMonth.year}</span>
          <button onClick={nextM} className="p-1 rounded hover:bg-slate-100 text-slate-500"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w, i) => <div key={i} className="text-center text-[9px] font-semibold text-gray-400 py-0.5">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = `${selMonth.year}-${String(selMonth.month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const entry = dayMap.get(dateStr);
            const isToday = dateStr === todayStr;
            const isSel = dateStr === selectedDay;
            return (
              <button key={idx} onClick={() => onSelectDay(isSel ? null : dateStr)}
                className={`flex flex-col items-center py-1 rounded text-[11px] font-medium transition-all leading-none
                  ${isSel ? "bg-blue-600 text-white" : isToday ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-600 hover:bg-slate-100"}
                  ${entry ? "cursor-pointer" : "cursor-default opacity-40"}`}
              >
                <span>{day}</span>
                {entry && (
                  <div className="flex gap-px mt-0.5">
                    {entry.overdue > 0 && <span className="w-1 h-1 rounded-full bg-red-500" />}
                    {entry.pending > 0 && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                    {entry.paid > 0 && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mt-2 justify-center">
          <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Atrasado</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Pendente</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Pago</span>
        </div>
        {selectedDay && (
          <div className="mt-1 text-center">
            <button onClick={() => onSelectDay(null)} className="text-[10px] text-blue-600 hover:underline">Limpar filtro</button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Expirations() {
  const [, navigate] = useLocation();
  const today = new Date();
  const [selMonth, setSelMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "paid" | "overdue">("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [payingItem, setPayingItem] = useState<any | null>(null);
  const [capitalInput, setCapitalInput] = useState("");

  const { data, isLoading, refetch } = trpc.installments.listByUser.useQuery({ limit: 2000, offset: 0 });

  const markAsPaidMutation = trpc.installments.markAsPaid.useMutation({
    onSuccess: () => { toast.success("Parcela marcada como paga!"); setPayingItem(null); setCapitalInput(""); refetch(); },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const revertMutation = trpc.installments.revertPayment.useMutation({
    onSuccess: () => { toast.success("Pagamento estornado!"); refetch(); },
    onError: (err) => toast.error("Erro ao estornar: " + err.message),
  });

  const allInstallments: any[] = data?.data || [];

  const goToday = () => { setSelMonth({ year: today.getFullYear(), month: today.getMonth() }); setSelectedDay(null); };
  const isCurrentMonth = selMonth.year === today.getFullYear() && selMonth.month === today.getMonth();

  const monthInstallments = useMemo(() => {
    return allInstallments.filter(i => {
      const d = new Date(i.dueDate);
      return d.getFullYear() === selMonth.year && d.getMonth() === selMonth.month;
    });
  }, [allInstallments, selMonth.year, selMonth.month]);

  const filtered = useMemo(() => {
    let list = monthInstallments;
    if (statusFilter) list = list.filter(i => i.status === statusFilter);
    if (selectedDay) list = list.filter(i => {
      const d = new Date(i.dueDate);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` === selectedDay;
    });
    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [monthInstallments, statusFilter, selectedDay]);

  const totals = useMemo(() => ({
    count: monthInstallments.length,
    pending: monthInstallments.filter(i => i.status === "pending").length,
    overdue: monthInstallments.filter(i => i.status === "overdue").length,
    paid: monthInstallments.filter(i => i.status === "paid").length,
    toReceive: monthInstallments.filter(i => i.status !== "paid").reduce((s, i) => s + parseFloat(i.value || 0), 0),
    received: monthInstallments.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.paidValue || 0), 0),
  }), [monthInstallments]);

  const getPaymentInfo = (item: any) => {
    const principal = parseFloat(item.contractOriginalValue || "0");
    const rate = parseFloat(item.contractInterestRate || "0");
    const interest = principal * rate / 100;
    const installmentValue = parseFloat(item.value || "0");
    const capital = Math.max(0, installmentValue - interest);
    return { interest, capital, installmentValue };
  };

  const isFixedContract = (item: any) => item.contractType === "sac" || item.contractType === "installment";

  const handlePayInstallment = (item: any) => {
    const { installmentValue, capital } = getPaymentInfo(item);
    markAsPaidMutation.mutate({ id: item.id, paidValue: installmentValue.toFixed(2), capitalPaid: capital.toFixed(2) });
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
    markAsPaidMutation.mutate({ id: payingItem.id, paidValue: (interest + capital).toFixed(2), capitalPaid: capital.toFixed(2) });
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
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-600" />
          Vencimentos
        </h1>
      </div>

      {/* Mini Calendar */}
      <MiniCalendar
        installments={allInstallments}
        selMonth={selMonth}
        onMonthChange={(m) => { setSelMonth(m); setSelectedDay(null); }}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
      />

      {/* Back to today */}
      {!isCurrentMonth && (
        <div className="mb-3 text-right">
          <button onClick={goToday} className="text-xs text-blue-600 hover:underline">← Voltar para mês atual</button>
        </div>
      )}

      {/* Summary cards — clicáveis para filtrar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        <Card
          onClick={() => setStatusFilter(statusFilter === "pending" ? "" : "pending")}
          className={`border-0 shadow-sm cursor-pointer transition-all active:scale-95 hover:shadow-md ${statusFilter === "pending" ? "ring-2 ring-amber-400" : ""}`}
        >
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-gray-500 mb-1">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600">{totals.pending}</p>
            <p className="text-xs text-amber-500 mt-0.5">{fmtBRL(monthInstallments.filter(i => i.status === "pending").reduce((s, i) => s + parseFloat(i.value || 0), 0))}</p>
          </CardContent>
        </Card>
        <Card
          onClick={() => setStatusFilter(statusFilter === "overdue" ? "" : "overdue")}
          className={`border-0 shadow-sm cursor-pointer transition-all active:scale-95 hover:shadow-md ${statusFilter === "overdue" ? "ring-2 ring-red-400" : ""}`}
        >
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-gray-500 mb-1">Atrasadas</p>
            <p className="text-2xl font-bold text-red-600">{totals.overdue}</p>
            <p className="text-xs text-red-400 mt-0.5">{fmtBRL(monthInstallments.filter(i => i.status === "overdue").reduce((s, i) => s + parseFloat(i.value || 0), 0))}</p>
          </CardContent>
        </Card>
        <Card
          onClick={() => setStatusFilter(statusFilter === "paid" ? "" : "paid")}
          className={`border-0 shadow-sm cursor-pointer transition-all active:scale-95 hover:shadow-md ${statusFilter === "paid" ? "ring-2 ring-emerald-400" : ""}`}
        >
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-gray-500 mb-1">Recebido no mês</p>
            <p className="text-xl font-bold text-emerald-600">{fmtBRL(totals.received)}</p>
            <p className="text-xs text-emerald-500 mt-0.5">{totals.paid} pago{totals.paid !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card
          onClick={() => setStatusFilter("")}
          className={`border-0 shadow-sm cursor-pointer transition-all active:scale-95 hover:shadow-md col-span-2 md:col-span-2 ${statusFilter === "" ? "ring-2 ring-blue-400" : ""}`}
        >
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-gray-500 mb-1">A receber no mês</p>
            <p className="text-xl font-bold text-blue-600">{fmtBRL(totals.toReceive)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{totals.pending + totals.overdue} parcela{(totals.pending + totals.overdue) !== 1 ? "s" : ""} em aberto</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-gray-500 mb-1">Total no mês</p>
            <p className="text-xl font-bold text-gray-800">{totals.count}</p>
            <p className="text-xs text-gray-400 mt-0.5">parcelas</p>
          </CardContent>
        </Card>
      </div>
      {statusFilter && (
        <div className="mb-3 text-right">
          <button onClick={() => setStatusFilter("")} className="text-xs text-blue-600 hover:underline">Limpar filtro</button>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-gray-400">
            Nenhuma parcela em {MONTH_NAMES[selMonth.month]} {selMonth.year}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center gap-2 md:gap-4 px-3 md:px-5 py-3 border-b border-gray-100 last:border-0
                ${item.status === "overdue" ? "bg-red-50/60" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
            >
              {/* Date */}
              <div className="w-16 md:w-20 flex-shrink-0 text-xs md:text-sm text-gray-500 font-medium">
                {fmtDate(item.dueDate)}
              </div>

              {/* Client + contract */}
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
              <div className="hidden md:flex w-24 justify-center flex-shrink-0">{getStatusBadge(item.status)}</div>

              {/* Action */}
              <div className="w-24 md:w-32 flex flex-col items-end gap-1 flex-shrink-0">
                {item.status !== "paid" ? (
                  <Button size="sm"
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
                      onClick={() => { if (confirm("Estornar este pagamento?")) revertMutation.mutate({ id: item.id }); }}
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
        </Card>
      )}

      {/* Modal de pagamento */}
      {payingItem && (() => {
        const info = getPaymentInfo(payingItem);
        const isFixed = isFixedContract(payingItem);
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
                    <button onClick={() => { setPayingItem(null); setCapitalInput(""); }}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
                      Cancelar
                    </button>
                    <button onClick={() => handlePayMinimum(payingItem)} disabled={markAsPaidMutation.isPending}
                      className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50">
                      Só juros
                    </button>
                    <button onClick={() => handlePayInstallment(payingItem)} disabled={markAsPaidMutation.isPending}
                      className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
                      Pagar parcela
                    </button>
                  </div>
                </>
              ) : (
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
                      <input type="number" min="0" step="0.01" placeholder="0,00"
                        value={capitalInput} onChange={e => setCapitalInput(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {extraCapital > 0 && (
                      <p className="text-xs text-gray-500 mt-1.5">Saldo devedor reduzido em {fmtBRL(extraCapital)}</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center mb-4 border-t pt-3">
                    <span className="text-sm font-medium text-gray-700">Total a receber:</span>
                    <span className="text-lg font-bold text-blue-700">{fmtBRL(revolvingTotal)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setPayingItem(null); setCapitalInput(""); }}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
                      Cancelar
                    </button>
                    {extraCapital <= 0 ? (
                      <button onClick={() => handlePayMinimum(payingItem)} disabled={markAsPaidMutation.isPending}
                        className="flex-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50">
                        Só mínimo
                      </button>
                    ) : (
                      <button onClick={handlePayWithCapital} disabled={markAsPaidMutation.isPending}
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
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
