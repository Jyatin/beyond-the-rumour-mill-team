import Link from "next/link";
import { Sparkles, CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GiveToGetBanner({ contributionStatus, submittedCount = 0 }) {
  if (contributionStatus === "exempt") {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-sm">Administrator Access</p>
            <p className="text-xs text-muted-foreground">You have unrestricted access to all placement intelligence and moderation tools.</p>
          </div>
        </div>
      </div>
    );
  }

  if (contributionStatus === "contributed") {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-foreground">Community Contributor Unlocked</p>
              <span className="text-[10.5px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                {submittedCount} {submittedCount === 1 ? "Report" : "Reports"} Submitted
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Thank you for passing your interview knowledge forward. You have full access to community dossiers and round breakdowns.
            </p>
          </div>
        </div>
        <Link href="/experiences/new">
          <Button variant="outline" size="sm" className="text-xs rounded-full border-emerald-500/30 hover:bg-emerald-500/10">
            Share Another Experience
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <Sparkles className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm text-foreground">Give-to-Get Community Access</p>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
            Contribute one interview experience to unlock deeper community intelligence, detailed round notes, and verified candidate feedback.
          </p>
        </div>
      </div>
      <Link href="/experiences/new">
        <Button size="sm" className="bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-white text-xs rounded-full gap-1.5 px-4">
          Share Your Experience <ArrowRight className="size-3.5" />
        </Button>
      </Link>
    </div>
  );
}
