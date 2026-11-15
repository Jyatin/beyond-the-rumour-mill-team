"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, Square, Plus, Trash2, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createPreparationItemAction,
  togglePreparationItemAction,
  deletePreparationItemAction,
} from "@/server/actions/preparation";

const CATEGORIES = [
  "DSA",
  "System Design",
  "SQL",
  "JavaScript",
  "Company Research",
  "Projects",
  "Behavioral",
  "Mock Interview",
];

export function PreparationChecklist({
  initialItems = [],
  companyId,
  companyName,
}) {
  const router = useRouter();
  const [addedItems, setAddedItems] = React.useState([]);
  const [deletedIds, setDeletedIds] = React.useState([]);
  const [completedOverrides, setCompletedOverrides] = React.useState({});
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORIES[0]);
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showAddForm, setShowAddForm] = React.useState(false);

  const items = React.useMemo(() => {
    const merged = [
      ...initialItems,
      ...addedItems.filter((a) => !initialItems.some((i) => i.id === a.id)),
    ];
    return merged
      .filter((i) => !deletedIds.includes(i.id))
      .map((i) =>
        Object.prototype.hasOwnProperty.call(completedOverrides, i.id)
          ? { ...i, completedAt: completedOverrides[i.id] }
          : i
      );
  }, [initialItems, addedItems, deletedIds, completedOverrides]);

  const total = items.length;
  const completed = items.filter((i) => i.completedAt).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const availableCategories = React.useMemo(() => {
    const present = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
    const ordered = CATEGORIES.filter((c) => present.includes(c));
    for (const c of present) {
      if (!ordered.includes(c)) ordered.push(c);
    }
    return ["All", ...ordered];
  }, [items]);

  const effectiveCategory = availableCategories.includes(activeCategory)
    ? activeCategory
    : "All";

  const visibleItems =
    effectiveCategory === "All"
      ? items
      : items.filter((i) => i.category === effectiveCategory);

  const handleToggle = async (itemId, currentCompleted) => {
    setError("");
    const hadPrevOverride = Object.prototype.hasOwnProperty.call(
      completedOverrides,
      itemId
    );
    const prevOverride = completedOverrides[itemId];
    const nextCompleted = !currentCompleted;

    setCompletedOverrides((prev) => ({
      ...prev,
      [itemId]: nextCompleted ? new Date() : null,
    }));

    try {
      await togglePreparationItemAction(itemId, nextCompleted);
      router.refresh();
    } catch (err) {
      setCompletedOverrides((prev) => {
        const next = { ...prev };
        if (hadPrevOverride) {
          next[itemId] = prevOverride;
        } else {
          delete next[itemId];
        }
        return next;
      });
      setError(err?.message || "Failed to update task status.");
    }
  };

  const handleDelete = async (itemId) => {
    setError("");
    setDeletedIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));

    try {
      await deletePreparationItemAction(itemId);
      router.refresh();
    } catch (err) {
      setDeletedIds((prev) => prev.filter((id) => id !== itemId));
      setError(err?.message || "Failed to delete preparation task.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    try {
      setLoading(true);
      const res = await createPreparationItemAction({
        companyId: companyId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
      });

      if (res.item) {
        setAddedItems((prev) => [...prev, { ...res.item, companyName }]);
      }
      setTitle("");
      setDescription("");
      setShowAddForm(false);
      router.refresh();
    } catch (err) {
      setError(err?.message || "Failed to create preparation task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-6 space-y-6">
      {/* Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h3 className="font-editorial text-xl font-semibold flex items-center gap-2">
            <BookOpen className="size-5 text-[var(--brand)]" />
            {companyName ? `Preparation Checklist for ${companyName}` : "Interview Preparation Checklist"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track your topics, problem sets, and target company milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-sm font-bold font-mono text-foreground">
              {completed}/{total}
            </span>
            <span className="text-xs text-muted-foreground ml-1 font-mono">
              ({percentage}%)
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-full text-xs gap-1.5"
          >
            <Plus className="size-3.5" />
            {showAddForm ? "Cancel" : "Add Task"}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted/80 rounded-full h-2 overflow-hidden">
        <div
          className="bg-[var(--brand)] h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Category Filter Pills */}
      {availableCategories.length > 2 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {availableCategories.map((cat) => {
            const countForCat =
              cat === "All"
                ? items.length
                : items.filter((i) => i.category === cat).length;
            const active = effectiveCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  active
                    ? "bg-brand text-white border-brand"
                    : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {cat} ({countForCat})
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FFF6F5] border border-[#FECDCA] text-[#B42318] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span>●</span>
            <span>
              {error === "Unauthorized"
                ? "Please sign up or sign in to save preparation tasks to your personal roadmap."
                : error}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {error === "Unauthorized" && (
              <Link
                href="/signup?next=/prepare"
                className="bg-[#1B635C] hover:bg-[#154D48] text-white px-3.5 py-1 rounded-full text-xs font-semibold shadow-xs"
              >
                Sign Up Free →
              </Link>
            )}
            <button
              type="button"
              onClick={() => setError("")}
              className="text-[#63606B] hover:text-[#111111] underline cursor-pointer text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Add Task Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-muted/40 border rounded-lg p-4 space-y-3 animate-in fade-in">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Preparation Task</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="e.g. Master Monotonic Queue problems or LeetCode 200"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-background border rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background border rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <input
              type="text"
              placeholder="Optional notes, problem links, or key formulas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !title.trim()} className="text-xs">
              {loading ? "Saving..." : "Save Task"}
            </Button>
          </div>
        </form>
      )}

      {/* Task List */}
      {visibleItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          {items.length === 0
            ? 'No preparation tasks added yet. Click "Add Task" or generate a drive plan to build your roadmap.'
            : `No tasks found under ${effectiveCategory}.`}
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleItems.map((item) => {
            const isDone = !!item.completedAt;
            return (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-all ${
                  isDone
                    ? "bg-muted/30 border-muted text-muted-foreground"
                    : "bg-background border-border hover:border-primary/40 shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    aria-label={isDone ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`}
                    onClick={() => handleToggle(item.id, isDone)}
                    className="mt-0.5 text-foreground/80 hover:text-primary transition-colors cursor-pointer"
                  >
                    {isDone ? (
                      <CheckSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="size-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-medium leading-tight ${
                          isDone ? "line-through opacity-70" : "text-foreground"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">
                        {item.category}
                      </span>
                      {item.source === "auto_drive" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">
                          <Sparkles className="size-2.5" />
                          Drive Plan
                        </span>
                      )}
                      {item.companyName && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                          @{item.companyName}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  title="Delete task"
                  aria-label={`Delete ${item.title}`}
                  className="text-muted-foreground/60 hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
