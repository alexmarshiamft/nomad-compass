import { LocationData } from "./location-data.js";

export interface TaxResult {
  incomeTaxRate: number;
  socialSecurityRate: number;
  annualIncomeTaxUSD: number;
  annualSocialSecurityUSD: number;
  totalAnnualTaxUSD: number;
  effectiveTaxRate: number;
  taxBreakdown: TaxLineItem[];
}

export interface TaxLineItem {
  label: string;
  rate: number;
  annualAmountUSD: number;
  notes?: string;
}

export function calculateTax(
  annualIncomeUSD: number,
  location: LocationData,
  employerCountry: string
): TaxResult {
  let annualIncomeTax = 0;
  let effectiveIncomeTaxRate = 0;
  const breakdown: TaxLineItem[] = [];

  const tax = location.tax;

  if (tax.taxationType === "zero") {
    annualIncomeTax = 0;
    effectiveIncomeTaxRate = 0;
    breakdown.push({
      label: "Income Tax",
      rate: 0,
      annualAmountUSD: 0,
      notes: "No personal income tax in this country",
    });
  } else if (tax.taxationType === "territorial") {
    annualIncomeTax = 0;
    effectiveIncomeTaxRate = 0;
    breakdown.push({
      label: "Income Tax (Foreign-Sourced)",
      rate: 0,
      annualAmountUSD: 0,
      notes: "Territorial taxation: foreign-sourced income is exempt",
    });
  } else if (tax.flatRate !== undefined) {
    annualIncomeTax = annualIncomeUSD * tax.flatRate;
    effectiveIncomeTaxRate = tax.flatRate;
    breakdown.push({
      label: "Income Tax",
      rate: tax.flatRate,
      annualAmountUSD: annualIncomeTax,
      notes: tax.specialRegimes ?? undefined,
    });
  } else if (tax.taxBrackets && tax.taxBrackets.length > 0) {
    let remaining = annualIncomeUSD;
    let totalTax = 0;
    for (const bracket of tax.taxBrackets) {
      const bracketMax = bracket.max ?? Infinity;
      const taxableInBracket = Math.min(remaining, bracketMax - bracket.min);
      if (taxableInBracket <= 0) break;
      const taxInBracket = taxableInBracket * bracket.rate;
      totalTax += taxInBracket;
      remaining -= taxableInBracket;
      if (taxInBracket > 0) {
        breakdown.push({
          label: `Income Tax (${(bracket.rate * 100).toFixed(0)}% bracket)`,
          rate: bracket.rate,
          annualAmountUSD: taxInBracket,
          notes: bracket.max
            ? `On income from $${bracket.min.toLocaleString()} to $${bracket.max.toLocaleString()}`
            : `On income above $${bracket.min.toLocaleString()}`,
        });
      }
      if (remaining <= 0) break;
    }
    annualIncomeTax = totalTax;
    effectiveIncomeTaxRate = annualIncomeUSD > 0 ? totalTax / annualIncomeUSD : 0;
  } else if (tax.taxationType === "remittance") {
    if (tax.flatRate !== undefined) {
      annualIncomeTax = annualIncomeUSD * tax.flatRate;
      effectiveIncomeTaxRate = tax.flatRate;
      breakdown.push({
        label: "Income Tax (LTR Visa Rate)",
        rate: tax.flatRate,
        annualAmountUSD: annualIncomeTax,
        notes: tax.specialRegimes ?? "Special remote worker regime applies",
      });
    } else {
      const assumedRate = 0.17;
      annualIncomeTax = annualIncomeUSD * assumedRate;
      effectiveIncomeTaxRate = assumedRate;
      breakdown.push({
        label: "Income Tax (estimated)",
        rate: assumedRate,
        annualAmountUSD: annualIncomeTax,
        notes: "Estimated at remittance regime rate",
      });
    }
  }

  const annualSocialSecurity = tax.employerPays
    ? 0
    : annualIncomeUSD * tax.socialSecurityRate;

  if (tax.socialSecurityRate > 0 && !tax.employerPays) {
    breakdown.push({
      label: "Social Security / National Insurance",
      rate: tax.socialSecurityRate,
      annualAmountUSD: annualSocialSecurity,
      notes: "Employee contribution",
    });
  } else if (tax.employerPays && tax.socialSecurityRate > 0) {
    breakdown.push({
      label: "Social Security",
      rate: 0,
      annualAmountUSD: 0,
      notes: `Employer pays ${(tax.socialSecurityRate * 100).toFixed(1)}% — not deducted from employee income`,
    });
  }

  const totalAnnualTax = annualIncomeTax + annualSocialSecurity;
  const totalEffectiveRate = annualIncomeUSD > 0 ? totalAnnualTax / annualIncomeUSD : 0;

  return {
    incomeTaxRate: effectiveIncomeTaxRate,
    socialSecurityRate: tax.employerPays ? 0 : tax.socialSecurityRate,
    annualIncomeTaxUSD: annualIncomeTax,
    annualSocialSecurityUSD: annualSocialSecurity,
    totalAnnualTaxUSD: totalAnnualTax,
    effectiveTaxRate: totalEffectiveRate,
    taxBreakdown: breakdown,
  };
}

