# SysJuros Clone - Lista de Tarefas

## Fase 1: Análise e Inicialização
- [x] Analisar site original (sysjuros.com.br)
- [x] Mapear funcionalidades e componentes
- [x] Capturar screenshots de referência
- [x] Inicializar projeto web com scaffold web-db-user

## Fase 2: Autenticação e Banco de Dados
- [x] Configurar schema de banco de dados (users, customers, contracts, installments)
- [x] Gerar e aplicar migrações SQL
- [x] Implementar procedures de autenticação (login, logout)
- [x] Testes de autenticação com vitest

## Fase 3: Layout Base e Componentes
- [x] Criar DashboardLayout com sidebar verde escuro
- [x] Implementar navegação lateral com itens: Início, Clientes, Contratos, Vencimentos, Relatórios, Como usar, Perfil, Suporte
- [x] Criar componentes de cards de resumo (Hoje, Atrasadas, Clientes, Contratos)
- [x] Implementar tabelas reutilizáveis com ações (editar/excluir)
- [x] Criar componentes de modais/drawers para formulários
- [x] Configurar paleta de cores (sidebar verde escuro, botões verdes, badges)

## Fase 4: Dashboard (Início)
- [x] Implementar cards de resumo com dados dinâmicos
- [x] Integrar gráficos Chart.js para: Clientes, Número de Contratos, Valor de Contratos, Recebimentos
- [x] Criar procedures tRPC para buscar dados do dashboard
- [x] Testes de dashboard com vitest

## Fase 5: Gestão de Clientes
- [x] Criar schema de customers no banco de dados
- [x] Implementar CRUD de clientes (create, read, update, delete)
- [x] Criar página de listagem com busca por nome
- [x] Implementar paginação
- [x] Criar modal de novo cliente com validação de campos obrigatórios
- [x] Criar modal de edição de cliente
- [x] Implementar exclusão com confirmação
- [x] Testes de gestão de clientes com vitest

## Fase 6: Gestão de Contratos
- [x] Criar schema de contracts no banco de dados
- [x] Implementar CRUD de contratos (create, read, update, delete)
- [x] Criar página de listagem com filtro por cliente e status
- [x] Implementar cálculo automático de taxa e valor total
- [x] Criar modal de novo contrato com tipos (Fixo/Parcelado)
- [x] Criar geração automática de parcelas (installments)
- [x] Implementar edição de contratos
- [x] Implementar exclusão com confirmação
- [x] Testes de gestão de contratos com vitest

## Fase 7: Página de Vencimentos
- [x] Criar schema de installments no banco de dados
- [x] Implementar listagem de parcelas ordenada por data de vencimento
- [x] Adicionar indicadores de status de pagamento
- [x] Implementar ações de baixa de parcelas (marcar como pago)
- [x] Criar filtros por status e período
- [x] Testes de vencimentos com vitest

## Fase 8: Relatórios
- [x] Criar página de relatórios
- [x] Implementar filtros por período
- [x] Implementar visualização de dados financeiros
- [x] Adicionar funcionalidade de exportação (CSV/PDF)
- [x] Testes de relatórios com vitest

## Fase 9: Perfil do Usuário
- [x] Criar página de perfil com abas (Perfil, Plano, Notificação)
- [x] Implementar edição de nome, telefone, data de nascimento
- [x] Implementar upload de foto de perfil
- [x] Implementar salvamento de alterações
- [x] Testes de perfil com vitest

## Fase 10: Página de Suporte e Como Usar
- [x] Criar página "Como usar" com guia de funcionalidades
- [x] Criar página de suporte com informações de contato
- [x] Adicionar links de suporte no menu

## Fase 11: Testes e Refinamentos
- [x] Testar responsividade em diferentes tamanhos de tela
- [x] Testar fluxos de usuário completos
- [x] Corrigir bugs identificados
- [x] Otimizar performance
- [x] Validar conformidade com layout original

## Fase 12: Entrega
- [x] Criar checkpoint final
- [x] Preparar documentação
- [x] Entregar projeto ao usuário
