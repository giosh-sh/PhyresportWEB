import { auth, clerkClient } from "@clerk/nextjs/server";

export type StaffRole = "admin" | "fisio";

function envList(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isEnvAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const raw = process.env.ADMIN_USER_IDS || process.env.ADMIN_USER_ID || "";
  return envList(raw).includes(userId);
}

function isEnvFisio(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const raw = process.env.FISIO_USER_IDS || process.env.FISIO_USER_ID || "";
  return envList(raw).includes(userId);
}

export async function getUserRole(
  userId: string | null | undefined
): Promise<StaffRole | null> {
  if (!userId) return null;
  if (isEnvAdmin(userId)) return "admin";
  if (isEnvFisio(userId)) return "fisio";
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata as { role?: string } | undefined)?.role;
    if (role === "admin" || role === "fisio") return role;
    return null;
  } catch {
    return null;
  }
}

export async function isAdmin(userId: string | null | undefined): Promise<boolean> {
  return (await getUserRole(userId)) === "admin";
}

/** Admin o fisioterapeuta: acceso a /gestioncitas y a la gestión de citas. */
export async function isStaff(userId: string | null | undefined): Promise<boolean> {
  return (await getUserRole(userId)) !== null;
}

export async function requireAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!(await isAdmin(userId))) throw new Error("Unauthorized");
  return userId!;
}

export async function requireStaff(): Promise<string> {
  const { userId } = await auth();
  if (!(await isStaff(userId))) throw new Error("Unauthorized");
  return userId!;
}
