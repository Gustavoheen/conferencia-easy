import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

function fmtBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id");
  const [, navigate] = useLocation();
  const id = parseInt(params?.id || "0");

  const { data, isLoading, refetch } = trpc.customers.getDetailById.useQuery({ id }, { enabled: id > 0 });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => { toast.success("Cliente atualizado!"); setEditing(false); refetch(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!data) return <div className="text-center text-gray-500 mt-20">Cliente não encontrado</div>;

  const { customer, contracts } = data;
  const totalInvested = contracts.reduce((s, c) => s + parseFloat(c.originalValue as string) + c.totalCapitalPaid, 0);
  const totalReceived = contracts.reduce((s, c) => s + c.totalPaid, 0);
  const totalBalance = contracts.reduce((s, c) => s + parseFloat(c.originalValue as string), 0);

  const startEditing = () => { setForm({ ...customer }); setEditing(true); };
  const handleSave = () => updateMutation.mutate({ id: customer.id, ...form });

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

  const getStatusBadge = (status: string) => {
    return status === "open"
      ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Aberto</span>
      : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">Fechado</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate("/customers")}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-sm text-gray-500">{customer.phone || "Sem telefone"} {customer.cpfCnpj ? `· ${customer.cpfCnpj}` : ""}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Capital investido</p>
            <p className="text-xl font-bold text-blue-600">{fmtBRL(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Total recebido</p>
            <p className="text-xl font-bold text-emerald-600">{fmtBRL(totalReceived)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Saldo devedor</p>
            <p className="text-xl font-bold text-amber-600">{fmtBRL(totalBalance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Editable customer info */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="pt-5">
          <div className="flex justify-between items-center mb-4">
            <p className="font-semibold text-gray-800">Dados do cliente</p>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={startEditing}>Editar</Button>
            ) : (
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="bg-blue-600 text-white gap-1">
                <Save className="w-3 h-3" /> Salvar
              </Button>
            )}
          </div>
          {editing && form ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: "name", label: "Nome" }, { key: "email", label: "Email" },
                { key: "phone", label: "Telefone" }, { key: "cpfCnpj", label: "CPF/CNPJ" },
                { key: "address", label: "Endereço" }, { key: "addressNumber", label: "Número" },
                { key: "neighborhood", label: "Bairro" }, { key: "city", label: "Cidade" },
                { key: "state", label: "Estado" }, { key: "zipCode", label: "CEP" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500">{f.label}</label>
                  <Input value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-sm">
              {[
                ["Nome", customer.name], ["Email", customer.email], ["Telefone", customer.phone],
                ["CPF/CNPJ", customer.cpfCnpj], ["Endereço", [customer.address, customer.addressNumber].filter(Boolean).join(", ")],
                ["Bairro", customer.neighborhood], ["Cidade", [customer.city, customer.state].filter(Boolean).join(" - ")], ["CEP", customer.zipCode],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-800 font-medium">{value || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contracts list */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <p className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Contratos ({contracts.length})</p>
          {contracts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhum contrato</p>
          ) : (
            <div className="space-y-2">
              {contracts.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/contracts/${c.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.contractNumber}</p>
                      <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    {getTypeBadge(c.type)}
                    {getStatusBadge(c.status)}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{fmtBRL(parseFloat(c.originalValue))}</p>
                    <p className="text-xs text-gray-500">Pago: {fmtBRL(c.totalPaid)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
