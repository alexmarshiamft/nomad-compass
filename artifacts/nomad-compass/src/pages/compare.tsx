import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useListLocations, useCompareLocations, getListLocationsQueryKey } from "@workspace/api-client-react";
import { useUser } from "@/lib/user-context";
import NomadChatbot from "@/components/NomadChatbot";
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
import { ArrowUpDown, CheckCircle2, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

function ColHeader({
  label,
  tip,
  sortKey,
  activeSortCol,
  onSort,
  align = "left",
}: {
  label: string;
  tip: string;
  sortKey: string;
  activeSortCol: string;
  onSort: (col: string) => void;
  align?: "left" | "right" | "center";
}) {
  const active = activeSortCol === sortKey;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => onSort(sortKey)}
          className={`flex items-center gap-1 w-full ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"} group`}
        >
          <span className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
            {label}
          </span>
          <Info className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0" />
          <ArrowUpDown className={`w-3 h-3 shrink-0 ${active ? "text-primary" : "text-muted-foreground/40"}`} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-center leading-snug">
        {tip}
      </TooltipContent>
    </Tooltip>
  );
}

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

  // Stable key of all profile fields that should trigger a re-comparison
  const compareKey = useMemo(() => JSON.stringify({
    annualIncomeUSD: profile.annualIncomeUSD,
    employerCountry: profile.employerCountry,
    employerState: profile.employerState,
    stayInUSA: profile.stayInUSA,
    priorities: [...(profile.priorities ?? [])].sort(),
    workSchedule: profile.workSchedule,
    teamTimezone: profile.teamTimezone,
  }), [profile.annualIncomeUSD, profile.employerCountry, profile.employerState,
       profile.stayInUSA, profile.priorities, profile.workSchedule, profile.teamTimezone]);

  useEffect(() => {
    if (!locationsData?.locations || compareMutation.isPending) return;

    const locationIds = profile.stayInUSA
      ? locationsData.locations.filter(l => l.countryCode === "US").map(l => l.id)
      : undefined;

    compareMutation.mutate({
      data: {
        annualIncomeUSD: profile.annualIncomeUSD,
        employerCountry: profile.employerCountry,
        employerState: profile.employerState,
        locationIds,
        priorities: profile.priorities ?? [],
        workSchedule: profile.workSchedule,
        teamTimezone: profile.teamTimezone,
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationsData, compareKey]);

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

      <TooltipProvider delayDuration={300}>
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">
                  <ColHeader label="Location" tip="City and country. Click to sort alphabetically." sortKey="city" activeSortCol={sortCol} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <ColHeader label="Score" tip="Overall suitability score (0–100) combining taxes, cost of living, quality of life, timezone overlap, and visa options — weighted equally by default, adjusted by your priorities." sortKey="overallScore" activeSortCol={sortCol} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <ColHeader label="Tax Rate" tip="Your effective (all-in) tax rate as a % of gross income — includes local income tax plus any social security you'd owe as a resident. 0% = territorial or zero-tax country." sortKey="effectiveTaxRate" activeSortCol={sortCol} onSort={handleSort} align="right" />
                </TableHead>
                <TableHead>
                  <ColHeader label="Net/mo" tip="Monthly take-home pay after all local taxes. This is what actually lands in your bank account each month." sortKey="monthlyNetIncomeUSD" activeSortCol={sortCol} onSort={handleSort} align="right" />
                </TableHead>
                <TableHead>
                  <ColHeader label="Cost/mo" tip="Estimated monthly cost of living: rent (1-bed city center) + food + transport + utilities + other essentials. Excludes travel and entertainment." sortKey="monthlyCostOfLivingUSD" activeSortCol={sortCol} onSort={handleSort} align="right" />
                </TableHead>
                {homeCOL !== null && (
                  <TableHead className="text-right text-muted-foreground/80 whitespace-nowrap text-xs">
                    vs. {homeCityLabel}
                  </TableHead>
                )}
                <TableHead>
                  <ColHeader label="Disposable/mo" tip="Money left over each month after taxes AND living costs. The higher this is, the faster you can save, invest, or spend on experiences." sortKey="monthlyDisposableIncomeUSD" activeSortCol={sortCol} onSort={handleSort} align="right" />
                </TableHead>
                <TableHead>
                  <ColHeader label="Quality of Life" tip="Quality of life score (0–100) reflecting safety, healthcare quality, climate, and general livability data from public indices." sortKey="qualityOfLife" activeSortCol={sortCol} onSort={handleSort} />
                </TableHead>
                {!isUSMode && (
                  <TableHead>
                    <ColHeader label="Nomad Visa" tip="Whether this country offers a dedicated digital nomad or remote worker visa — giving you a legal long-term stay path without a local employer." sortKey="hasDigitalNomadVisa" activeSortCol={sortCol} onSort={handleSort} align="center" />
                  </TableHead>
                )}
                <TableHead>
                  <ColHeader label="Move Ease" tip="How straightforward it is to actually relocate and establish legal residency — factoring in bureaucracy, language barriers, banking access, and typical setup time." sortKey="relocationDifficulty" activeSortCol={sortCol} onSort={handleSort} />
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
      </TooltipProvider>

      <NomadChatbot
        comparisons={compareMutation.data?.comparisons ?? []}
        annualIncomeUSD={profile.annualIncomeUSD}
        employerCountry={profile.employerCountry}
        employerCity={profile.employerCity || "Los Angeles, CA"}
        homeCityCOL={homeCOL}
      />
    </div>
  );
}
