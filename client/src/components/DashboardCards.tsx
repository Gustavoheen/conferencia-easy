import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Users, FileText, Calendar } from 'lucide-react';

interface DashboardCardsProps {
  todayCount: number;
  overdueCount: number;
  customerCount: number;
  contractCount: number;
}

export default function DashboardCards({
  todayCount,
  overdueCount,
  customerCount,
  contractCount,
}: DashboardCardsProps) {
  const cards = [
    {
      title: 'Hoje',
      value: todayCount,
      icon: Calendar,
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Atrasadas',
      value: overdueCount,
      icon: AlertCircle,
      color: 'bg-red-50 text-red-600',
      borderColor: 'border-red-200',
    },
    {
      title: 'Clientes',
      value: customerCount,
      icon: Users,
      color: 'bg-green-50 text-green-600',
      borderColor: 'border-green-200',
    },
    {
      title: 'Contratos',
      value: contractCount,
      icon: FileText,
      color: 'bg-purple-50 text-purple-600',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className={`border-l-4 ${card.borderColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{card.value}</div>
              <p className="text-xs text-gray-500 mt-1">
                {card.title === 'Hoje' && 'cobranças do dia'}
                {card.title === 'Atrasadas' && 'cobranças atrasadas'}
                {card.title === 'Clientes' && 'clientes cadastrados'}
                {card.title === 'Contratos' && 'contratos ativos'}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
