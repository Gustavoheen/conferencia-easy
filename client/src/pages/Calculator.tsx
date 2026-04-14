import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator as CalcIcon, TrendingUp, DivideSquare } from "lucide-react";

function fmtBRL(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function InputField({ label, value, onChange, prefix, suffix, placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
        {prefix && <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r border-gray-300">{prefix}</span>}
        <input
          type="number"
          min="0"
          step="any"
          placeholder={placeholder || "0"}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm focus:outline-none"
        />
        {suffix && <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-l border-gray-300">{suffix}</span>}
      </div>
    </div>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${highlight ? "bg-blue-50" : "bg-gray-50"}`}>
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-bold ${highlight ? "text-blue-700 text-base" : "text-gray-800 text-sm"}`}>{value}</span>
    </div>
  );
}

// ==================== Calculadora de Juros ====================
function InterestCalc() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [months, setMonths] = useState("");

  const P = parseFloat(principal) || 0;
  const r = parseFloat(rate) || 0;
  const n = Math.max(1, parseInt(months) || 1);

  const monthlyInterest = P * r / 100;
  const totalInterest = monthlyInterest * n;
  const totalAmount = P + totalInterest;
  const monthlyPayment = totalAmount / n;

  return (
    <div className="space-y-4">
      <InputField label="Capital (valor emprestado)" value={principal} onChange={setPrincipal} prefix="R$" placeholder="0,00" />
      <InputField label="Taxa de juros mensal" value={rate} onChange={setRate} suffix="%" placeholder="3" />
      <InputField label="Prazo (meses)" value={months} onChange={setMonths} placeholder="12" />

      {P > 0 && r > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resultado</p>
          <ResultRow label="Juros mensais" value={fmtBRL(monthlyInterest)} />
          <ResultRow label="Total de juros" value={fmtBRL(totalInterest)} />
          <ResultRow label="Parcela mensal" value={fmtBRL(monthlyPayment)} />
          <ResultRow label="Total a pagar" value={fmtBRL(totalAmount)} highlight />
        </div>
      )}
    </div>
  );
}

