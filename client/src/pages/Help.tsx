import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar, BarChart3, HelpCircle } from "lucide-react";

export default function Help() {
  const guides = [
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Aprenda como cadastrar, editar e gerenciar seus clientes",
      items: [
        "Clique em 'Clientes' no menu lateral",
        "Use o botão '+ Cliente' para adicionar um novo cliente",
        "Preencha todos os campos obrigatórios (nome, email, telefone, CPF/CNPJ, endereço)",
        "Clique em 'Cadastrar' para salvar",
        "Use a busca para encontrar clientes rapidamente",
      ],
    },
    {
      icon: FileText,
      title: "Criação de Contratos",
      description: "Saiba como criar e gerenciar contratos com cálculo automático",
      items: [
        "Acesse a seção 'Contratos'",
        "Clique em '+ Contrato' para criar um novo contrato",
        "Selecione o cliente e defina o tipo (Fixo ou Parcelado)",
        "Insira o valor original e a taxa de juros",
        "O sistema calcula automaticamente o valor total",
        "Clique em 'Salvar' para confirmar",
      ],
    },
    {
      icon: Calendar,
      title: "Acompanhamento de Vencimentos",
      description: "Controle suas parcelas e datas de vencimento",
      items: [
        "Acesse 'Vencimentos' para ver todas as parcelas",
        "Visualize o status de cada parcela (Pendente, Pago, Atrasado)",
        "Clique no ícone de edição para marcar uma parcela como paga",
        "Use os filtros para encontrar parcelas específicas",
        "Receba alertas de parcelas vencidas",
      ],
    },
    {
      icon: BarChart3,
      title: "Relatórios e Exportação",
      description: "Gere relatórios e exporte dados em CSV ou PDF",
      items: [
        "Acesse a seção 'Relatórios'",
        "Selecione o período desejado com as datas inicial e final",
        "Escolha o tipo de relatório (Contratos, Recebimentos, Financeiro, Clientes)",
        "Clique em 'Exportar como CSV' ou 'Exportar como PDF'",
        "O arquivo será baixado automaticamente",
      ],
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Como Usar</h1>
        <p className="text-gray-600 mt-1">
          Guia completo de funcionalidades do SysJuros
        </p>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <Card key={guide.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                    <p className="text-sm text-gray-600">{guide.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 list-decimal list-inside">
                  {guide.items.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {item}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-green-600" />
            <CardTitle>Perguntas Frequentes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Como o cálculo de juros é feito?
            </h3>
            <p className="text-gray-700">
              O sistema calcula automaticamente o valor dos juros multiplicando o valor original pela taxa de juros inserida. O valor total é a soma do valor original com o valor dos juros.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Posso editar um contrato após criado?
            </h3>
            <p className="text-gray-700">
              Sim, você pode editar contratos enquanto estiverem com status "Aberto". Basta clicar no ícone de edição na tabela de contratos.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Como marcar uma parcela como paga?
            </h3>
            <p className="text-gray-700">
              Acesse a seção "Vencimentos", encontre a parcela desejada e clique no ícone de edição. Selecione "Marcar como Pago" e confirme.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Quais informações são obrigatórias para cadastrar um cliente?
            </h3>
            <p className="text-gray-700">
              Nome, email, telefone, CPF/CNPJ e endereço completo são campos obrigatórios. Os demais campos são opcionais.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Como exportar dados em PDF?
            </h3>
            <p className="text-gray-700">
              Na seção "Relatórios", selecione o período desejado, escolha o tipo de relatório e clique em "Exportar como PDF". O arquivo será baixado automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
