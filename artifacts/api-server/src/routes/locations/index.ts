import { Router, type IRouter } from "express";
import {
  ListLocationsResponse,
  CompareLocationsBody,
  CompareLocationsResponse,
  GetRecommendationsBody,
  GetRecommendationsResponse,
  GetTaxAnalysisBody,
  GetTaxAnalysisResponse,
  GetLocationStatsResponse,
} from "@workspace/api-zod";
import {
  LOCATIONS,
  getLocationById,
  getLocationStats,
  getRelocationInfo,
} from "../../lib/location-data.js";
import {
  calculateTax,
  calculateOverallScore,
  getTzOffsetForCountry,
} from "../../lib/tax-engine.js";
import {
  generateRecommendationsSummary,
  generateTaxAnalysis,
} from "../../lib/gemini-client.js";
import { type LocationData } from "../../lib/location-data.js";

const router: IRouter = Router();

function buildLocationComparison(
  location: LocationData,
  annualIncomeUSD: number,
  employerCountry: string
) {
  const taxResult = calculateTax(annualIncomeUSD, location, employerCountry);
  const employerTzOffset = getTzOffsetForCountry(employerCountry);
  const overallScore = calculateOverallScore(
    location,
    taxResult,
    annualIncomeUSD,
    employerTzOffset
  );

  const monthlyNetIncomeUSD = (annualIncomeUSD - taxResult.totalAnnualTaxUSD) / 12;
  const monthlyCOL =
    location.col.monthlyRentUSD +
    location.col.monthlyFoodUSD +
    location.col.monthlyTransportUSD +
    location.col.monthlyUtilitiesUSD +
    location.col.monthlyOtherUSD;
  const monthlyDisposableIncomeUSD = monthlyNetIncomeUSD - monthlyCOL;

  const tzDiff = Math.abs(
    location.qol.timeZoneOffsetHours - employerTzOffset
  );
  const tzCompatScore = Math.max(0, 100 - tzDiff * 8);

  return {
    locationId: location.id,
    city: location.city,
    country: location.country,
    countryCode: location.countryCode,
    emoji: location.emoji,
    overallScore,
    effectiveTaxRate: taxResult.effectiveTaxRate,
    annualTaxUSD: taxResult.totalAnnualTaxUSD,
    monthlyNetIncomeUSD,
    monthlyCostOfLivingUSD: monthlyCOL,
    monthlyDisposableIncomeUSD,
    taxDetails: {
      incomeTaxRate: taxResult.incomeTaxRate,
      socialSecurityRate: taxResult.socialSecurityRate,
      hasTaxTreaty: location.tax.hasTaxTreaty.includes(
        employerCountry.toUpperCase()
      ),
      taxTreatyCountries: location.tax.hasTaxTreaty,
      taxResidencyNotes: location.tax.taxResidencyNotes,
      remoteWorkerTaxRegime: location.tax.remoteWorkerRegime,
      annualIncomeTaxUSD: taxResult.annualIncomeTaxUSD,
      annualSocialSecurityUSD: taxResult.annualSocialSecurityUSD,
    },
    livingDetails: {
      monthlyRentUSD: location.col.monthlyRentUSD,
      monthlyFoodUSD: location.col.monthlyFoodUSD,
      monthlyTransportUSD: location.col.monthlyTransportUSD,
      monthlyUtilitiesUSD: location.col.monthlyUtilitiesUSD,
      monthlyOtherUSD: location.col.monthlyOtherUSD,
      colIndex: location.col.colIndex,
      internetSpeedMbps: location.col.internetSpeedMbps,
      coworkingDayPassUSD: location.col.coworkingDayPassUSD,
    },
    qualityOfLife: {
      score: location.qol.qualityOfLifeScore,
      safetyIndex: location.qol.safetyIndex,
      healthcareIndex: location.qol.healthcareIndex,
      climateScore: location.qol.climateScore,
      englishFriendly: location.qol.englishFriendly,
      timeZone: location.qol.timeZone,
      timeZoneOffsetHours: location.qol.timeZoneOffsetHours,
      timeZoneCompatibilityScore: tzCompatScore,
    },
    visaInfo: {
      hasDigitalNomadVisa: location.visa.hasDigitalNomadVisa,
      visaName: location.visa.visaName,
      visaRequirements: location.visa.visaRequirements,
      maxStayDays: location.visa.maxStayDays,
      visaFeeUSD: location.visa.visaFeeUSD,
      citizenshipPathYears: location.visa.citizenshipPathYears,
    },
    relocationInfo: getRelocationInfo(location.id),
    pros: location.pros,
    cons: location.cons,
  };
}

router.get("/locations", async (_req, res): Promise<void> => {
  const locations = LOCATIONS.map((l) => ({
    id: l.id,
    city: l.city,
    country: l.country,
    countryCode: l.countryCode,
    emoji: l.emoji,
    region: l.region,
    tags: l.tags,
  }));

  res.json(ListLocationsResponse.parse({ locations }));
});

router.get("/locations/stats", async (_req, res): Promise<void> => {
  const stats = getLocationStats();
  res.json(GetLocationStatsResponse.parse(stats));
});

