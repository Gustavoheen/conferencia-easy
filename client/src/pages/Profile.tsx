import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, Bell } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: (user as any)?.phone || "",
  });

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => toast.success("Perfil atualizado com sucesso!"),
    onError: (err) => toast.error("Erro ao atualizar: " + err.message),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const initials = (user?.name || "?").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-600 mt-1">Gerencie suas informações pessoais e preferências</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Plano</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificação</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  {initials}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <p className="text-xs text-blue-600 mt-0.5 capitalize">{user?.role}</p>
                </div>
              </div>

              <div>
                <label className="form-label">Nome</label>
                <Input
                  name="name"
                  placeholder="Nome completo"
                  value={formData.name}
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
                <label className="form-label">Email</label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-50 text-gray-500"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="btn-primary-green w-full"
              >
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Plano Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Plano Premium</h3>
                <p className="text-sm text-blue-800 mb-4">
                  Você está usando o plano Premium com acesso a todas as funcionalidades.
                </p>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>✓ Clientes ilimitados</li>
                  <li>✓ Contratos ilimitados</li>
                  <li>✓ Relatórios avançados</li>
                  <li>✓ Suporte prioritário</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Notificações de Vencimento</p>
                  <p className="text-sm text-gray-600">Receba alertas sobre parcelas vencendo</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-blue-600" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Notificações de Pagamento</p>
                  <p className="text-sm text-gray-600">Receba alertas quando pagamentos forem recebidos</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-blue-600" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Notificações de Contrato</p>
                  <p className="text-sm text-gray-600">Receba alertas sobre novos contratos</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-blue-600" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
