import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Globe2, Plane, ShieldCheck, Wallet, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetLocationStats, getGetLocationStatsQueryKey } from "@workspace/api-client-react";
import { useUser } from "@/lib/user-context";

const formSchema = z.object({
  annualIncomeUSD: z.coerce.number().min(1, "Income must be greater than 0"),
  employerCountry: z.string().min(2, "Please select an employer country"),
  employerState: z.string().optional(),
});

export default function Home() {
  const [, setLocation] = useLocation();
  const { profile, setProfile } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      annualIncomeUSD: profile.annualIncomeUSD,
      employerCountry: profile.employerCountry,
      employerState: profile.employerState || "",
    },
  });

  const { data: stats, isLoading } = useGetLocationStats({
    query: { queryKey: getGetLocationStatsQueryKey() },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setProfile({
      annualIncomeUSD: values.annualIncomeUSD,
      employerCountry: values.employerCountry,
      employerState: values.employerState || undefined,
    });
    setLocation("/compare");
  }

  function goToPicks() {
    const values = form.getValues();
    setProfile({
      annualIncomeUSD: values.annualIncomeUSD,
      employerCountry: values.employerCountry,
      employerState: values.employerState || undefined,
    });
    setLocation("/recommendations");
  }

  return (
    <div>
      {/* ── Hero with video background ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Video iframe — fills the section */}
        <iframe
          src="/nomad-compass-hero/"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ border: "none" }}
          title="Nomad Compass hero video"
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Dark gradient overlay so content stays readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(11,17,32,0.85) 0%, rgba(11,17,32,0.70) 55%, rgba(11,17,32,0.20) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-20 max-w-6xl">
          <div className="max-w-xl">
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-4">
              Global Location Optimizer
            </p>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Live Better.<br />Keep More.
            </h1>
            <p className="text-lg text-white/70 mb-10 leading-relaxed">
              Data-driven tax and cost-of-living analysis across 38+ cities.
              Find out exactly where your remote salary goes furthest.
            </p>

            {/* Form card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="annualIncomeUSD"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Annual Income (USD)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-white/50">$</span>
                              <Input
                                type="number"
                                className="pl-7 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-amber-400 focus:ring-amber-400/20"
                                placeholder="100000"
                                data-testid="input-income"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="employerCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Employer Country</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger
                                className="bg-white/10 border-white/20 text-white focus:border-amber-400"
                                data-testid="select-country"
                              >
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="GB">United Kingdom</SelectItem>
                              <SelectItem value="DE">Germany</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="AU">Australia</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch("employerCountry") === "US" && (
                    <FormField
                      control={form.control}
                      name="employerState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Employer State</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger
                                className="bg-white/10 border-white/20 text-white focus:border-amber-400"
                                data-testid="select-state"
                              >
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CA">California</SelectItem>
                              <SelectItem value="NY">New York</SelectItem>
                              <SelectItem value="TX">Texas</SelectItem>
                              <SelectItem value="FL">Florida</SelectItem>
                              <SelectItem value="WA">Washington</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1 text-base bg-amber-500 hover:bg-amber-400 text-black font-semibold group border-0"
                      data-testid="button-compare"
                    >
                      Compare Locations
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="flex-1 text-base border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
                      onClick={goToPicks}
                      data-testid="button-ai-picks"
                    >
                      Get AI Picks
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip below hero ── */}
      <section className="bg-background border-t border-border">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <Globe2 className="w-7 h-7 text-primary mb-2" />
                <CardTitle className="text-3xl">{isLoading ? "—" : stats?.totalLocations}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Cities Analyzed</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <Plane className="w-7 h-7 text-primary mb-2" />
                <CardTitle className="text-3xl">{isLoading ? "—" : stats?.locationsWithNomadVisa}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Digital Nomad Visas</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <Wallet className="w-7 h-7 text-primary mb-2" />
                <CardTitle className="text-lg">{isLoading ? "—" : stats?.lowestTaxLocation}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Lowest Tax Rate</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <ShieldCheck className="w-7 h-7 text-primary mb-2" />
                <CardTitle className="text-lg">{isLoading ? "—" : stats?.highestQolLocation}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Highest Quality of Life</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
