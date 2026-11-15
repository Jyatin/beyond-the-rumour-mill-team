"use server";

import { z } from "zod";
import { createProfile, updateProfile, upsertMyProfile } from "../queries/profiles";
import { requireUser } from "../auth-helpers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function onboardUserAction(formData: FormData) {
  const displayName = formData.get("display_name") as string;
  const headline = formData.get("headline") as string;
  const bio = formData.get("bio") as string;
  const college = formData.get("college") as string;
  const gradYear = parseInt(formData.get("grad_year") as string, 10);
  const avatarUrl = formData.get("avatar_url") as string | null;
  const openToMentoring = formData.get("open_to_mentoring") === "true";
  const visibility = (formData.get("visibility") as string) || "public";
  
  const role = formData.get("role") as string;

  if (!displayName || !headline || !bio || !college || !gradYear) {
    throw new Error("Missing required fields");
  }

  if (role !== "student" && role !== "alumni") {
    throw new Error("Invalid role selection");
  }

  await createProfile({
    displayName,
    headline,
    bio,
    college,
    gradYear,
    avatarUrl,
    openToMentoring,
    visibility,
  }, role);

  revalidatePath("/");
  redirect("/connect");
}

export async function updateProfileAction(formData: FormData) {
  const displayName = formData.get("display_name") as string;
  const headline = formData.get("headline") as string;
  const bio = formData.get("bio") as string;
  const college = formData.get("college") as string;
  const gradYear = parseInt(formData.get("grad_year") as string, 10);
  const avatarUrl = formData.get("avatar_url") as string | null;
  const openToMentoring = formData.get("open_to_mentoring") === "true";
  const visibility = (formData.get("visibility") as string) || "public";

  await updateProfile({
    displayName,
    headline,
    bio,
    college,
    gradYear,
    avatarUrl,
    openToMentoring,
    visibility,
  });

  revalidatePath("/profile");
}

const upsertProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters").max(80),
  headline: z.string().trim().min(2, "Headline is required").max(160),
  bio: z.string().trim().min(5, "Bio must be at least 5 characters").max(1000),
  college: z.string().trim().min(2, "College or university is required").max(160),
  gradYear: z.coerce.number().int().min(1990, "Invalid graduation year").max(2035, "Invalid graduation year"),
  openToMentoring: z.boolean().optional().default(false),
  visibility: z.enum(["public", "private"]).default("public"),
});

export async function upsertMyProfileAction(input: {
  displayName: string;
  headline: string;
  bio: string;
  college: string;
  gradYear: number | string;
  openToMentoring?: boolean;
  visibility?: "public" | "private";
}) {
  const currentUser = await requireUser();
  const parsed = upsertProfileSchema.parse(input);

  const canMentor = currentUser.role === "alumni" || currentUser.role === "admin";
  const saved = await upsertMyProfile({
    displayName: parsed.displayName,
    headline: parsed.headline,
    bio: parsed.bio,
    college: parsed.college,
    gradYear: parsed.gradYear,
    avatarUrl: null,
    openToMentoring: canMentor ? parsed.openToMentoring : false,
    visibility: parsed.visibility,
  });

  revalidatePath("/profile");
  revalidatePath("/alumni");
  return { success: true, profile: saved };
}
