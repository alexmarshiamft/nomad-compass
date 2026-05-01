import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Plane, ShieldCheck, Wallet, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetLocationStats, getGetLocationStatsQueryKey } from "@workspace/api-client-react";
import { useUser } from "@/lib/user-context";

const SEARCH_MESSAGES = [
  "Scanning 38 cities worldwide…",
  "Calculating effective tax rates…",
  "Comparing cost of living…",
  "Checking visa requirements…",
  "Analyzing internet speeds…",
  "Ranking by your profile…",
];

const PRIORITY_OPTIONS = [
  { id: "low-tax", label: "Low Tax" },
  { id: "low-cost", label: "Low Cost of Living" },
  { id: "warm-climate", label: "Warm Climate" },
  { id: "english-friendly", label: "English Friendly" },
  { id: "digital-nomad-visa", label: "Digital Nomad Visa" },
  { id: "good-healthcare", label: "Good Healthcare" },
  { id: "fast-internet", label: "Fast Internet" },
  { id: "safety", label: "Safety & Stability" },
];

const formSchema = z.object({
  annualIncomeUSD: z.coerce.number().min(1, "Income must be greater than 0"),
  employerCountry: z.string().min(2, "Please select an employer country"),
  employerState: z.string().optional(),
  workSchedule: z.string().optional(),
  teamTimezone: z.string().optional(),
});

