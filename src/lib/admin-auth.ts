import { auth, clerkClient } from "@clerk/nextjs/server";

function isEnvAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const raw = process.env.ADMIN_USER_IDS || process.env.ADMIN_USER_ID || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(userId);
}

export async function isAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  if (isEnvAdmin(userId)) return true;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata as { role?: string } | undefined)?.role;
    return role === "admin";
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!(await isAdmin(userId))) throw new Error("Unauthorized");
  return userId!;
}
