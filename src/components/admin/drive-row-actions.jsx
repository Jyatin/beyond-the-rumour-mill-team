"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updatePlacementDriveAction,
  deletePlacementDriveAction,
} from "@/server/actions/placement";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Check, X } from "lucide-react";

const STATUS_OPTIONS = ["Upcoming", "Open", "Ongoing", "Completed", "Cancelled"];

export function DriveRowActions({ driveId, currentStatus }) {
  const router = useRouter();
  const [status, setStatus] = React.useState(currentStatus || "Upcoming");
  const [updatingStatus, setUpdatingStatus] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value;
    const prev = status;
    setStatus(nextStatus);
    setError("");
    setUpdatingStatus(true);
    try {
      await updatePlacementDriveAction(driveId, { status: nextStatus });
      router.refresh();
    } catch (err) {
      setStatus(prev);
      setError(err?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    setDeleting(true);
    try {
      await deletePlacementDriveAction(driveId);
      setConfirmDelete(false);
      router.refresh();
    } catch (err) {
      setError(err?.message || "Failed to delete drive");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Drive status"
          value={status}
          disabled={updatingStatus || deleting}
          onChange={handleStatusChange}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-60"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <Link href={`/admin/drives/${driveId}/edit`}>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
        </Link>

        {!confirmDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setConfirmDelete(true);
              setError("");
            }}
            disabled={deleting}
            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        ) : (
          <div className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1">
            <span className="text-[11px] font-medium text-destructive mr-1">Confirm?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              title="Confirm delete"
              className="p-0.5 rounded text-destructive hover:bg-destructive/20 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              title="Cancel delete"
              className="p-0.5 rounded text-muted-foreground hover:bg-muted cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