router.post("/locations/compare", async (req, res): Promise<void> => {
  const parsed = CompareLocationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { annualIncomeUSD, employerCountry, locationIds } = parsed.data;

  let targetLocations = LOCATIONS;
  if (locationIds && locationIds.length > 0) {
    targetLocations = locationIds
      .map((id) => getLocationById(id))
      .filter((l): l is LocationData => l !== undefined);
    if (targetLocations.length === 0) {
      res.status(404).json({ error: "No valid locations found for the given IDs" });
      return;
    }
  }

  const comparisons = targetLocations
    .map((loc) => buildLocationComparison(loc, annualIncomeUSD, employerCountry))
    .sort((a, b) => b.overallScore - a.overallScore);

  res.json(
    CompareLocationsResponse.parse({
      comparisons,
      employerCountry,
      annualIncomeUSD,
    })
  );
});

router.post("/locations/recommendations", async (req, res): Promise<void> => {
  const parsed = GetRecommendationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { annualIncomeUSD, employerCountry, priorities = [], workSchedule, teamTimezone } = parsed.data;

  let filtered = [...LOCATIONS];

  if (priorities.includes("digital-nomad-visa")) {
    filtered = filtered.filter((l) => l.visa.hasDigitalNomadVisa);
  }
  if (priorities.includes("english-friendly")) {
    filtered = filtered.filter((l) => l.qol.englishFriendly);
  }
  if (priorities.includes("warm-climate")) {
    filtered = filtered.filter((l) => l.qol.climateScore >= 70);
  }
  if (priorities.includes("low-cost")) {
    filtered = filtered.filter((l) => {
      const total = l.col.monthlyRentUSD + l.col.monthlyFoodUSD + l.col.monthlyTransportUSD;
      return total < 1500;
    });
  }
  if (priorities.includes("good-healthcare")) {
    filtered = filtered.filter((l) => l.qol.healthcareIndex >= 70);
  }

  if (filtered.length < 5) {
    filtered = [...LOCATIONS];
  }

  const comparisons = filtered
    .map((loc) => buildLocationComparison(loc, annualIncomeUSD, employerCountry))
    .sort((a, b) => {
      let scoreA = a.overallScore;
      let scoreB = b.overallScore;
      if (priorities.includes("low-tax")) {
        scoreA += (1 - a.effectiveTaxRate) * 30;
        scoreB += (1 - b.effectiveTaxRate) * 30;
      }
      return scoreB - scoreA;
    })
    .slice(0, 6);

  const { aiSummary, keyInsights } = await generateRecommendationsSummary({
    annualIncomeUSD,
    employerCountry,
    topLocations: comparisons.slice(0, 4).map((c) => ({
      city: c.city,
      country: c.country,
      effectiveTaxRate: c.effectiveTaxRate,
      monthlyDisposableIncomeUSD: c.monthlyDisposableIncomeUSD,
      overallScore: c.overallScore,
      pros: c.pros,
      cons: c.cons,
    })),
    priorities,
    workSchedule,
    teamTimezone,
  });

  res.json(
    GetRecommendationsResponse.parse({
      topPicks: comparisons,
      aiSummary,
      keyInsights,
    })
  );
});

router.post("/locations/tax-analysis", async (req, res): Promise<void> => {
  const parsed = GetTaxAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    locationId,
    annualIncomeUSD,
    employerCountry,
    incomeType = "employment",
  } = parsed.data;

  const location = getLocationById(locationId);
  if (!location) {
    res.status(404).json({ error: "Location not found" });
    return;
  }

  const taxResult = calculateTax(annualIncomeUSD, location, employerCountry);
  const monthlyNetUSD = (annualIncomeUSD - taxResult.totalAnnualTaxUSD) / 12;

  const hasTaxTreaty = location.tax.hasTaxTreaty.includes(
    employerCountry.toUpperCase()
  );

  const { aiAnalysis, optimizationTips, warnings } = await generateTaxAnalysis({
    city: location.city,
    country: location.country,
    annualIncomeUSD,
    employerCountry,
    effectiveTaxRate: taxResult.effectiveTaxRate,
    annualTaxUSD: taxResult.totalAnnualTaxUSD,
    taxNotes: location.tax.taxResidencyNotes,
    specialRegimes: location.tax.remoteWorkerRegime,
    hasTaxTreaty,
    incomeType,
  });

  const taxBreakdown = taxResult.taxBreakdown.map((item) => ({
    label: item.label,
    rate: item.rate,
    annualAmountUSD: item.annualAmountUSD,
    notes: item.notes,
  }));

  res.json(
    GetTaxAnalysisResponse.parse({
      locationId,
      city: location.city,
      country: location.country,
      annualIncomeUSD,
      effectiveTaxRate: taxResult.effectiveTaxRate,
      annualTaxUSD: taxResult.totalAnnualTaxUSD,
      monthlyNetUSD,
      taxBreakdown,
      aiAnalysis,
      optimizationTips,
      warnings,
      relocationInfo: getRelocationInfo(locationId),
    })
  );
});

export default router;