export function calculateOverallScore(
  location: LocationData,
  taxResult: TaxResult,
  annualIncomeUSD: number,
  employerCountryTzOffset: number
): number {
  const scores: number[] = [];

  const taxScore = Math.max(0, 100 - taxResult.effectiveTaxRate * 200);
  scores.push(taxScore * 0.30);

  const monthlyCOL =
    location.col.monthlyRentUSD +
    location.col.monthlyFoodUSD +
    location.col.monthlyTransportUSD +
    location.col.monthlyUtilitiesUSD +
    location.col.monthlyOtherUSD;
  const monthlyNet = (annualIncomeUSD - taxResult.totalAnnualTaxUSD) / 12;
  const disposable = monthlyNet - monthlyCOL;
  const savingsRatio = monthlyNet > 0 ? Math.max(0, disposable) / monthlyNet : 0;
  scores.push(savingsRatio * 100 * 0.25);

  scores.push(location.qol.qualityOfLifeScore * 0.25);

  const tzDiff = Math.abs(location.qol.timeZoneOffsetHours - employerCountryTzOffset);
  const tzScore = Math.max(0, 100 - tzDiff * 8);
  scores.push(tzScore * 0.10);

  const visaScore = location.visa.hasDigitalNomadVisa ? 100 : 40;
  scores.push(visaScore * 0.10);

  const total = scores.reduce((a, b) => a + b, 0);
  return Math.round(Math.min(100, Math.max(0, total)));
}

export function getTzOffsetForCountry(countryCode: string): number {
  const offsets: Record<string, number> = {
    US: -5, CA: -5, MX: -6, GB: 0, DE: 1, FR: 1, NL: 1, ES: 1,
    PT: 0, IT: 1, SE: 1, NO: 1, DK: 1, FI: 2, PL: 1, AT: 1,
    CH: 1, BE: 1, JP: 9, KR: 9, CN: 8, SG: 8, AU: 10, NZ: 12,
    IN: 5.5, AE: 4, SA: 3, ZA: 2, BR: -3, AR: -3, CL: -4,
    IL: 2, TR: 3, RU: 3, UA: 2, HU: 1, CZ: 1, SK: 1, RO: 2,
    BG: 2, HR: 1, GR: 2, CY: 2, MT: 1, EE: 2, LV: 2, LT: 2,
    PH: 8, MY: 8, ID: 7, TH: 7, VN: 7, GE: 4, MU: 4, BB: -4,
    PA: -5, CR: -6, CO: -5,
  };
  return offsets[countryCode.toUpperCase()] ?? 0;
}