function SearchingAnimation() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const tick = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % SEARCH_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 1400);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Spinner */}
      <div className="relative w-7 h-7 shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" />
      </div>
      <p
        className="text-sm text-amber-400/90 font-mono transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {SEARCH_MESSAGES[msgIndex]}
      </p>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { profile, setProfile } = useUser();
  const [step, setStep] = useState<"form" | "refine">("form");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(profile.priorities ?? []);
  const [customNote, setCustomNote] = useState(profile.customNote ?? "");
  const [stayInUSA, setStayInUSA] = useState(profile.stayInUSA ?? false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      annualIncomeUSD: profile.annualIncomeUSD,
      employerCountry: profile.employerCountry,
      employerState: profile.employerState || "",
      workSchedule: profile.workSchedule || "",
      teamTimezone: profile.teamTimezone || "",
    },
  });

  const { data: stats, isLoading } = useGetLocationStats({
    query: { queryKey: getGetLocationStatsQueryKey() },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setProfile({
      ...profile,
      annualIncomeUSD: values.annualIncomeUSD,
      employerCountry: values.employerCountry,
      employerState: values.employerState || undefined,
      workSchedule: values.workSchedule || undefined,
      teamTimezone: values.teamTimezone || undefined,
      stayInUSA,
    });
    if (stayInUSA) {
      setLocation("/compare");
    } else {
      setStep("refine");
    }
  }

  function goToPicks() {
    const values = form.getValues();
    setProfile({
      ...profile,
      annualIncomeUSD: values.annualIncomeUSD,
      employerCountry: values.employerCountry,
      employerState: values.employerState || undefined,
      workSchedule: values.workSchedule || undefined,
      teamTimezone: values.teamTimezone || undefined,
      priorities: selectedPriorities,
      customNote,
      stayInUSA,
    });
    setLocation("/recommendations");
  }

  function goToCompare() {
    setProfile({ ...profile, priorities: selectedPriorities, customNote, stayInUSA });
    setLocation("/compare");
  }

  function togglePriority(id: string) {
    setSelectedPriorities(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  return (
    <div>
      <section className="flex min-h-screen flex-col lg:flex-row overflow-hidden">

        {/* ── Left panel ── */}
        <div className="flex flex-col justify-center w-full lg:w-[52%] bg-[#0B1120] px-8 md:px-14 py-14 lg:py-20 shrink-0 overflow-hidden">

          <AnimatePresence mode="wait">

            {/* ── STEP 1: Profile form ── */}
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-4">
                  Global Location Optimizer
                </p>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-5 leading-tight">
                  Live Better.<br />Keep More.
                </h1>
                <p className="text-base text-white/60 mb-8 leading-relaxed max-w-sm">
                  Data-driven tax and cost-of-living analysis across 38+ cities.
                  Find out exactly where your remote salary goes furthest.
                </p>

                <div className="bg-white/[0.07] border border-white/10 rounded-2xl p-5 shadow-xl">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-amber-400" data-testid="select-country">
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
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-amber-400" data-testid="select-state">
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

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="workSchedule"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/80">Work Schedule</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-amber-400 focus:ring-amber-400/20"
                                  placeholder="e.g. 9am-5pm, async, flexible"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="teamTimezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/80">Team Timezone</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-amber-400 focus:ring-amber-400/20"
                                  placeholder="e.g. PST, UTC+2, EST"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Stay in USA toggle */}
                      <div
                        className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition-all ${
                          stayInUSA
                            ? "border-amber-500/60 bg-amber-500/10"
                            : "border-white/10 bg-white/[0.04] hover:border-white/20"
                        }`}
                        onClick={() => setStayInUSA(!stayInUSA)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🇺🇸</span>
                          <div>
                            <p className="text-white text-sm font-medium leading-none mb-0.5">
                              Stay within the USA
                            </p>
                            <p className="text-white/40 text-xs">
                              Compare US cities only — Austin, Miami, Denver & more
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={stayInUSA}
                          onCheckedChange={setStayInUSA}
                          className="data-[state=checked]:bg-amber-500"
                          onClick={e => e.stopPropagation()}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <Button
                          type="submit"
                          size="lg"
                          className="flex-1 text-base bg-amber-500 hover:bg-amber-400 text-black font-semibold group border-0"
                          data-testid="button-compare"
                        >
                          {stayInUSA ? "Find Best US Cities" : "Compare Locations"}
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        {!stayInUSA && (
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
                        )}
                      </div>
                    </form>
                  </Form>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Refine search ── */}
            {step === "refine" && (
              <motion.div
                key="refine"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {/* Back */}
                <button
                  onClick={() => setStep("form")}
                  className="text-white/40 hover:text-white/70 text-xs uppercase tracking-widest mb-6 flex items-center gap-1 transition-colors"
                >
                  ← Edit profile
                </button>

                <SearchingAnimation />

                <h2 className="text-3xl font-bold text-white mb-2">
                  Refine your search
                </h2>
                <p className="text-white/50 text-sm mb-6">
                  Optional — helps us surface the right cities for you.
                </p>

                {/* Priority chips */}
                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-3">
                  What matters most to you?
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {PRIORITY_OPTIONS.map((opt, i) => {
                    const selected = selectedPriorities.includes(opt.id);
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.045, duration: 0.3, ease: "easeOut" }}
                        onClick={() => togglePriority(opt.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          selected
                            ? "bg-amber-500 border-amber-500 text-black"
                            : "bg-white/5 border-white/15 text-white/70 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5" />}
                        {opt.label}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Custom note */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42, duration: 0.3 }}
                  className="mb-6"
                >
                  <label className="text-white/70 text-xs font-semibold uppercase tracking-widest block mb-2">
                    Anything else to guide the search?
                  </label>
                  <Textarea
                    value={customNote}
                    onChange={e => setCustomNote(e.target.value)}
                    placeholder="e.g. I have two dogs and need pet-friendly cities, prefer a beach lifestyle, or want to be close to a major airport…"
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-amber-400 focus:ring-amber-400/20 resize-none text-sm"
                    rows={3}
                  />
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.3 }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <Button
                    size="lg"
                    className="flex-1 text-base bg-amber-500 hover:bg-amber-400 text-black font-semibold border-0 group"
                    onClick={goToCompare}
                    data-testid="button-see-results"
                  >
                    See Results
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 text-base border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
                    onClick={goToPicks}
                  >
                    Get AI Picks Instead
                  </Button>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Right panel: video, unobstructed ── */}
        <div className="hidden lg:block flex-1 relative bg-[#060c18]">
          <iframe
            src="/nomad-compass-hero/"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ border: "none" }}
            title="Nomad Compass hero video"
            aria-hidden="true"
            tabIndex={-1}
          />
          <div
            className="absolute inset-y-0 left-0 w-16 pointer-events-none"
            style={{ background: "linear-gradient(to right, #0B1120, transparent)" }}
          />
        </div>

        {/* Mobile-only: compact video banner */}
        <div className="block lg:hidden w-full h-56 relative bg-[#060c18] order-first">
          <iframe
            src="/nomad-compass-hero/"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ border: "none" }}
            title="Nomad Compass hero video"
            aria-hidden="true"
            tabIndex={-1}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, #0B1120)" }}
          />
        </div>

      </section>

      {/* ── Stats strip ── */}
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
