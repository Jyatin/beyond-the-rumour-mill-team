export const CONSENSUS_FORMULA_VERSION = "v1";
export const MIN_INDEPENDENT_REPORTS_THRESHOLD = 5;
export const Z_SCORE_95 = 1.95996398454;

/**
 * Returns credibility weight based on user/alumni verification status:
 * - verified employment: 1.00
 * - verified alumni / other company: 0.80
 * - unverified good-standing: 0.50
 * - new / unverified: 0.30
 */
export function getCredibilityWeight(verificationStatus?: string | null): number {
  if (!verificationStatus) return 0.30;
  const status = verificationStatus.toLowerCase();
  if (status === "official" || status === "verified") return 1.00;
  if (status === "community" || status === "alumni") return 0.80;
  if (status === "review" || status === "pending") return 0.50;
  return 0.30;
}

/**
 * Calculates 12-month exponential half-life recency decay:
 * recency = 0.5 ^ (age_in_months / 12)
 */
export function calculateRecencyWeight(createdAt: Date, referenceDate: Date = new Date()): number {
  const diffMs = Math.max(0, referenceDate.getTime() - createdAt.getTime());
  const ageInMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4375);
  const recency = Math.pow(0.5, ageInMonths / 12);
  return Math.min(1.0, Math.max(0.01, recency));
}

/**
 * Calculates independence correction for correlated clusters:
 * independence = 1 / sqrt(clusterSize)
 */
export function calculateIndependenceCorrection(clusterSize: number = 1): number {
  const k = Math.max(1, clusterSize);
  return 1.0 / Math.sqrt(k);
}

/**
 * Calculates total report weight:
 * weight = credibility * recency * independence
 */
export function calculateReportWeight(params: {
  verificationStatus?: string | null;
  createdAt: Date;
  clusterSize?: number;
  referenceDate?: Date;
}): number {
  const credibility = getCredibilityWeight(params.verificationStatus);
  const recency = calculateRecencyWeight(params.createdAt, params.referenceDate);
  const independence = calculateIndependenceCorrection(params.clusterSize);
  return credibility * recency * independence;
}

/**
 * Computes Kish's Effective Sample Size:
 * n_eff = (sum(w))^2 / sum(w^2)
 */
export function calculateEffectiveSampleSize(weights: number[]): number {
  if (!weights || weights.length === 0) return 0;
  
  let sumW = 0;
  let sumW2 = 0;
  
  for (const w of weights) {
    if (w > 0) {
      sumW += w;
      sumW2 += w * w;
    }
  }

  if (sumW2 <= 0) return 0;
  return (sumW * sumW) / sumW2;
}

/**
 * Computes weighted prevalence:
 * prevalence = sum(w_supporting) / sum(w_eligible)
 */
export function calculateWeightedPrevalence(
  supportingWeights: number[],
  totalEligibleWeights: number[]
): number {
  const sumSupporting = supportingWeights.reduce((acc, w) => acc + (w > 0 ? w : 0), 0);
  const sumTotal = totalEligibleWeights.reduce((acc, w) => acc + (w > 0 ? w : 0), 0);

  if (sumTotal <= 0) return 0;
  const prev = sumSupporting / sumTotal;
  return Math.min(1.0, Math.max(0.0, prev));
}

/**
 * Computes Wilson Score Confidence Interval for weighted prevalence:
 * Handles boundary edge cases gracefully (n=0, p=0, p=1, small n_eff).
 */
export function calculateWilsonInterval(
  prevalence: number,
  effectiveSampleSize: number,
  zScore: number = Z_SCORE_95
): { lower: number; upper: number; center: number; margin: number } {
  const p = Math.min(1.0, Math.max(0.0, Number.isFinite(prevalence) ? prevalence : 0));
  const n = Number.isFinite(effectiveSampleSize) ? effectiveSampleSize : 0;

  if (n <= 0) {
    return { lower: 0, upper: 0, center: 0, margin: 0 };
  }

  const z2 = zScore * zScore;
  const denominator = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denominator;
  
  const varianceTerm = (p * (1 - p)) / n + z2 / (4 * n * n);
  const margin = (zScore / denominator) * Math.sqrt(Math.max(0, varianceTerm));

  const lower = Math.max(0.0, Math.min(1.0, center - margin));
  const upper = Math.max(0.0, Math.min(1.0, center + margin));

  return {
    lower: Math.round(lower * 10000) / 10000,
    upper: Math.round(upper * 10000) / 10000,
    center: Math.round(center * 10000) / 10000,
    margin: Math.round(margin * 10000) / 10000,
  };
}

/**
 * Checks minimum publication threshold (>= 5 independent reports).
 */
export function isPublicationEligible(reportCount: number): boolean {
  return reportCount >= MIN_INDEPENDENT_REPORTS_THRESHOLD;
}

/**
 * Calculates 100-point deterministic Verification Score:
 * Score = 100 * (0.30*Coverage + 0.25*Agreement + 0.20*Credibility + 0.15*Recency + 0.10*EvidenceQuality)
 */
export function calculateVerificationScore(components: {
  coverage: number;
  agreement: number;
  credibility: number;
  recency: number;
  evidenceQuality: number;
}): number {
  const clamp = (val: number) => Math.min(1.0, Math.max(0.0, Number.isFinite(val) ? val : 0));

  const cov = clamp(components.coverage);
  const agr = clamp(components.agreement);
  const crd = clamp(components.credibility);
  const rec = clamp(components.recency);
  const evq = clamp(components.evidenceQuality);

  const rawScore = 100 * (
    0.30 * cov +
    0.25 * agr +
    0.20 * crd +
    0.15 * rec +
    0.10 * evq
  );

  return Math.round(Math.min(100.0, Math.max(0.0, rawScore)) * 10) / 10;
}
