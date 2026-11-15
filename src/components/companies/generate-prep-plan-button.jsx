"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { generatePreparationPlanAction } from "@/server/actions/prep-generator";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, ArrowRight } from "lucide-react";

export function GeneratePrepPlanButton({ companyId, companyName, driveId, hasTasks = false }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setResult(null);
      setError("");
      const res = await generatePreparationPlanAction({ companyId, driveId });
      setResult(res);
      router.refresh();
    } catch (err) {
      setError(err?.message || "Failed to generate preparation plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl border border-brand/20 bg-brand/5 dark:bg-brand/10 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" />
            <span className="font-semibold text-sm text-foreground">
              Personalized {companyName} Prep Plan
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-generate tasks from this drive&apos;s required skills and historical interview questions.
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          size="sm"
          className="bg-brand hover:bg-brand/90 text-white font-medium text-xs px-4 rounded-full gap-2 shrink-0 shadow-xs"
        >
          {loading ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              Generating Tasks...
            </>
          ) : result ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Plan Generated ({result.tasksAdded} added)
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              {hasTasks ? "Refresh / Sync Prep Plan" : "Generate Prep Plan from this Drive"}
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="pt-2 border-t border-destructive/20 text-xs text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="pt-2 border-t border-brand/20 flex items-center justify-between text-xs text-brand font-medium">
          <span>✓ Added {result.tasksAdded} new preparation tasks to your checklist.</span>
          <a href="/prepare" className="inline-flex items-center gap-1 hover:underline">
            View in Prep Hub <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
