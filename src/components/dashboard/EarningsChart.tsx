import { useMemo } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatShortCurrency } from "@/lib/formatters";

export type EarningsChartPoint = {
  label: string;
  revenue: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
};

type Props = {
  data: EarningsChartPoint[];
};

const config: ChartConfig = {
  revenue: {
    label: "Pendapatan",
    color: "hsl(var(--primary))",
  },
  grossProfit: {
    label: "Profit Kotor",
    color: "hsl(var(--accent))",
  },
  expenses: {
    label: "Pengeluaran",
    color: "hsl(var(--destructive))",
  },
  netProfit: {
    label: "Profit Bersih",
    color: "hsl(var(--ring))",
  },
};

export function EarningsChart({ data }: Props) {
  const chartData = useMemo(() => {
    // Keep chart left-to-right chronological
    return [...data];
  }, [data]);

  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tickMargin={8}
          tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 10)}…` : v)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickMargin={8}
          tickFormatter={(v: number) => formatShortCurrency(v)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const label = config[name as keyof typeof config]?.label || name;
                return (
                  <span className="flex items-center justify-between gap-2 w-full">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatShortCurrency(Number(value))}
                    </span>
                  </span>
                );
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="grossProfit"
          stroke="var(--color-grossProfit)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="var(--color-expenses)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="netProfit"
          stroke="var(--color-netProfit)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
