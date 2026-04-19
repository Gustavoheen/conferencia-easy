import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle2, Clock, AlertTriangle, Pencil } from "lucide-react";
import { toast } from "sonner";

function fmtBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(val: any) {
  return new Date(val).toLocaleDateString("pt-BR");
}

function toInputDate(val: any) {
  return new Date(val).toISOString().split("T")[0];
}

export default function ContractDetail() {
  const [, params] = useRoute("/contracts/:id");
  const [, navigate] = useLocation();
  const id = parseInt(params?.id || "0");

  const [editingInstId, setEditingInstId] = useState<number | null>(null);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [contractForm, setContractForm] = useState({
    originalValue: "",
    interestRate: "",
    status: "",
    notes: "",
    startDate: "",
  });

  const { data, isLoading, refetch } = trpc.contracts.getDetailById.useQuery({ id }, { enabled: id > 0 });

  const revertMutation = trpc.installments.revertPayment.useMutation({
    onSuccess: () => { toast.success("Pagamento estornado!"); refetch(); },
    onError: (err) => toast.error("Erro ao estornar: " + err.message),
  });

  const updateInstMutation = trpc.installments.update.useMutation({
    onSuccess: () => { toast.success("Vencimento atualizado!"); refetch(); },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const updateContractMutation = trpc.contracts.update.useMutation({
    onSuccess: () => {
      toast.success("Contrato atualizado!");
      setIsEditingContract(false);
      refetch();
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const handleOpenContractEdit = () => {
    if (!data) return;
    setContractForm({
      originalValue: parseFloat(data.originalValue as string).toFixed(2),
      interestRate: parseFloat(data.interestRate as string).toFixed(2),
      status: data.status,
      notes: data.notes || "",
      startDate: toInputDate(data.startDate),
    });
    setIsEditingContract(true);
  };

  const handleSaveContract = () => {
    updateContractMutation.mutate({
      id,
      originalValue: contractForm.originalValue,
      interestRate: contractForm.interestRate,
      status: contractForm.status as "open" | "closed",
      notes: contractForm.notes,
      startDate: contractForm.startDate ? new Date(contractForm.startDate + "T12:00:00") : undefined,
    });
  };

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
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
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
        <Button variant="outline" size="sm" onClick={handleOpenContractEdit} className="gap-1">
          <Pencil className="w-3.5 h-3.5" /> Editar contrato
        </Button>
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
          <p className="font-semibold text-gray-800 mb-1">Parcelas ({inst.length})</p>
          <p className="text-xs text-gray-400 mb-4">Clique no vencimento para alterar a data</p>
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
                    <th className="py-2 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {inst.map((i: any) => (
                    <tr key={i.id} className={`border-b hover:bg-gray-50 ${i.status === "overdue" ? "bg-red-50/50" : ""}`}>
                      <td className="py-2 px-2 text-gray-600">{i.installmentNumber}</td>

                      {/* Vencimento — editável por clique */}
                      <td className="py-2 px-2">
                        {editingInstId === i.id ? (
                          <input
                            type="date"
                            className="border border-blue-400 rounded px-1 py-0.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            defaultValue={toInputDate(i.dueDate)}
                            autoFocus
                            onBlur={(e) => {
                              if (e.target.value) {
                                updateInstMutation.mutate({ id: i.id, dueDate: new Date(e.target.value + "T12:00:00") });
                              }
                              setEditingInstId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setEditingInstId(null);
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-blue-600 hover:underline"
                            title="Clique para editar"
                            onClick={() => setEditingInstId(i.id)}
                          >
                            {fmtDate(i.dueDate)}
                          </span>
                        )}
                      </td>

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
                      <td className="py-2 px-2">
                        {i.status === "paid" && (
                          <button
                            onClick={() => {
                              if (confirm("Estornar este pagamento?")) {
                                revertMutation.mutate({ id: i.id });
                              }
                            }}
                            disabled={revertMutation.isPending}
                            className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-40 whitespace-nowrap"
                          >
                            Estornar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de edição do contrato */}
      {isEditingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Editar Contrato</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={contractForm.status}
                  onChange={e => setContractForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Aberto</option>
                  <option value="closed">Fechado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Saldo devedor (valor original)</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                  <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r border-gray-300">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={contractForm.originalValue}
                    onChange={e => setContractForm(f => ({ ...f, originalValue: e.target.value }))}
                    className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Taxa de juros mensal</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={contractForm.interestRate}
                    onChange={e => setContractForm(f => ({ ...f, interestRate: e.target.value }))}
                    className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  />
                  <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-l border-gray-300">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data de início</label>
                <input
                  type="date"
                  value={contractForm.startDate}
                  onChange={e => setContractForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={contractForm.notes}
                  onChange={e => setContractForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setIsEditingContract(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveContract}
                disabled={updateContractMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {updateContractMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
