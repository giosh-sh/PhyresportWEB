import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { CitasDashboard } from "@/components/citas/CitasDashboard";
import { getUserRole } from "@/lib/admin-auth";
import { getBookingServices, getCurrentProfessional, getProfessionals } from "@/lib/citas/actions";

export const metadata: Metadata = {
  title: "Gestión de citas",
  description: "Panel interno de agenda y disponibilidad de Phyresport.",
};

export default async function GestionCitasPage() {
  const { userId } = await auth();
  const [professionals, services, current, role] = await Promise.all([
    getProfessionals(true),
    getBookingServices(true),
    getCurrentProfessional(),
    getUserRole(userId),
  ]);

  return (
    <CitasDashboard
      professionals={professionals}
      services={services}
      currentProfessionalId={current?.id ?? null}
      isAdmin={role === "admin"}
    />
  );
}