// ==================== Simulador de Parcelamento ====================
function InstallmentCalc() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [installments, setInstallments] = useState("");
  const [type, setType] = useState<"installment" | "sac" | "revolving">("installment");

  const P = parseFloat(principal) || 0;
  const r = parseFloat(rate) || 0;
  const n = Math.max(1, parseInt(installments) || 1);

  // Compute based on type
  const computeInstallments = () => {
    if (P <= 0 || r <= 0 || n <= 0) return [];
    if (type === "installment") {
      // Juros simples: installmentValue = P/n + P*r/100 (same as app)
      const installmentValue = (P / n) + (P * r / 100);
      return Array.from({ length: n }, (_, i) => ({
        num: i + 1,
        value: installmentValue,
        capital: P / n,
        interest: P * r / 100,
        balance: P - (P / n) * (i + 1),
      }));
    } else if (type === "sac") {
      // SAC: amortização fixa + juros sobre saldo
      const amortization = P / n;
      return Array.from({ length: n }, (_, i) => {
        const remaining = P - amortization * i;
        const interest = remaining * r / 100;
        return {
          num: i + 1,
          value: amortization + interest,
          capital: amortization,
          interest,
          balance: Math.max(0, remaining - amortization),
        };
      });
    } else {
      // Revolving: só juros
      const interest = P * r / 100;
      return Array.from({ length: n }, (_, i) => ({
        num: i + 1,
        value: interest,
        capital: 0,
        interest,
        balance: P,
      }));
    }
  };

  const rows = computeInstallments();
  const totalPaid = rows.reduce((s, r) => s + r.value, 0);
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
  const firstInstallment = rows[0]?.value || 0;
  const lastInstallment = rows[rows.length - 1]?.value || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {(["installment", "sac", "revolving"] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              type === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "installment" ? "Parcelado" : t === "sac" ? "SAC" : "Rotativo"}
          </button>
        ))}
      </div>

      <InputField label="Valor da dívida" value={principal} onChange={setPrincipal} prefix="R$" placeholder="0,00" />
      <InputField label="Taxa de juros mensal" value={rate} onChange={setRate} suffix="%" placeholder="3" />
      <InputField label="Número de parcelas" value={installments} onChange={setInstallments} placeholder="12" />

      {rows.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resumo</p>
          {type !== "revolving" && firstInstallment !== lastInstallment && (
            <ResultRow label="1ª parcela" value={fmtBRL(firstInstallment)} />
          )}
          {type === "installment" || type === "revolving" ? (
            <ResultRow label={type === "revolving" ? "Juros mensais" : "Valor da parcela"} value={fmtBRL(firstInstallment)} />
          ) : null}
          {type === "sac" && (
            <>
              <ResultRow label="1ª parcela (maior)" value={fmtBRL(firstInstallment)} />
              <ResultRow label="Última parcela (menor)" value={fmtBRL(lastInstallment)} />
            </>
          )}
          <ResultRow label="Total de juros" value={fmtBRL(totalInterest)} />
          <ResultRow label="Total a pagar" value={fmtBRL(totalPaid)} highlight />

          {/* Table */}
          {n <= 24 && (
            <div className="mt-4 overflow-x-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tabela de parcelas</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left py-1.5 pr-3">#</th>
                    <th className="text-right py-1.5 pr-3">Parcela</th>
                    <th className="text-right py-1.5 pr-3">Capital</th>
                    <th className="text-right py-1.5 pr-3">Juros</th>
                    <th className="text-right py-1.5">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.num} className="border-b border-gray-50">
                      <td className="py-1.5 pr-3 text-gray-500">{row.num}</td>
                      <td className="py-1.5 pr-3 text-right font-medium">{fmtBRL(row.value)}</td>
                      <td className="py-1.5 pr-3 text-right text-blue-600">{fmtBRL(row.capital)}</td>
                      <td className="py-1.5 pr-3 text-right text-amber-600">{fmtBRL(row.interest)}</td>
                      <td className="py-1.5 text-right text-gray-500">{fmtBRL(Math.max(0, row.balance))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== Simulador de Divisão de Dívida ====================
function DebtSplitCalc() {
  const [total, setTotal] = useState("");
  const [rate, setRate] = useState("");
  const [n, setN] = useState("");

  const P = parseFloat(total) || 0;
  const r = parseFloat(rate) || 0;
  const months = Math.max(1, parseInt(n) || 1);

  // Parcelado simples (same logic as app)
  const installmentValue = P > 0 && r > 0 ? (P / months) + (P * r / 100) : 0;
  const totalPaid = installmentValue * months;
  const totalInterest = totalPaid - P;

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
        Simula como dividir uma dívida em parcelas iguais com juros simples mensais — mesma lógica de "Parcelado" do sistema.
      </div>
      <InputField label="Valor total da dívida" value={total} onChange={setTotal} prefix="R$" placeholder="0,00" />
      <InputField label="Taxa de juros mensal" value={rate} onChange={setRate} suffix="%" placeholder="3" />
      <InputField label="Em quantas parcelas?" value={n} onChange={setN} placeholder="6" />

      {P > 0 && r > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Proposta de parcelamento</p>
          <ResultRow label={`${months}x de`} value={fmtBRL(installmentValue)} highlight />
          <ResultRow label="Total de juros" value={fmtBRL(totalInterest)} />
          <ResultRow label="Total a pagar" value={fmtBRL(totalPaid)} />
          <ResultRow label="Percentual de juros" value={`${((totalInterest / P) * 100).toFixed(1)}%`} />
        </div>
      )}
    </div>
  );
}

export default function Calculator() {
  const [tab, setTab] = useState<"interest" | "installment" | "split">("interest");

  const tabs = [
    { key: "interest" as const, label: "Juros Simples", icon: TrendingUp },
    { key: "installment" as const, label: "Parcelamento", icon: CalcIcon },
    { key: "split" as const, label: "Dividir Dívida", icon: DivideSquare },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalcIcon className="w-6 h-6 text-blue-600" />
          Calculadora Financeira
        </h1>
        <p className="text-gray-500 text-sm mt-1">Simule juros e parcelamentos com as mesmas fórmulas do sistema</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-lg">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800">
              {tab === "interest" ? "Calculadora de Juros Simples" :
               tab === "installment" ? "Simulador de Parcelamento" :
               "Simulador de Divisão de Dívida"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tab === "interest" && <InterestCalc />}
            {tab === "installment" && <InstallmentCalc />}
            {tab === "split" && <DebtSplitCalc />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
