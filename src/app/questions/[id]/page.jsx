import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { getQuestionById, getQuestionAsks, getRankedQuestionAnswers } from "@/server/queries/questions";
import { getCompanyById } from "@/server/queries/companies";
import { getCurrentUser } from "@/server/auth-helpers";
import { QuestionThread } from "@/components/questions/question-thread";
import { AnswerComposer } from "@/components/questions/answer-composer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const question = await getQuestionById(resolvedParams.id);
  if (!question) return { title: "Question Not Found" };
  return {
    title: `${question.title} | Beyond the Rumour Mill`,
    description: `Verified alumni answers and candidate context for ${question.title}.`,
  };
}

export default async function QuestionDetailPage({ params }) {
  const resolvedParams = await params;
  const questionId = resolvedParams.id;

  const [question, asks, answers, user] = await Promise.all([
    getQuestionById(questionId),
    getQuestionAsks(questionId),
    getRankedQuestionAnswers(questionId),
    getCurrentUser().catch(() => null),
  ]);

  if (!question) return notFound();

  const company = await getCompanyById(question.companyId);

  return (
    <div className="min-h-screen bg-[var(--background)] py-10 md:py-16">
      <div className="mx-auto max-w-[1020px] px-5 md:px-8 space-y-8">
        {/* Editorial Top Bar / Breadcrumb Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#FFFFFF] dark:bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
          <Link
            href={company ? `/companies/${company.id}` : "/questions"}
            className="inline-flex items-center gap-2 text-[13px] font-mono font-medium text-[var(--ink-muted)] hover:text-[var(--brand)] transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Return to {company ? `${company.name} Dossier` : "Question Index"}</span>
          </Link>

          {company && (
            <Link
              href={`/companies/${company.id}`}
              className="inline-flex items-center gap-2 text-[13px] font-mono text-[var(--brand-bright)] font-semibold hover:underline"
            >
              <Building2 className="size-4" />
              <span>Explore All {company.name} Questions & Dossiers →</span>
            </Link>
          )}
        </div>

        {/* Question Thread & Ranked Answers */}
        <QuestionThread
          question={question}
          asks={asks}
          answers={answers}
          currentUserId={user?.id}
        />

        {/* Answer Composer for Alumni / Users */}
        <div className="pt-4">
          <AnswerComposer
            questionId={question.id}
            questionTitle={question.title}
            companyName={company?.name || "Company"}
          />
        </div>
      </div>
    </div>
  );
}
