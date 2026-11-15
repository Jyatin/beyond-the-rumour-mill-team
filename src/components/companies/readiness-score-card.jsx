"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";

export function ReadinessScoreCard({ readiness, companyName }) {
  if (!readiness) return null;

  const { score, badge, color, summary, breakdown, criticalGaps, strengths } = readiness;

  return (
    <div className="p-6 rounded-xl border border-border bg-card space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Interview Readiness Index
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${color}`}>
              {badge}
            </span>
          </div>
          <h3 className="font-editorial text-xl sm:text-2xl font-bold text-foreground mt-1">
            {companyName ? `${companyName} Interview Readiness` : "Overall Placement Readiness"}
          </h3>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="font-editorial text-4xl sm:text-5xl font-bold text-foreground">
            {score}
          </span>
          <span className="text-sm font-mono text-muted-foreground">/ 100</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {summary}
      </p>

      {/* Progress Bars Breakdown */}
      <div className="space-y-3 pt-1">
        <div>
          <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
            <span>Core Skills Match (Weight: 35%)</span>
            <span className="font-bold text-foreground">{breakdown.skillCoveragePct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500"
              style={{ width: `${breakdown.skillCoveragePct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
            <span>Historical Round Topics (Weight: 30%)</span>
            <span className="font-bold text-foreground">{breakdown.topicCoveragePct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.topicCoveragePct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
            <span>Mock Interview Rehearsal (Weight: 20%)</span>
            <span className="font-bold text-foreground">{breakdown.mockRehearsalPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.mockRehearsalPct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
            <span>Behavioral & Company Research (Weight: 15%)</span>
            <span className="font-bold text-foreground">{breakdown.behavioralPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.behavioralPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gaps & Strengths */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
        {criticalGaps.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-mono uppercase font-semibold text-rose-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Focus Areas (Action Items)
            </span>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              {criticalGaps.map((gap, idx) => (
                <li key={idx}>{gap}</li>
              ))}
            </ul>
          </div>
        )}

        {strengths.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-mono uppercase font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Verified Strengths
            </span>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              {strengths.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
