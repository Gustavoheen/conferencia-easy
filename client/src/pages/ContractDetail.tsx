import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

function fmtBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(val: any) {
  return new Date(val).toLocaleDateString("pt-BR");
}

export default function ContractDetail() {
  const [, params] = useRoute("/contracts/:id");
  const [, navigate] = useLocation();
  const id = parseInt(params?.id || "0");

  const { data, isLoading } = trpc.contracts.getDetailById.useQuery({ id }, { enabled: id > 0 });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!data) return <div className="text-center text-gray-500 mt-20">Contrato não encontrado</div>;

  const inst = data.installments || [];
  const paid = inst.filter(i => i.status === "paid");
  const totalPaid = paid.reduce((s, i) => s + parseFloat(i.paidValue as string || "0"), 0);
  const totalCapitalPaid = paid.reduce((s, i) => s + parseFloat(i.capitalPaid as string || "0"), 0);
  const totalInterestPaid = paid.reduce((s, i) => s + parseFloat(i.interestPaid as string || "0"), 0);
  const currentBalance = parseFloat(data.originalValue as string);
  const trueOriginal = currentBalance + totalCapitalPaid;

  const getTypeBadge = (type: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      fixed: { label: "Fixo", cls: "bg-gray-100 text-gray-700" },
      installment: { label: "Parcelado", cls: "bg-yellow-100 text-yellow-700" },
      sac: { label: "SAC", cls: "bg-purple-100 text-purple-700" },
      revolving: { label: "Rotativo", cls: "bg-blue-100 text-blue-700" },
    };
    const t = map[type] || { label: type, cls: "bg-gray-100 text-gray-700" };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${t.cls}`}>{t.label}</span>;
  };

  const getStatusIcon = (status: string) => {
    if (status === "paid") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === "overdue") return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  const getStatusLabel = (status: string) => {
    if (status === "paid") return "Pago";
    if (status === "overdue") return "Atrasado";
    return "Pendente";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate("/contracts")}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{data.contractNumber}</h1>
            {getTypeBadge(data.type)}
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${data.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
              {data.status === "open" ? "Aberto" : "Fechado"}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            <span className="cursor-pointer hover:text-blue-600 underline" onClick={() => navigate(`/customers/${data.customerId}`)}>{data.customerName}</span>
            {" "} · Desde {fmtDate(data.startDate)}
          </p>
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Capital original", value: fmtBRL(trueOriginal), color: "text-blue-600" },
          { label: "Saldo devedor", value: fmtBRL(currentBalance), color: "text-amber-600" },
          { label: "Capital pago", value: fmtBRL(totalCapitalPaid), color: "text-emerald-600" },
          { label: "Juros pagos", value: fmtBRL(totalInterestPaid), color: "text-green-600" },
          { label: "Total recebido", value: fmtBRL(totalPaid), color: "text-indigo-600" },
        ].map(card => (
          <Card key={card.label} className="border-0 shadow-sm">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-gray-500 mb-0.5">{card.label}</p>
              <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Capital recuperado</span>
            <span>{trueOriginal > 0 ? Math.round((totalCapitalPaid / trueOriginal) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-emerald-500 h-2.5 rounded-full transition-all" style={{ width: `${trueOriginal > 0 ? Math.min(100, (totalCapitalPaid / trueOriginal) * 100) : 0}%` }} />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-emerald-600">{fmtBRL(totalCapitalPaid)} recuperado</span>
            <span className="text-amber-600">{fmtBRL(currentBalance)} restante</span>
          </div>
        </CardContent>
      </Card>

      {/* Installments table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <p className="font-semibold text-gray-800 mb-4">Parcelas ({inst.length})</p>
          {inst.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhuma parcela gerada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left py-2 px-2">#</th>
                    <th className="text-left py-2 px-2">Vencimento</th>
                    <th className="text-right py-2 px-2">Valor</th>
                    <th className="text-right py-2 px-2">Pago</th>
                    <th className="text-right py-2 px-2">Capital</th>
                    <th className="text-right py-2 px-2">Juros</th>
                    <th className="text-center py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Data pgto</th>
                  </tr>
                </thead>
                <tbody>
                  {inst.map((i: any) => (
                    <tr key={i.id} className={`border-b hover:bg-gray-50 ${i.status === "overdue" ? "bg-red-50/50" : ""}`}>
                      <td className="py-2 px-2 text-gray-600">{i.installmentNumber}</td>
                      <td className="py-2 px-2">{fmtDate(i.dueDate)}</td>
                      <td className="py-2 px-2 text-right font-medium">{fmtBRL(parseFloat(i.value || "0"))}</td>
                      <td className="py-2 px-2 text-right font-medium">{i.status === "paid" ? fmtBRL(parseFloat(i.paidValue || "0")) : "—"}</td>
                      <td className="py-2 px-2 text-right text-emerald-600">{i.status === "paid" && parseFloat(i.capitalPaid || "0") > 0 ? fmtBRL(parseFloat(i.capitalPaid)) : "—"}</td>
                      <td className="py-2 px-2 text-right text-green-600">{i.status === "paid" && parseFloat(i.interestPaid || "0") > 0 ? fmtBRL(parseFloat(i.interestPaid)) : "—"}</td>
                      <td className="py-2 px-2 text-center">
                        <span className="inline-flex items-center gap-1 text-xs">
                          {getStatusIcon(i.status)} {getStatusLabel(i.status)}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-500">{i.paidDate ? fmtDate(i.paidDate) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
