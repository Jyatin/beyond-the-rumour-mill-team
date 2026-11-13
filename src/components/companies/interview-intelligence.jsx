import React from "react";
import { Sparkles, ShieldCheck, HelpCircle, BarChart3, AlertCircle } from "lucide-react";

export function InterviewIntelligence({ consensusData, companyName }) {
  if (!consensusData || !consensusData.snapshot) {
    return (
      <section className="space-y-4 p-6 border rounded-xl bg-card">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="font-editorial text-2xl tracking-tight">Interview Intelligence</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          No consensus intelligence snapshot has been calculated for {companyName} yet. Submitting interview experiences will help build aggregate intelligence.
        </p>
      </section>
    );
  }

  const { snapshot, publishedTopics = [], publishedQuestions = [], insufficientEvidenceItems = [] } = consensusData;

  return (
    <section className="space-y-8 p-6 md:p-8 border border-border rounded-xl bg-card shadow-sm">
      {/* Header & Signal Philosophy */}
      <div className="space-y-3 border-b pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-editorial text-2xl md:text-3xl tracking-tight">Interview Intelligence</h2>
              <p className="text-xs text-muted-foreground">Deterministic evidence consensus for {companyName}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Signal, not truth
          </span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Signals represent frequency patterns in independently verified interview reports, calculated with 95% Wilson confidence intervals. These reflect reported experiences, not hiring guarantees.
        </p>
      </div>

      {/* Verification & Sample Base Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-muted/40 border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Evidence Strength</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{snapshot.verificationScore}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Based on credibility, recency & coverage</p>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Report Base</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{snapshot.totalEligibleExperiences}</span>
            <span className="text-xs text-muted-foreground">independent reports</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Effective sample size: {snapshot.totalWeightedExperiences}</p>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Freshness</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-semibold text-foreground">12-mo Decay</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Weighted by exponential recency</p>
        </div>
      </div>

      {/* Frequent Topics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand" />
          <h3 className="font-semibold text-lg">Frequent Interview Topics</h3>
        </div>

        {publishedTopics.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {publishedTopics.map((topic) => {
              const pct = Math.round(topic.weightedPrevalence * 100);
              const lowPct = Math.round(topic.lowerBound * 100);
              const highPct = Math.round(topic.upperBound * 100);

              return (
                <div key={topic.id} className="p-4 rounded-lg border bg-background space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-sm">{topic.entityLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brand">{pct}%</span>
                      <span className="text-xs text-muted-foreground">
                        95% CI: [{lowPct}%–{highPct}%]
                      </span>
                    </div>
                  </div>

                  {/* Visual prevalence bar */}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand transition-all duration-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                    <span>{topic.reportCount} independent reports</span>
                    <span>Effective n: {topic.effectiveSampleSize}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No topics currently meet the 5-report publication threshold.
          </p>
        )}
      </div>

      {/* Reported Canonical Questions */}
      {publishedQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-brand" />
            <h3 className="font-semibold text-lg">Reported Interview Questions</h3>
          </div>
          <div className="space-y-2">
            {publishedQuestions.map((q) => (
              <div key={q.id} className="p-3.5 rounded-lg border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-sm font-medium">{q.entityLabel}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                    {q.reportCount} reports
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insufficient Evidence Notice */}
      {insufficientEvidenceItems.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-medium text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Emerging Signals (Insufficient Evidence)</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The following items appeared in fewer than 5 independent reports. They are withheld from aggregate consensus until further reports corroborate them:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {insufficientEvidenceItems.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-background border text-xs text-muted-foreground"
              >
                {item.entityLabel}
                <span className="text-[10px] text-amber-600 dark:text-amber-400">({item.reportCount}/5)</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
