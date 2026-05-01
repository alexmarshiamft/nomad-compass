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

const HOME_CITY_COL: Record<string, number> = {
  "los angeles": 3200, "san francisco": 3900, "new york": 3800,
  "seattle": 2900, "austin": 2300, "chicago": 2600, "boston": 3300,
  "miami": 2700, "denver": 2600, "nashville": 2200, "phoenix": 2100,
  "atlanta": 2300, "dallas": 2200, "portland": 2700, "san diego": 3100,
  "washington": 3200, "minneapolis": 2300, "london": 3500,
  "toronto": 2800, "sydney": 3400, "san jose": 3800, "raleigh": 2200,
  "tampa": 2300, "houston": 2200, "charlotte": 2300, "sacramento": 2800,
};

function getHomeCityCOL(employerCity: string): number | null {
  const lower = employerCity.toLowerCase();
  for (const [key, val] of Object.entries(HOME_CITY_COL)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

const DIFFICULTY_COLOR: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  2: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  3: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  4: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  5: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

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
      } else if (sortCol === "relocationDifficulty") {
        valA = 6 - (a.relocationInfo?.setupDifficulty ?? 3);
        valB = 6 - (b.relocationInfo?.setupDifficulty ?? 3);
      }

      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });
  }, [compareMutation.data, sortCol, sortDesc]);

  const isUSMode = profile.stayInUSA;
  const homeCOL = getHomeCityCOL(profile.employerCity || "Los Angeles, CA");
  const homeCityLabel = profile.employerCity
    ? profile.employerCity.split(",")[0].trim()
    : "Home";

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
            ? `Ranking US cities for a ${formatCurrency(profile.annualIncomeUSD)} income, including federal + state taxes and cost of living${homeCOL ? ` vs. ${homeCityLabel} ($${homeCOL.toLocaleString()}/mo)` : ""}.`
            : `Ranking locations based on a ${formatCurrency(profile.annualIncomeUSD)} income from ${profile.employerCountry}${homeCOL ? ` — COL compared to ${homeCityLabel} ($${homeCOL.toLocaleString()}/mo)` : ""}.`}
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
                {homeCOL !== null && (
                  <TableHead className="text-right text-muted-foreground/80 whitespace-nowrap">
                    vs. {homeCityLabel}
                  </TableHead>
                )}
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
                <TableHead className="cursor-pointer" onClick={() => handleSort("relocationDifficulty")}>
                  <div className="flex items-center gap-1">Move Ease <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compareMutation.isPending || isLoadingLocations ? (
                Array.from({ length: isUSMode ? 8 : 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: isUSMode ? (homeCOL ? 10 : 9) : (homeCOL ? 11 : 10) }).map((_, j) => (
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
                  {homeCOL !== null && (() => {
                    const savings = homeCOL - loc.monthlyCostOfLivingUSD;
                    const pct = Math.round(Math.abs(savings) / homeCOL * 100);
                    return (
                      <TableCell className="text-right">
                        {savings > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm whitespace-nowrap">
                            -{pct}% ({formatCurrency(savings)})
                          </span>
                        ) : savings < 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-medium text-sm whitespace-nowrap">
                            +{pct}% ({formatCurrency(-savings)})
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Same</span>
                        )}
                      </TableCell>
                    );
                  })()}
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
                    {loc.relocationInfo && (
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${DIFFICULTY_COLOR[loc.relocationInfo.setupDifficulty] ?? DIFFICULTY_COLOR[3]}`}>
                        {loc.relocationInfo.setupDifficultyLabel}
                      </span>
                    )}
                  </TableCell>
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
