"use client";

import * as React from "react";
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Lock, 
  Globe2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadCvAction, toggleCvSharingAction, deleteCvAction } from "@/server/actions/cv";

export function CvManagementClient({ initialCv }) {
  const [cv, setCv] = React.useState(initialCv);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isToggling, setIsToggling] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const fileInputRef = React.useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setError("Please select a valid PDF file (.pdf)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit. Please choose a smaller document.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      const res = await uploadCvAction(formData);
      if (res.success) {
        setCv(res.cv);
        setSuccess(`Successfully uploaded "${res.cv.fileName}". By default, your CV is private.`);
      }
    } catch (err) {
      setError(err.message || "Failed to upload CV. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleToggleSharing = async () => {
    if (!cv) return;
    setError("");
    setSuccess("");
    const nextState = !cv.isShared;

    try {
      setIsToggling(true);
      const res = await toggleCvSharingAction(nextState);
      if (res.success) {
        setCv(prev => prev ? { ...prev, isShared: nextState } : null);
        setSuccess(
          nextState 
            ? "CV sharing enabled. Students can now view your CV on your profile."
            : "CV sharing disabled. Your CV is now private and inaccessible to students."
        );
      }
    } catch (err) {
      setError(err.message || "Failed to update sharing preference.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    setSuccess("");

    try {
      setIsDeleting(true);
      const res = await deleteCvAction();
      if (res.success) {
        setCv(null);
        setConfirmingDelete(false);
        setSuccess("CV removed successfully.");
      }
    } catch (err) {
      setError(err.message || "Failed to delete CV.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h3 className="font-editorial text-2xl tracking-tight flex items-center gap-2.5">
            <span>Alumni Resume & CV</span>
            {cv ? (
              cv.isShared ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold">
                  <Globe2 className="size-3" /> Shared with Students
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold">
                  <Lock className="size-3" /> Private (Default)
                </span>
              )
            ) : null}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Manage your verified CV document. You control whether students can view and download your CV for mentorship.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="alumni-cv-upload-input"
        />

        <div>
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-full gap-2 text-xs font-medium"
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="size-4" />
                {cv ? "Replace CV (.PDF)" : "Upload CV (.PDF)"}
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {cv ? (
        <div className="space-y-6">
          {/* Active File Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 border rounded-lg gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center shrink-0">
                <FileText className="size-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground truncate max-w-[280px] sm:max-w-md">
                  {cv.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(cv.fileSize)} • PDF Document
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <a
                href={`/api/cv/${cv.userId || "me"}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border bg-background hover:bg-muted transition-colors text-foreground"
              >
                <ExternalLink className="size-3.5" /> Preview
              </a>
              {confirmingDelete ? (
                <div className="inline-flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-7 px-2.5 text-xs"
                  >
                    {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : "Confirm Delete"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={isDeleting}
                    className="h-7 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={isDeleting}
                  className="text-destructive hover:bg-destructive/10 px-2.5 py-1.5 h-auto rounded-md"
                  aria-label="Delete CV"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Privacy & Student Access Toggle */}
          <div className="border rounded-lg p-4 bg-background/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                {cv.isShared ? <Globe2 className="size-4 text-emerald-600" /> : <Lock className="size-4 text-muted-foreground" />}
                Student CV Sharing Permission
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                {cv.isShared 
                  ? "Active students can view your verified CV when browsing your mentor profile or reviewing non-anonymous experiences."
                  : "Your CV is strictly private. Only you can view or download it until you choose to share."}
              </p>
            </div>

            <Button
              type="button"
              variant={cv.isShared ? "default" : "outline"}
              size="sm"
              onClick={handleToggleSharing}
              disabled={isToggling}
              className={`rounded-full px-4 text-xs font-medium shrink-0 ${
                cv.isShared ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
              }`}
            >
              {isToggling ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : cv.isShared ? (
                "Sharing Enabled"
              ) : (
                "Enable Sharing"
              )}
            </Button>
          </div>

          <div className="text-[11px] text-muted-foreground bg-muted/20 p-3 rounded border leading-relaxed">
            🔒 <strong>Strict Privacy Boundary:</strong> Anonymously shared interview experiences NEVER reveal or link to your CV, regardless of this setting.
          </div>
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg p-6 space-y-3 bg-muted/10">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <FileText className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No CV uploaded yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Upload your verified CV (PDF, max 5MB) to share your placement milestones with junior candidates when mentoring.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-full text-xs font-medium mt-2"
          >
            <UploadCloud className="size-4 mr-1.5" /> Select PDF Document
          </Button>
        </div>
      )}
    </div>
  );
}
