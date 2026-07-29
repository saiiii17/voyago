"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import type { ExpenseCategory } from "@/lib/types/database";

// Fixed categorical order — validated for adjacent-pair colorblind + normal-vision
// separation (see dataviz skill). Never reassign a category to a different slot.
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: "#2a78d6",
  transport: "#eb6834",
  lodging: "#1baf7a",
  activities: "#eda100",
  shopping: "#e87ba4",
  other: "#008300",
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: "Food",
  transport: "Transport",
  lodging: "Lodging",
  activities: "Activities",
  shopping: "Shopping",
  other: "Other",
};

interface Props {
  homeCurrency: string;
  spendByCategory: Partial<Record<ExpenseCategory, number>>;
}

export function CategoryChart({ homeCurrency, spendByCategory }: Props) {
  const data = (Object.keys(CATEGORY_LABELS) as ExpenseCategory[])
    .map((category) => ({ category, amount: spendByCategory[category] ?? 0 }))
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  if (data.length === 0) return null;

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-stone-900">Spending by category</h2>
      <div style={{ width: "100%", height: Math.max(120, data.length * 44) }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="category"
              tickFormatter={(c: ExpenseCategory) => CATEGORY_LABELS[c]}
              tickLine={false}
              axisLine={false}
              width={90}
              tick={{ fill: "#52514e", fontSize: 13 }}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0), homeCurrency)}
              labelFormatter={(c) => CATEGORY_LABELS[c as ExpenseCategory] ?? String(c)}
              contentStyle={{ borderRadius: 8, border: "1px solid #e1e0d9", fontSize: 13 }}
            />
            <Bar
              dataKey="amount"
              radius={[0, 4, 4, 0]}
              barSize={20}
              label={{
                position: "right",
                formatter: (v: unknown) => formatCurrency(Number(v ?? 0), homeCurrency),
                fill: "#52514e",
                fontSize: 12,
              }}
            >
              {data.map((d) => (
                <Cell key={d.category} fill={CATEGORY_COLORS[d.category]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
