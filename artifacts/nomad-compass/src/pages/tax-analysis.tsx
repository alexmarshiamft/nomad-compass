import { useEffect } from "react";
import { useRoute } from "wouter";
import { useGetTaxAnalysis } from "@workspace/api-client-react";
import { useUser } from "@/lib/user-context";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { AlertTriangle, Lightbulb, Calculator, Info, Plane, CheckCircle2, Building2, HeartPulse, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TaxAnalysis() {
  const [, params] = useRoute("/tax-analysis/:locationId");
  const locationId = params?.locationId;
  const { profile } = useUser();

  const taxMutation = useGetTaxAnalysis();

  useEffect(() => {
    if (locationId && !taxMutation.isPending && !taxMutation.data) {
      taxMutation.mutate({
        data: {
          locationId,
          annualIncomeUSD: profile.annualIncomeUSD,
          employerCountry: profile.employerCountry,
          employerState: profile.employerState,
        }
      });
    }
  }, [locationId, profile, taxMutation]);

  if (taxMutation.isPending || !taxMutation.data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const data = taxMutation.data;

  // Data for the chart
  const chartData = [
    {
      name: "Gross Income",
      value: data.annualIncomeUSD,
      fill: "hsl(var(--primary))",
    },
    {
      name: "Taxes",
      value: data.annualTaxUSD,
      fill: "hsl(var(--destructive))",
    },
    {
      name: "Est. Living Costs",
      value: (data.annualIncomeUSD - data.annualTaxUSD) - (data.monthlyNetUSD * 12), // Rough approx from net 
      fill: "hsl(var(--chart-2))",
    },
    {
      name: "Disposable",
      value: data.monthlyNetUSD * 12,
      fill: "hsl(var(--chart-3))",
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Tax Analysis: {data.city}, {data.country}
        </h1>
        <p className="text-muted-foreground text-lg">
          Based on {formatCurrency(data.annualIncomeUSD)}/yr remote income.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Key Metrics */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Effective Tax Rate</p>
                <p className="text-3xl font-bold text-foreground">{formatPercent(data.effectiveTaxRate)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Net</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.monthlyNetUSD)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Tax Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.taxBreakdown.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {item.label}
                        {item.notes && (
                          <span className="block text-xs text-muted-foreground mt-0.5">{item.notes}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatPercent(item.rate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.annualAmountUSD)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total Taxes</TableCell>
                    <TableCell className="text-right">{formatPercent(data.effectiveTaxRate)}</TableCell>
                    <TableCell className="text-right text-rose-600 dark:text-rose-400">{formatCurrency(data.annualTaxUSD)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Visuals and AI Analysis */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Income Distribution (Annual)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickFormatter={(val) => `$${val / 1000}k`}
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{data.aiAnalysis}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Optimization Tips
          </h3>
          <div className="grid gap-3">
            {data.optimizationTips.map((tip, i) => (
              <Card key={i} className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="p-4 text-sm">
                  {tip}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Key Warnings
          </h3>
          <div className="grid gap-3">
            {data.warnings.map((warning, i) => (
              <Alert key={i} variant="destructive" className="bg-destructive/5">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Watch out</AlertTitle>
                <AlertDescription className="text-sm">
                  {warning}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      </div>

      {/* Relocation Reality Check */}
      {data.relocationInfo && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plane className="w-5 h-5 text-primary" />
              Relocation Reality Check
            </CardTitle>
            <CardDescription>
              Practical steps and costs to legally live and work remotely in {data.city}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stat pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted/50 border">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Plane className="w-3 h-3" /> Setup Difficulty
                </span>
                <span className="font-bold text-lg leading-tight">{data.relocationInfo.setupDifficultyLabel}</span>
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < data.relocationInfo.setupDifficulty ? "bg-primary" : "bg-muted"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted/50 border">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Visa-Free Stay
                </span>
                <span className="font-bold text-lg leading-tight">{data.relocationInfo.touristVisaDays} days</span>
                <span className="text-xs text-muted-foreground">on tourist entry</span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted/50 border">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Move-In Cost
                </span>
                <span className="font-bold text-lg leading-tight">{formatCurrency(data.relocationInfo.estimatedMoveInCostUSD)}</span>
                <span className="text-xs text-muted-foreground">estimated one-time</span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted/50 border">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <HeartPulse className="w-3 h-3" /> Health Insurance
                </span>
                <span className="font-bold text-lg leading-tight">{data.relocationInfo.healthInsuranceRequired ? "Required" : "Optional"}</span>
                <span className="text-xs text-muted-foreground">for visa / residency</span>
              </div>
            </div>

            <Separator />

            {/* Key Steps */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Step-by-Step Guide
              </h4>
              <ol className="space-y-3">
                {data.relocationInfo.keySteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <Separator />

            {/* Banking */}
            <div className="flex gap-3">
              <Building2 className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-semibold mb-1">Banking Notes</p>
                <p className="text-sm text-muted-foreground">{data.relocationInfo.bankingNotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
