"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  requestWorkEmailVerificationAction,
  verifyWorkEmailOtpAction,
  submitVerificationEvidenceAction,
} from "@/server/actions/verification";

export function VerificationClient({ profile, initialEvidence = [] }) {
  const router = useRouter();
  const [mode, setMode] = useState("otp"); // "otp" | "document"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(
    profile.verifiedStatus === "verified" || profile.verifiedStatus === "official"
      ? "verified"
      : "request"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Proof upload state
  const [proofKind, setProofKind] = useState("offer_screenshot");
  const [selectedFile, setSelectedFile] = useState(null);
  const [referenceUrl, setReferenceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [localEvidence, setLocalEvidence] = useState([]);

  const evidenceList = [
    ...localEvidence.filter((le) => !initialEvidence.some((ie) => ie.id === le.id)),
    ...initialEvidence,
  ];

  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await requestWorkEmailVerificationAction({
        employmentId: profile.id,
        email,
      });
      if (res.success) {
        setStep("verify");
        setCooldown(60);
      }
    } catch (err) {
      setError(err.message || "Failed to request verification");
      if (err.message?.includes("wait 1 minute")) {
        setCooldown(60);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    setError("");

    try {
      const res = await verifyWorkEmailOtpAction({
        employmentId: profile.id,
        otp,
      });
      if (res.success) {
        setStep("verified");
        router.refresh();
      }
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleEvidenceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const formData = new FormData();
      formData.append("employmentId", profile.id);
      formData.append("kind", proofKind);
      if (notes.trim()) formData.append("notes", notes.trim());

      if (proofKind === "linkedin_url") {
        formData.append("referenceUrl", referenceUrl.trim());
      } else if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await submitVerificationEvidenceAction(formData);
      if (res.success && res.evidence) {
        setLocalEvidence((prev) => [
          { ...res.evidence, createdAt: new Date().toISOString() },
          ...prev,
        ]);
        setSelectedFile(null);
        setReferenceUrl("");
        setNotes("");
        setSuccessMsg("Verification proof submitted. Our team will review it shortly.");
        router.refresh();
      }
    } catch (err) {
      setError(err.message || "Failed to submit verification evidence");
    } finally {
      setLoading(false);
    }
  };

  if (step === "verified") {
    return (
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-green-800 dark:text-green-400">Verified Employment</h3>
            <p className="text-sm text-muted-foreground">
              {profile.role} at {profile.company}
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your employment has been verified. A &quot;✓ Verified employment&quot; badge now appears next to your non-anonymous contributions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-1">Verify {profile.company} Employment</h3>
        <p className="text-sm text-muted-foreground">
          Verify instantaneously with your {profile.company} work email or upload an offer letter / ID card / LinkedIn profile for moderator review.
        </p>
      </div>

      {/* Method Switcher */}
      <div className="flex gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => {
            setMode("otp");
            setError("");
            setSuccessMsg("");
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            mode === "otp"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Work Email OTP
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("document");
            setError("");
            setSuccessMsg("");
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            mode === "document"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Upload Proof / LinkedIn
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-sm rounded-md border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-sm rounded-md border border-emerald-200 dark:border-emerald-900/50">
          {successMsg}
        </div>
      )}

      {mode === "otp" && step === "request" && (
        <form onSubmit={handleRequest} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Work Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="e.g. yourname@company.com"
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || cooldown > 0}
            />
            {cooldown > 0 && (
              <p className="text-xs text-muted-foreground mt-1">You can request another code in {cooldown}s.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !email || cooldown > 0}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 disabled:opacity-50"
          >
            {loading ? "Sending..." : cooldown > 0 ? "Wait..." : "Send Verification Code"}
          </button>
        </form>
      )}

      {mode === "otp" && step === "verify" && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg text-sm mb-4">
            <p>
              We sent a 6-digit verification code to <strong>{email}</strong>.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              It may take a minute to arrive. This code expires in 15 minutes.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-medium">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              required
              maxLength={6}
              placeholder="123456"
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm tracking-[0.5em] font-mono text-center"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              disabled={loading}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={handleRequest}
              disabled={loading || cooldown > 0}
              className="text-sm text-brand hover:underline disabled:opacity-50"
            >
              Resend code {cooldown > 0 ? `(${cooldown}s)` : ""}
            </button>
          </div>
        </form>
      )}

      {mode === "document" && (
        <form onSubmit={handleEvidenceSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Proof Type</label>
            <select
              value={proofKind}
              onChange={(e) => setProofKind(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="offer_screenshot">Offer Letter / Company ID (PDF, PNG, JPG, WebP)</option>
              <option value="linkedin_url">Public LinkedIn Profile Link</option>
              <option value="other">Other Employment Proof (PDF/Image)</option>
            </select>
          </div>

          {proofKind === "linkedin_url" ? (
            <div className="space-y-2">
              <label htmlFor="linkedinUrl" className="text-sm font-medium">
                LinkedIn URL
              </label>
              <input
                id="linkedinUrl"
                type="url"
                required
                placeholder="https://www.linkedin.com/in/your-profile"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="evidenceFile" className="text-sm font-medium">
                Upload Document (Max 5 MB — PDF, PNG, JPG, or WebP)
              </label>
              <input
                id="evidenceFile"
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-xs file:font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                You may redact confidential compensation numbers before uploading.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="evidenceNotes" className="text-sm font-medium">
              Optional Note for Reviewer
            </label>
            <input
              id="evidenceNotes"
              type="text"
              maxLength={300}
              placeholder="e.g. Joined 2025 SDE team, personal info redacted"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || (proofKind === "linkedin_url" ? !referenceUrl : !selectedFile)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Submit for Verification"}
          </button>
        </form>
      )}

      {evidenceList.length > 0 && (
        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            Submitted Evidence ({evidenceList.length})
          </p>
          <div className="space-y-2">
            {evidenceList.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-muted/40 border border-border text-xs"
              >
                <div>
                  <span className="font-medium text-foreground capitalize">
                    {item.kind.replace(/_/g, " ")}
                  </span>
                  {item.fileName && <span className="text-muted-foreground ml-2">({item.fileName})</span>}
                  {item.referenceUrl && (
                    <a
                      href={item.referenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline ml-2"
                    >
                      View Link
                    </a>
                  )}
                  {item.reviewNotes && (
                    <p className="text-muted-foreground mt-0.5">Reviewer note: {item.reviewNotes}</p>
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                    item.status === "accepted"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : item.status === "rejected"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
