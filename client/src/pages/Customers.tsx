import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import { Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Customers() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpfCnpj: "",
    address: "",
    addressNumber: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const limit = 10;
  const { data: customersData, isLoading, refetch } = trpc.customers.list.useQuery({
    search: searchTerm,
    limit,
    offset,
  });

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      setIsModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar cliente: " + error.message);
    },
  });

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      setIsModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar cliente: " + error.message);
    },
  });

  const deleteMutation = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Cliente removido com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao remover cliente: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      cpfCnpj: "",
      address: "",
      addressNumber: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    });
    setEditingCustomer(null);
  };

  const handleOpenModal = (customer?: any) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData(customer);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (editingCustomer) {
      await updateMutation.mutateAsync({
        id: editingCustomer.id,
        ...formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleDelete = (customer: any) => {
    if (confirm(`Tem certeza que deseja remover ${customer.name}?`)) {
      deleteMutation.mutate({ id: customer.id });
    }
  };

  const columns = [
    {
      key: "createdAt",
      label: "Cadastro",
      render: (value: any) => new Date(value).toLocaleDateString("pt-BR"),
    },
    {
      key: "name",
      label: "Nome",
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm text-gray-500">({row.phone})</p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            {customersData?.total || 0} clientes cadastrados
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="btn-primary-green gap-2"
        >
          <Plus className="w-4 h-4" />
          Cliente
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={customersData?.data || []}
            isLoading={isLoading}
            emptyMessage="Nenhum cliente encontrado"
            onRowClick={(row) => navigate(`/customers/${row.id}`)}
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
          disabled={!customersData || customersData.data.length < limit}
          onClick={() => setOffset(offset + limit)}
        >
          Próximo
        </Button>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingCustomer ? "Editar Cliente" : "Novo Cliente"}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        submitLabel={editingCustomer ? "Atualizar" : "Cadastrar"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Nome *</label>
            <Input
              name="name"
              placeholder="Nome completo"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="form-label">Email</label>
            <Input
              name="email"
              type="email"
              placeholder="email@exemplo.com"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="form-label">Telefone</label>
            <Input
              name="phone"
              placeholder="(00) 9 0000-0000"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="form-label">CPF/CNPJ</label>
            <Input
              name="cpfCnpj"
              placeholder="000.000.000-00"
              value={formData.cpfCnpj}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="form-label">Endereço</label>
            <Input
              name="address"
              placeholder="Rua, avenida..."
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="form-label">Número</label>
            <Input
              name="addressNumber"
              placeholder="123"
              value={formData.addressNumber}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="form-label">Complemento</label>
            <Input
              name="complement"
              placeholder="Apto, sala..."
              value={formData.complement}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="form-label">Bairro</label>
            <Input
              name="neighborhood"
              placeholder="Bairro"
              value={formData.neighborhood}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="form-label">Cidade</label>
            <Input
              name="city"
              placeholder="Cidade"
              value={formData.city}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Estado</label>
              <Input
                name="state"
                placeholder="MG"
                maxLength={2}
                value={formData.state}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="form-label">CEP</label>
              <Input
                name="zipCode"
                placeholder="00000-000"
                value={formData.zipCode}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
