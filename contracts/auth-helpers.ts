import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth";

export async function getCurrentSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user || null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(role: string) {
  const user = await requireUser();
  if (user.role !== role && user.role !== "admin") { // Optional: admin can bypass
    throw new Error(`Forbidden: requires role ${role}`);
  }
  return user;
}

export async function requireAdmin() {
  return requireRole("admin");
}

export async function requireTpoOrAdmin() {
  const user = await requireUser();
  if (user.role !== "tpo" && user.role !== "admin") {
    throw new Error("Forbidden: requires TPO coordinator or Admin privileges");
  }
  return user;
}
