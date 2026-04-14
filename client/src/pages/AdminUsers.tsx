import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserPlus, Trash2, KeyRound, Users, Search } from "lucide-react";

export default function AdminUsers() {
  const { data: users = [], refetch } = trpc.admin.listUsers.useQuery();
  const createUser = trpc.admin.createUser.useMutation({ onSuccess: () => { refetch(); toast.success("Usuário criado!"); setCreateOpen(false); setForm({ name: "", email: "", password: "" }); } });
  const deleteUser = trpc.admin.deleteUser.useMutation({ onSuccess: () => { refetch(); toast.success("Usuário excluído!"); setDeleteId(null); } });
  const resetPass = trpc.admin.resetPassword.useMutation({ onSuccess: () => { toast.success("Senha alterada!"); setResetId(null); setNewPass(""); } });

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);
  const [newPass, setNewPass] = useState("");
  const [search, setSearch] = useState("");

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const resetUser = users.find(u => u.id === resetId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} conta{users.length !== 1 ? "s" : ""} cadastrada{users.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <UserPlus className="w-4 h-4" /> Nova conta
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-medium">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {(u.name || "U")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 truncate">{u.name}</p>
                    {u.role === "admin" && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Admin</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate">{u.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {Number(u.customerCount)} clientes · {Number(u.contractCount)} contratos
                    {u.lastSignedIn && ` · Último acesso ${new Date(u.lastSignedIn).toLocaleDateString("pt-BR")}`}
                  </p>
                  {u.role !== "admin" && (
                    <div className="flex gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs font-medium text-slate-600">
                        Contratos: <span className="text-gray-800">{Number(u.totalContractsValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        Recebido: <span className="text-emerald-700">{Number(u.totalReceived).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        Pendente: <span className="text-amber-700">{Number(u.totalPending).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      </span>
                      {Number(u.overdueCount) > 0 && (
                        <span className="text-xs font-medium text-red-600">
                          {Number(u.overdueCount)} em atraso
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Redefinir senha"
                    onClick={() => setResetId(u.id)}
                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <KeyRound className="w-4 h-4" />
                  </Button>
                  {u.role !== "admin" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir usuário"
                      onClick={() => setDeleteId(u.id)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conta de usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Senha inicial</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={createUser.isPending || !form.name || !form.email || form.password.length < 6}
              onClick={() => createUser.mutate(form)}
            >
              {createUser.isPending ? "Criando..." : "Criar conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetId} onOpenChange={open => { if (!open) { setResetId(null); setNewPass(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha — {resetUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>Nova senha</Label>
            <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetId(null); setNewPass(""); }}>Cancelar</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={resetPass.isPending || newPass.length < 6}
              onClick={() => resetPass.mutate({ userId: resetId!, password: newPass })}
            >
              {resetPass.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados desse usuário (clientes, contratos e parcelas) serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteUser.mutate({ userId: deleteId! })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
