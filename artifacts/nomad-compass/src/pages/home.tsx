import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Building2, Globe2, Plane, ShieldCheck, Wallet, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Global Location Optimizer for Remote Workers
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Data-driven tax and cost of living optimization. Find out where you should live based on your remote salary.
          </p>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
              <CardDescription>Enter your income and employer location to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="annualIncomeUSD"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Income (USD)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                              <Input type="number" className="pl-7" placeholder="100000" data-testid="input-income" {...field} />
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
                          <FormLabel>Employer Country</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-country">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="GB">United Kingdom</SelectItem>
                              <SelectItem value="DE">Germany</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="AU">Canada</SelectItem>
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
                          <FormLabel>Employer State</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-state">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CA">California</SelectItem>
                              <SelectItem value="NY">New York</SelectItem>
                              <SelectItem value="TX">Texas</SelectItem>
                              <SelectItem value="FL">Texas</SelectItem>
                              <SelectItem value="WA">Washington</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button type="submit" size="lg" className="flex-1 text-base group" data-testid="button-compare">
                      Compare Locations
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button type="button" variant="secondary" size="lg" className="flex-1 text-base" onClick={goToPicks} data-testid="button-ai-picks">
                      Get AI Picks
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <Globe2 className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-2xl">{isLoading ? "-" : stats?.totalLocations}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Countries Analyzed</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <Plane className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-2xl">{isLoading ? "-" : stats?.locationsWithNomadVisa}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Digital Nomad Visas</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <Wallet className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg truncate">{isLoading ? "-" : stats?.lowestTaxLocation}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Lowest Tax Rate</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <ShieldCheck className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg truncate">{isLoading ? "-" : stats?.highestQolLocation}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Highest Quality of Life</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
