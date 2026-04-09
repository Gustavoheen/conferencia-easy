import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Calendar, TrendingUp, Wallet, Clock, FileText } from "lucide-react";
import { Loader2 } from "lucide-react";

function fmtBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function downloadCSV(filename: string, rows: string[][]) {
  const bom = "\uFEFF"; // UTF-8 BOM for Excel
  const csv = bom + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: contractsData } = trpc.contracts.list.useQuery({ limit: 1000, offset: 0 });
  const { data: installmentsData } = trpc.installments.listByUser.useQuery({ limit: 1000, offset: 0 });

  const contracts = contractsData?.data || [];
  const installments: any[] = installmentsData?.data || [];

  const filterByDate = <T extends { createdAt?: any; dueDate?: any }>(
    items: T[],
    dateField: keyof T
  ): T[] => {
    if (!startDate && !endDate) return items;
    return items.filter(item => {
      const d = new Date(item[dateField] as any);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate + "T23:59:59")) return false;
      return true;
    });
  };

  const filteredContracts = filterByDate(contracts, "createdAt");
  const filteredInstallments = filterByDate(installments, "dueDate");

  const exportContracts = () => {
    const rows = [
      ["Contrato", "Cliente ID", "Tipo", "Status", "Valor Original", "Taxa Juros", "Total", "Data Início"],
      ...filteredContracts.map(c => [
        c.contractNumber,
        String(c.customerId),
        c.type,
        c.status,
        String(c.originalValue),
        String(c.interestRate) + "%",
        String(c.totalValue),
        new Date(c.startDate).toLocaleDateString("pt-BR"),
      ]),
    ];
    downloadCSV(`contratos_${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  const exportInstallments = () => {
    const rows = [
      ["Contrato", "Cliente", "Parcela", "Vencimento", "Valor", "Status", "Pago em", "Valor Pago"],
      ...filteredInstallments.map((i: any) => [
        i.contractNumber || "",
        i.customerName || "",
        String(i.installmentNumber),
        new Date(i.dueDate).toLocaleDateString("pt-BR"),
        String(i.value),
        i.status,
        i.paidDate ? new Date(i.paidDate).toLocaleDateString("pt-BR") : "",
        i.paidValue || "0",
      ]),
    ];
    downloadCSV(`recebimentos_${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  const periodReceived = filteredInstallments
    .filter((i: any) => i.status === "paid")
    .reduce((s: number, i: any) => s + parseFloat(i.paidValue || 0), 0);

  const periodPending = filteredInstallments
    .filter((i: any) => i.status !== "paid")
    .reduce((s: number, i: any) => s + parseFloat(i.value || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600 mt-1">
          Visualize e exporte dados financeiros filtrados por período
        </p>
      </div>

      {/* Filter Section */}
      <Card className="mb-6 border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filtrar por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Data Inicial</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Data Final</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setStartDate(""); setEndDate(""); }}
              >
                Limpar filtro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {statsLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {startDate || endDate ? "Contratos filtrados" : "Total de Contratos"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {startDate || endDate ? filteredContracts.length : (stats?.contractCount ?? 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Recebido</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {fmtBRL(startDate || endDate ? periodReceived : (stats?.totalReceived ?? 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">A Receber</p>
                  <p className="text-lg font-bold text-amber-600">
                    {fmtBRL(startDate || endDate ? periodPending : (stats?.totalPending ?? 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Contratos</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {fmtBRL(stats?.totalContractsValue ?? 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm mb-4">
              {filteredContracts.length} contrato{filteredContracts.length !== 1 ? "s" : ""} no período selecionado
            </p>
            <Button
              variant="outline"
              className="w-full gap-2 justify-start"
              onClick={exportContracts}
              disabled={filteredContracts.length === 0}
            >
              <Download className="w-4 h-4" />
              Exportar como CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recebimentos / Parcelas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm mb-4">
              {filteredInstallments.length} parcela{filteredInstallments.length !== 1 ? "s" : ""} no período selecionado
            </p>
            <Button
              variant="outline"
              className="w-full gap-2 justify-start"
              onClick={exportInstallments}
              disabled={filteredInstallments.length === 0}
            >
              <Download className="w-4 h-4" />
              Exportar como CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
