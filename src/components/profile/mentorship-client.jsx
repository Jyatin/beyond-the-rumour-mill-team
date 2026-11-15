"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  acceptMentorshipRequestAction, 
  rejectMentorshipRequestAction, 
  cancelMentorshipRequestAction 
} from "@/server/actions/mentorship";
import { 
  createMockSlotAction, 
  cancelMockSlotAction, 
  cancelMockBookingAction 
} from "@/server/actions/mock-interviews";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Plus, 
  User, 
  AlertCircle 
} from "lucide-react";

export function MentorshipManagementClient({
  role,
  myRequests = [],
  mentorRequests = [],
  mySlots = [],
  myBookings = [],
  mentorBookings = [],
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // Slot creation form state (for alumni)
  const [showSlotForm, setShowSlotForm] = React.useState(false);
  const [slotDate, setSlotDate] = React.useState("");
  const [slotStartTime, setSlotStartTime] = React.useState("");
  const [slotEndTime, setSlotEndTime] = React.useState("");
  const [slotNotes, setSlotNotes] = React.useState("");

  const handleAction = async (fn, successMsg) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await fn();
      setSuccess(successMsg);
      router.refresh();
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!slotDate || !slotStartTime || !slotEndTime) {
      setError("Please fill out the date, start time, and end time");
      return;
    }

    const startsAt = new Date(`${slotDate}T${slotStartTime}`);
    const endsAt = new Date(`${slotDate}T${slotEndTime}`);

    await handleAction(
      () => createMockSlotAction({ startsAt, endsAt, notes: slotNotes }),
      "Mock interview availability slot created!"
    );

    setShowSlotForm(false);
    setSlotNotes("");
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* STUDENT VIEW */}
      {role === "student" && (
        <div className="space-y-10">
          {/* Mentorship Requests */}
          <section className="space-y-4">
            <h3 className="font-editorial text-xl font-semibold flex items-center gap-2">
              <User className="size-5 text-[var(--brand)]" />
              My Mentorship Requests
            </h3>
            {myRequests.length === 0 ? (
              <div className="bg-card border rounded-xl p-6 text-muted-foreground text-sm">
                You haven&apos;t sent any mentorship requests yet. Browse the Alumni Directory to connect with placed mentors!
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {myRequests.map((req) => (
                  <div key={req.id} className="bg-card border rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{req.mentorName || "Alumni Mentor"}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono capitalize ${
                          req.status === "accepted" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                          req.status === "pending" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                          req.status === "rejected" ? "bg-rose-500/10 text-rose-600 border border-rose-500/20" :
                          "bg-muted text-muted-foreground border"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      {req.message && (
                        <p className="text-xs text-muted-foreground italic line-clamp-3 bg-muted/40 p-2.5 rounded">
                          &ldquo;{req.message}&rdquo;
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Sent {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {req.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => handleAction(
                          () => cancelMentorshipRequestAction(req.id),
                          "Mentorship request cancelled"
                        )}
                        className="text-xs text-destructive hover:bg-destructive/10 self-start"
                      >
                        Cancel Request
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Mock Interview Bookings */}
          <section className="space-y-4">
            <h3 className="font-editorial text-xl font-semibold flex items-center gap-2">
              <Calendar className="size-5 text-[var(--brand)]" />
              My Mock Interview Bookings
            </h3>
            {myBookings.length === 0 ? (
              <div className="bg-card border rounded-xl p-6 text-muted-foreground text-sm">
                No mock interviews booked yet. Check available alumni slots to schedule a 1-on-1 interview session.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {myBookings.map((b) => (
                  <div key={b.id} className="bg-card border rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">With {b.mentorName || "Alumni"}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono capitalize ${
                          b.status === "confirmed" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                          "bg-muted text-muted-foreground border"
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Clock className="size-3.5" />
                          {new Date(b.startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                        {b.notes && <p className="text-xs italic mt-1 bg-muted/40 p-2 rounded">{b.notes}</p>}
                      </div>
                    </div>

                    {b.status === "confirmed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => handleAction(
                          () => cancelMockBookingAction(b.id),
                          "Booking cancelled successfully"
                        )}
                        className="text-xs text-destructive hover:bg-destructive/10 self-start"
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ALUMNI VIEW */}
      {(role === "alumni" || role === "admin") && (
        <div className="space-y-10">
          {/* Incoming Mentorship Requests */}
          <section className="space-y-4">
            <h3 className="font-editorial text-xl font-semibold flex items-center gap-2">
              <User className="size-5 text-[var(--brand)]" />
              Incoming Mentorship Requests
            </h3>
            {mentorRequests.length === 0 ? (
              <div className="bg-card border rounded-xl p-6 text-muted-foreground text-sm">
                No mentorship requests received yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {mentorRequests.map((req) => (
                  <div key={req.id} className="bg-card border rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{req.studentName || req.studentEmail}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono capitalize ${
                          req.status === "accepted" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                          req.status === "pending" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                          req.status === "rejected" ? "bg-rose-500/10 text-rose-600 border border-rose-500/20" :
                          "bg-muted text-muted-foreground border"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      {req.message && (
                        <p className="text-xs text-muted-foreground italic line-clamp-3 bg-muted/40 p-2.5 rounded">
                          &ldquo;{req.message}&rdquo;
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Received {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {req.status === "pending" && (
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          disabled={loading}
                          onClick={() => handleAction(
                            () => acceptMentorshipRequestAction(req.id),
                            "Mentorship request accepted!"
                          )}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        >
                          <CheckCircle2 className="size-3.5 mr-1" /> Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loading}
                          onClick={() => handleAction(
                            () => rejectMentorshipRequestAction(req.id),
                            "Mentorship request rejected"
                          )}
                          className="text-xs text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="size-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Manage Mock Interview Availability Slots */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-xl font-semibold flex items-center gap-2">
                <Calendar className="size-5 text-[var(--brand)]" />
                Mock Interview Availability Slots
              </h3>
              <Button
                size="sm"
                onClick={() => setShowSlotForm(!showSlotForm)}
                className="text-xs rounded-full gap-1.5"
              >
                <Plus className="size-3.5" />
                {showSlotForm ? "Cancel" : "Add Availability Slot"}
              </Button>
            </div>

            {showSlotForm && (
              <form onSubmit={handleCreateSlot} className="bg-card border rounded-xl p-6 space-y-4 animate-in fade-in duration-200">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">New Mock Interview Slot</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium block mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={slotDate}
                      onChange={(e) => setSlotDate(e.target.value)}
                      className="w-full bg-background border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={slotStartTime}
                      onChange={(e) => setSlotStartTime(e.target.value)}
                      className="w-full bg-background border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={slotEndTime}
                      onChange={(e) => setSlotEndTime(e.target.value)}
                      className="w-full bg-background border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Focus Topics / Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. System Design mock, DSA Round 2 prep"
                    value={slotNotes}
                    onChange={(e) => setSlotNotes(e.target.value)}
                    className="w-full bg-background border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowSlotForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={loading}>
                    Publish Slot
                  </Button>
                </div>
              </form>
            )}

            {mySlots.length === 0 ? (
              <div className="bg-card border rounded-xl p-6 text-muted-foreground text-sm">
                You haven&apos;t created any interview slots yet. Add availability above so students can book mock sessions with you.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                {mySlots.map((slot) => (
                  <div key={slot.id} className="bg-card border rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono capitalize ${
                          slot.status === "available" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                          slot.status === "booked" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" :
                          "bg-muted text-muted-foreground border"
                        }`}>
                          {slot.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono font-medium">
                        {new Date(slot.startsAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} – {new Date(slot.endsAt).toLocaleTimeString([], { timeStyle: 'short' })}
                      </p>
                      {slot.notes && <p className="text-[11px] text-muted-foreground mt-1">{slot.notes}</p>}
                    </div>

                    {slot.status !== "cancelled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => handleAction(
                          () => cancelMockSlotAction(slot.id),
                          "Slot cancelled"
                        )}
                        className="text-xs text-destructive hover:bg-destructive/10 self-start"
                      >
                        Cancel Slot
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Scheduled Mock Bookings with Students */}
          <section className="space-y-4">
            <h3 className="font-editorial text-xl font-semibold flex items-center gap-2">
              <Clock className="size-5 text-[var(--brand)]" />
              Scheduled Student Mock Bookings
            </h3>
            {mentorBookings.length === 0 ? (
              <div className="bg-card border rounded-xl p-6 text-muted-foreground text-sm">
                No mock bookings currently scheduled.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {mentorBookings.map((b) => (
                  <div key={b.id} className="bg-card border rounded-xl p-5 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-sm">{b.studentName || b.studentEmail}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono capitalize ${
                          b.status === "confirmed" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                          "bg-muted text-muted-foreground border"
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">
                        {new Date(b.startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    {b.status === "confirmed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => handleAction(
                          () => cancelMockBookingAction(b.id),
                          "Booking cancelled"
                        )}
                        className="text-xs text-destructive hover:bg-destructive/10 self-start"
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
