import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import { Plus, Search, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

type ContractType = "fixed" | "installment" | "revolving" | "sac" | "fixed_interest";

export default function Contracts() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<"open" | "closed" | undefined>();
  const [offset, setOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    contractType: "fixed" as ContractType,
    originalValue: "",
    interestRate: "",
    installments: "1",
    installmentCount: "1",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  const limit = 10;
  const { data: contractsData, isLoading, refetch } = trpc.contracts.list.useQuery({
    status,
    limit,
    offset,
  });

  const { data: customersData } = trpc.customers.list.useQuery({
    search: "",
    limit: 1000,
    offset: 0,
  });

  const original = parseFloat(formData.originalValue) || 0;
  const rate = parseFloat(formData.interestRate) || 0;
  const n = parseInt(formData.installmentCount) || 1;

  const calcInstallment = useMemo(() => {
    if (formData.contractType === "installment") {
      const interestPerInstallment = original * rate / 100;
      const perInstallment = (original / n) + interestPerInstallment;
      const total = perInstallment * n;
      return { perInstallment, total, interestPerInstallment };
    }
    return null;
  }, [formData.contractType, original, rate, n]);

  const calcRevolving = useMemo(() => {
    if (formData.contractType === "revolving") {
      return { monthlyInterest: original * rate / 100 };
    }
    return null;
  }, [formData.contractType, original, rate]);

  const calcFixedInterest = useMemo(() => {
    if (formData.contractType === "fixed_interest") {
      return { fixedMonthlyInterest: original * rate / 100 };
    }
    return null;
  }, [formData.contractType, original, rate]);

  const calcSac = useMemo(() => {
    if (formData.contractType === "sac" && n > 0) {
      const amortization = original / n;
      const installments = Array.from({ length: n }, (_, i) => {
        const balance = original - amortization * i;
        const interest = balance * rate / 100;
        return { value: amortization + interest, interest, balance };
      });
      const total = installments.reduce((s, p) => s + p.value, 0);
      return { amortization, firstInstallment: installments[0]?.value ?? 0, lastInstallment: installments[n - 1]?.value ?? 0, total };
    }
    return null;
  }, [formData.contractType, original, rate, n]);

  const totalValue = useMemo(() => {
    if (formData.contractType === "revolving") return original;
    if (formData.contractType === "fixed_interest") return original;
    if (formData.contractType === "sac") return calcSac?.total ?? original;
    return original + (original * rate) / 100;
  }, [formData.contractType, original, rate, calcSac]);

  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => {
      toast.success("Contrato criado com sucesso!");
      setIsModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar contrato: " + error.message);
    },
  });

  const updateMutation = trpc.contracts.update.useMutation({
    onSuccess: () => {
      toast.success("Contrato atualizado com sucesso!");
      setIsModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar contrato: " + error.message);
    },
  });

  const deleteMutation = trpc.contracts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contrato removido com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao remover contrato: " + error.message);
    },
  });

  const generateInterestMutation = trpc.contracts.generateMonthlyInterest.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.generated} parcelas de juros geradas com sucesso!`);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao gerar parcelas: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: "",
      contractType: "fixed",
      originalValue: "",
      interestRate: "",
      installments: "1",
      installmentCount: "1",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
    });
    setEditingContract(null);
  };

  const handleOpenModal = (contract?: any) => {
    if (contract) {
      setEditingContract(contract);
      setFormData({
        customerId: contract.customerId.toString(),
        contractType: contract.type as ContractType,
        originalValue: contract.originalValue.toString(),
        interestRate: contract.interestRate.toString(),
        installments: "1",
        installmentCount: "1",
        description: contract.notes || "",
        startDate: contract.startDate
          ? new Date(contract.startDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.customerId || !formData.originalValue || !formData.interestRate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const originalVal = parseFloat(formData.originalValue);
    const interestRateVal = parseFloat(formData.interestRate);

    let interestValue: string;
    let computedTotal: string;

    const n = parseInt(formData.installmentCount) || 1;
    const iv = (originalVal * interestRateVal) / 100;

    if (formData.contractType === "revolving") {
      interestValue = "0";
      computedTotal = originalVal.toFixed(2);
    } else if (formData.contractType === "fixed_interest") {
      interestValue = iv.toFixed(2); // valor fixo mensal (não muda com pagamentos de capital)
      computedTotal = originalVal.toFixed(2);
    } else if (formData.contractType === "installment") {
      // Juros simples: mesmo juro em todas as parcelas sobre o valor original
      interestValue = iv.toFixed(2);
      computedTotal = (originalVal + iv * n).toFixed(2);
    } else if (formData.contractType === "sac") {
      // SAC: juros decrescentes sobre saldo devedor
      const amortization = originalVal / n;
      let totalInterest = 0;
      let total = 0;
      for (let i = 0; i < n; i++) {
        const balance = originalVal - amortization * i;
        const interest = balance * interestRateVal / 100;
        totalInterest += interest;
        total += amortization + interest;
      }
      interestValue = totalInterest.toFixed(2);
      computedTotal = total.toFixed(2);
    } else {
      interestValue = iv.toFixed(2);
      computedTotal = (originalVal + iv).toFixed(2);
    }

    const payload = {
      customerId: parseInt(formData.customerId),
      contractNumber: `CT-${Date.now()}`,
      type: formData.contractType,
      originalValue: formData.originalValue,
      interestRate: formData.interestRate,
      interestValue,
      totalValue: computedTotal,
      startDate: formData.startDate ? new Date(formData.startDate + "T12:00:00") : new Date(),
      notes: formData.description,
      installmentCount:
        formData.contractType === "installment" || formData.contractType === "sac"
          ? n
          : 1,
    };

    if (editingContract) {
      await updateMutation.mutateAsync({
        id: editingContract.id,
        status: editingContract.status,
        notes: formData.description,
        type: formData.contractType,
        originalValue: formData.originalValue,
        interestRate: formData.interestRate,
        interestValue,
        totalValue: computedTotal,
        startDate: formData.startDate ? new Date(formData.startDate + "T12:00:00") : undefined,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleDelete = (contract: any) => {
    if (confirm("Tem certeza que deseja remover este contrato?")) {
      deleteMutation.mutate({ id: contract.id });
    }
  };

  const handleGenerateInterest = (contract: any) => {
    if (
      confirm(
        `Gerar os próximos 12 meses de juros para o contrato ${contract.contractNumber}?`
      )
    ) {
      generateInterestMutation.mutate({ contractId: contract.id, months: 12 });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "open") {
      return <span className="badge-open">Aberto</span>;
    }
    return <span className="badge-closed">Fechado</span>;
  };

  const getTypeBadge = (type: string) => {
    if (type === "fixed") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          Fixo
        </span>
      );
    }
    if (type === "installment") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
          Parcelado
        </span>
      );
    }
    if (type === "sac") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
          SAC
        </span>
      );
    }
    if (type === "revolving") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          Rotativo
        </span>
      );
    }
    if (type === "fixed_interest") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
          Juros Fixo
        </span>
      );
    }
    return <span>{type}</span>;
  };

  const columns = [
    {
      key: "createdAt",
      label: "Data",
      render: (value: any) => new Date(value).toLocaleDateString("pt-BR"),
    },
    {
      key: "contractNumber",
      label: "Nº",
    },
    {
      key: "customerId",
      label: "Cliente",
      render: (value: any) => {
        const customer = customersData?.data?.find((c: any) => c.id === value);
        return customer?.name || `Cliente #${value}`;
      },
    },
    {
      key: "type",
      label: "Tipo",
      render: (value: string) => getTypeBadge(value),
    },
    {
      key: "totalValue",
      label: "Valor Total",
      render: (value: any) => `R$ ${parseFloat(value).toFixed(2)}`,
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "type",
      label: "Ações",
      render: (value: string, row: any) => {
        if (value === "revolving" || value === "fixed_interest") {
          return (
            <button
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateInterest(row);
              }}
              disabled={generateInterestMutation.isPending}
            >
              <RefreshCw className="w-3 h-3" />
              Gerar próximos meses
            </button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-600 mt-1">
            {contractsData?.total || 0} contratos cadastrados
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="btn-primary-green gap-2"
        >
          <Plus className="w-4 h-4" />
          Contrato
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Digite o primeiro nome"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setOffset(0);
            }}
            className="pl-10"
          />
        </div>
        <select
          value={status || ""}
          onChange={(e) => setStatus(e.target.value as any)}
          className="form-input"
        >
          <option value="">Todos os Status</option>
          <option value="open">Aberto</option>
          <option value="closed">Fechado</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={contractsData?.data || []}
            isLoading={isLoading}
            emptyMessage="Nenhum contrato encontrado"
            onRowClick={(row) => navigate(`/contracts/${row.id}`)}
            onEdit={(row) => handleOpenModal(row)}
            onDelete={(row) => handleDelete(row)}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <Button
          variant="outline"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - limit))}
        >
          Anterior
        </Button>
        <span className="text-sm text-gray-600">
          Página {Math.floor(offset / limit) + 1}
        </span>
        <Button
          variant="outline"
          disabled={!contractsData || contractsData.data.length < limit}
          onClick={() => setOffset(offset + limit)}
        >
          Próximo
        </Button>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingContract ? "Editar Contrato" : "Novo Contrato"}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        submitLabel={editingContract ? "Atualizar" : "Criar"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Cliente *</label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="">Selecione um cliente</option>
              {customersData?.data?.map((customer: any) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Tipo de Contrato *</label>
            <select
              name="contractType"
              value={formData.contractType}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="fixed">Fixo</option>
              <option value="installment">Parcelado (juros simples)</option>
              <option value="sac">Parcelado SAC (juros sobre saldo)</option>
              <option value="revolving">Juros Mensais (Rotativo)</option>
              <option value="fixed_interest">Juros Fixo Mensal (valor fixo independente do capital)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Valor Original *</label>
            <Input
              name="originalValue"
              type="number"
              placeholder="0.00"
              step="0.01"
              value={formData.originalValue}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="form-label">Taxa de Juros (%) *</label>
            <Input
              name="interestRate"
              type="number"
              placeholder="0.00"
              step="0.01"
              value={formData.interestRate}
              onChange={handleInputChange}
            />
          </div>

          {(formData.contractType === "installment" || formData.contractType === "sac") && (
            <div>
              <label className="form-label">Número de Parcelas</label>
              <Input
                name="installmentCount"
                type="number"
                placeholder="1"
                min="1"
                value={formData.installmentCount}
                onChange={handleInputChange}
              />
            </div>
          )}

          {formData.contractType === "revolving" && (
            <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              Gera 1 parcela por mês. A próxima é criada ao marcar como pago.
            </div>
          )}

          {formData.contractType === "fixed_interest" && (
            <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              Juros de <strong>R$ {(original * rate / 100).toFixed(2)}/mês fixos</strong> — não mudam conforme o capital é pago. Cada mês gera 1 parcela automaticamente ao receber o pagamento.
            </div>
          )}

          <div>
            <label className="form-label">Data do Contrato *</label>
            <Input
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="form-label">Descrição</label>
            <Input
              name="description"
              placeholder="Descrição do contrato"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          {/* Calculation Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            {formData.contractType === "fixed_interest" && calcFixedInterest ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Capital emprestado:</span>
                  <span className="font-semibold">R$ {original.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Taxa de juros:</span>
                  <span className="font-semibold">{rate}% ao mês</span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between">
                  <span className="text-gray-900 font-semibold">Juros mensais fixos:</span>
                  <span className="text-lg font-bold text-orange-600">R$ {calcFixedInterest.fixedMonthlyInterest.toFixed(2)}/mês</span>
                </div>
                <div className="text-xs text-gray-500">
                  Este valor não muda mesmo que o cliente pague parte do capital
                </div>
              </div>
            ) : formData.contractType === "sac" && calcSac ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Valor Original:</span>
                  <span className="font-semibold">R$ {original.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Amortização fixa:</span>
                  <span className="font-semibold">R$ {calcSac.amortization.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">1ª parcela (maior):</span>
                  <span className="font-semibold">R$ {calcSac.firstInstallment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Última parcela (menor):</span>
                  <span className="font-semibold">R$ {calcSac.lastInstallment.toFixed(2)}</span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between">
                  <span className="text-gray-900 font-semibold">Total ({n}x):</span>
                  <span className="text-lg font-bold text-blue-600">R$ {calcSac.total.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-500">Juros calculados sobre o saldo devedor remanescente</div>
              </div>
            ) : formData.contractType === "installment" && calcInstallment ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Valor Original:</span>
                  <span className="font-semibold">R$ {original.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">
                    Juros por parcela ({rate}%):
                  </span>
                  <span className="font-semibold">
                    R$ {calcInstallment.interestPerInstallment.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">
                    Valor por parcela:
                  </span>
                  <span className="font-semibold">
                    R$ {calcInstallment.perInstallment.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between">
                  <span className="text-gray-900 font-semibold">
                    Total ({n}x):
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    R$ {calcInstallment.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : formData.contractType === "revolving" && calcRevolving ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Capital:</span>
                  <span className="font-semibold">R$ {original.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">
                    Juros mensais ({rate}%):
                  </span>
                  <span className="font-semibold">
                    R$ {calcRevolving.monthlyInterest.toFixed(2)}/mês
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between">
                  <span className="text-gray-900 font-semibold">
                    Pagamento mensal:
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    R$ {calcRevolving.monthlyInterest.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Capital quitado à parte
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Valor Original:</span>
                  <span className="font-semibold">R$ {original.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Juros ({rate}%):</span>
                  <span className="font-semibold">
                    R$ {(totalValue - original).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between">
                  <span className="text-gray-900 font-semibold">Valor Total:</span>
                  <span className="text-lg font-bold text-blue-600">
                    R$ {totalValue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
