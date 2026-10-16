import type { Metadata } from "next";
import { CitasDashboard } from "@/components/citas/CitasDashboard";
import { getBookingServices, getCurrentProfessional, getProfessionals } from "@/lib/citas/actions";

export const metadata: Metadata = {
  title: "Gestión de citas",
  description: "Panel interno de agenda y disponibilidad de Phyresport.",
};

export default async function GestionCitasPage() {
  const [professionals, services, current] = await Promise.all([
    getProfessionals(true),
    getBookingServices(true),
    getCurrentProfessional(),
  ]);

  return (
    <CitasDashboard
      professionals={professionals}
      services={services}
      currentProfessionalId={current?.id ?? null}
    />
  );
}
