import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MessageSquare, Clock, MapPin } from "lucide-react";

export default function Support() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Support form submitted");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Suporte</h1>
        <p className="text-gray-600 mt-1">
          Estamos aqui para ajudar. Entre em contato conosco
        </p>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Telefone</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">(31) 3333-3333</p>
            <p className="text-sm text-gray-600 mt-2">Seg-Sex: 9h às 18h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Email</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-gray-900 break-all">
              suporte@sysjuros.com
            </p>
            <p className="text-sm text-gray-600 mt-2">Resposta em até 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Horário</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-900 font-medium">Seg-Sex: 9h às 18h</p>
            <p className="text-sm text-gray-900 font-medium">Sáb: 9h às 13h</p>
            <p className="text-sm text-gray-600 mt-2">Horário de Brasília</p>
          </CardContent>
        </Card>
      </div>

      {/* Support Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Envie sua Mensagem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Assunto</label>
              <Input placeholder="Qual é o assunto?" />
            </div>

            <div>
              <label className="form-label">Categoria</label>
              <select className="form-input">
                <option>Dúvida sobre funcionalidade</option>
                <option>Problema técnico</option>
                <option>Sugestão de melhoria</option>
                <option>Outro</option>
              </select>
            </div>

            <div>
              <label className="form-label">Mensagem</label>
              <textarea
                placeholder="Descreva seu problema ou dúvida"
                rows={5}
                className="form-input"
              />
            </div>

            <Button type="submit" className="btn-primary-green w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Enviar Mensagem
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Problemas Comuns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Esqueci minha senha. Como faço para recuperá-la?
            </h3>
            <p className="text-gray-700">
              Clique em "Esqueci minha senha" na página de login e siga as instruções enviadas para seu email.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Não consigo acessar minha conta. O que fazer?
            </h3>
            <p className="text-gray-700">
              Verifique se você está usando o email correto. Se o problema persistir, entre em contato conosco através do formulário acima.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Como faço para cancelar minha conta?
            </h3>
            <p className="text-gray-700">
              Entre em contato com nosso suporte através do email ou telefone. Precisaremos de algumas informações para processar seu pedido.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Qual é a política de privacidade?
            </h3>
            <p className="text-gray-700">
              Você pode consultar nossa política de privacidade completa em nossa página de políticas. Seus dados são protegidos com criptografia de ponta.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Posso usar SysJuros em dispositivos móveis?
            </h3>
            <p className="text-gray-700">
              Sim! SysJuros é totalmente responsivo e funciona perfeitamente em smartphones e tablets.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
