import { useState } from "react";
import { useLocation } from "wouter";
import { useGetRecommendations } from "@workspace/api-client-react";
import { useUser } from "@/lib/user-context";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight, CheckCircle2, TrendingUp, Building, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PRIORITIES = [
  { id: "low-tax", label: "Low Tax" },
  { id: "low-cost", label: "Low Cost of Living" },
  { id: "warm-climate", label: "Warm Climate" },
  { id: "english-friendly", label: "English Friendly" },
  { id: "digital-nomad-visa", label: "Digital Nomad Visa" },
  { id: "good-healthcare", label: "Good Healthcare" },
];

export default function Recommendations() {
  const [, setLocation] = useLocation();
  const { profile } = useUser();
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(profile.priorities ?? []);

  const recommendMutation = useGetRecommendations();

  const handleAnalyze = () => {
    recommendMutation.mutate({
      data: {
        annualIncomeUSD: profile.annualIncomeUSD,
        employerCountry: profile.employerCountry,
        employerState: profile.employerState,
        priorities: selectedPriorities,
        workSchedule: profile.workSchedule,
        teamTimezone: profile.teamTimezone,
      }
    });
  };

  const handleTogglePriority = (id: string) => {
    setSelectedPriorities(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">AI Picks</h1>
            <p className="text-muted-foreground text-sm">
              Select your priorities and let AI find your perfect base.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Priorities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {PRIORITIES.map(p => (
                <div key={p.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`priority-${p.id}`} 
                    checked={selectedPriorities.includes(p.id)}
                    onCheckedChange={() => handleTogglePriority(p.id)}
                    data-testid={`checkbox-${p.id}`}
                  />
                  <Label htmlFor={`priority-${p.id}`} className="cursor-pointer">{p.label}</Label>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleAnalyze} 
                className="w-full" 
                disabled={recommendMutation.isPending}
                data-testid="button-analyze"
              >
                {recommendMutation.isPending ? (
                  <>Analyzing...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-2/3 lg:w-3/4">
          {!recommendMutation.data && !recommendMutation.isPending && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border rounded-xl">
              <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">Ready to find your next home?</h3>
              <p className="text-muted-foreground max-w-md">
                Select your priorities on the left and click Analyze. We'll use AI to evaluate taxes, visas, and living costs for your specific situation.
              </p>
            </div>
          )}

          {recommendMutation.isPending && (
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <div className="grid sm:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          )}

          {recommendMutation.data && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Sparkles className="w-8 h-8 text-primary shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-foreground">AI Analysis</h3>
                      <p className="text-foreground/80 leading-relaxed">
                        {recommendMutation.data.aiSummary}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid sm:grid-cols-2 gap-6">
                {recommendMutation.data.topPicks.map((pick, i) => (
                  <Card key={pick.locationId} className="flex flex-col border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group" data-testid={`card-pick-${pick.locationId}`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary transform origin-left transition-transform scale-x-0 group-hover:scale-x-100"></div>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className="mb-2">#{i + 1} Pick</Badge>
                        <span className="text-3xl" title={pick.country}>{pick.emoji}</span>
                      </div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {pick.city}, {pick.countryCode}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" /> Score: {pick.overallScore}/100
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm flex items-center gap-2"><Building className="w-4 h-4"/> Effective Tax</span>
                          <span className="font-medium">{formatPercent(pick.effectiveTaxRate)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground text-sm flex items-center gap-2"><MapPin className="w-4 h-4"/> Cost of Living</span>
                          <span className="font-medium text-rose-500">{formatCurrency(pick.monthlyCostOfLivingUSD)}/mo</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-muted-foreground text-sm font-medium">Disposable Income</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(pick.monthlyDisposableIncomeUSD)}/mo</span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-sm font-semibold mb-2">Key Advantages</h4>
                          <ul className="space-y-1">
                            {pick.pros.slice(0, 2).map((pro, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 border-t border-border/50 bg-muted/20">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between" 
                        onClick={() => setLocation(`/tax-analysis/${pick.locationId}`)}
                      >
                        View Tax Breakdown
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
