import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useListLocations, useCompareLocations, getListLocationsQueryKey } from "@workspace/api-client-react";
import { useUser } from "@/lib/user-context";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const US_STATE: Record<string, string> = {
  "us-austin": "TX", "us-miami": "FL", "us-denver": "CO",
  "us-nashville": "TN", "us-tampa": "FL", "us-phoenix": "AZ",
  "us-raleigh": "NC", "us-seattle": "WA",
};

export default function Compare() {
  const [, setLocation] = useLocation();
  const { profile } = useUser();
  const [sortCol, setSortCol] = useState<string>("overallScore");
  const [sortDesc, setSortDesc] = useState(true);

  const { data: locationsData, isLoading: isLoadingLocations } = useListLocations({
    query: { queryKey: getListLocationsQueryKey() }
  });

  const compareMutation = useCompareLocations();

  useEffect(() => {
    if (locationsData?.locations && !compareMutation.isPending && !compareMutation.data) {
      const locationIds = profile.stayInUSA
        ? locationsData.locations.filter(l => l.countryCode === "US").map(l => l.id)
        : undefined;

      compareMutation.mutate({
        data: {
          annualIncomeUSD: profile.annualIncomeUSD,
          employerCountry: profile.employerCountry,
          employerState: profile.employerState,
          locationIds,
        }
      });
    }
  }, [locationsData, profile, compareMutation]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortCol(col);
      setSortDesc(true);
    }
  };

  const sortedData = useMemo(() => {
    if (!compareMutation.data?.comparisons) return [];
    
    return [...compareMutation.data.comparisons].sort((a, b) => {
      let valA: any = a[sortCol as keyof typeof a];
      let valB: any = b[sortCol as keyof typeof b];

      if (sortCol === "monthlyNetIncomeUSD") {
        valA = a.monthlyNetIncomeUSD;
        valB = b.monthlyNetIncomeUSD;
      } else if (sortCol === "qualityOfLife") {
        valA = a.qualityOfLife.score;
        valB = b.qualityOfLife.score;
      } else if (sortCol === "hasDigitalNomadVisa") {
        valA = a.visaInfo.hasDigitalNomadVisa ? 1 : 0;
        valB = b.visaInfo.hasDigitalNomadVisa ? 1 : 0;
      }

      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });
  }, [compareMutation.data, sortCol, sortDesc]);

  const isUSMode = profile.stayInUSA;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          {isUSMode && <span className="text-2xl">🇺🇸</span>}
          <h1 className="text-3xl font-bold">
            {isUSMode ? "Best US Cities for Remote Work" : "Global Comparison"}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {isUSMode
            ? `Ranking US cities for a ${formatCurrency(profile.annualIncomeUSD)} income, including federal + state taxes and cost of living.`
            : `Ranking locations based on an income of ${formatCurrency(profile.annualIncomeUSD)} from ${profile.employerCountry}.`}
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px] cursor-pointer" onClick={() => handleSort("city")}>
                  <div className="flex items-center gap-1">Location <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("overallScore")}>
                  <div className="flex items-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort("effectiveTaxRate")}>
                  <div className="flex justify-end items-center gap-1">Effective Tax <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort("monthlyNetIncomeUSD")}>
                  <div className="flex justify-end items-center gap-1">Net/mo <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort("monthlyCostOfLivingUSD")}>
                  <div className="flex justify-end items-center gap-1">COL/mo <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort("monthlyDisposableIncomeUSD")}>
                  <div className="flex justify-end items-center gap-1">Disposable/mo <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("qualityOfLife")}>
                  <div className="flex items-center gap-1">QoL <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                {!isUSMode && (
                  <TableHead className="cursor-pointer text-center" onClick={() => handleSort("hasDigitalNomadVisa")}>
                    <div className="flex justify-center items-center gap-1">Nomad Visa <ArrowUpDown className="w-3 h-3" /></div>
                  </TableHead>
                )}
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compareMutation.isPending || isLoadingLocations ? (
                Array.from({ length: isUSMode ? 8 : 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: isUSMode ? 8 : 9 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedData.map((loc) => (
                <TableRow 
                  key={loc.locationId} 
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setLocation(`/tax-analysis/${loc.locationId}`)}
                  data-testid={`row-location-${loc.locationId}`}
                >
                  <TableCell className="font-medium">
                    <span className="mr-2">{loc.emoji}</span>
                    {loc.city}, {isUSMode ? (US_STATE[loc.locationId] ?? "US") : loc.countryCode}
                  </TableCell>
                  <TableCell>
                    <Badge variant={loc.overallScore > 80 ? "default" : "secondary"}>
                      {loc.overallScore}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatPercent(loc.effectiveTaxRate)}</TableCell>
                  <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(loc.monthlyNetIncomeUSD)}
                  </TableCell>
                  <TableCell className="text-right text-rose-600 dark:text-rose-400">
                    {formatCurrency(loc.monthlyCostOfLivingUSD)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(loc.monthlyDisposableIncomeUSD)}
                  </TableCell>
                  <TableCell>{loc.qualityOfLife.score}/100</TableCell>
                  {!isUSMode && (
                    <TableCell className="text-center">
                      {loc.visaInfo.hasDigitalNomadVisa ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      Analyze
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
