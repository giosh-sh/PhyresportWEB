import type { Metadata } from "next";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { getPublicBookingData } from "@/lib/citas/actions";
import { BookingWizard } from "@/components/citas/BookingWizard";

export const metadata: Metadata = {
  title: "Reservar cita",
  description:
    "Reserva tu cita en Phyresport: elige servicio, profesional y hora disponible. Centro de fisioterapia deportiva en Santa Cruz de Tenerife.",
};

export default async function CitasPage() {
  let services: Awaited<ReturnType<typeof getPublicBookingData>>["services"] = [];
  let professionals: Awaited<ReturnType<typeof getPublicBookingData>>["professionals"] = [];
  try {
    const data = await getPublicBookingData();
    services = data.services;
    professionals = data.professionals;
  } catch {
    // BD sin configurar
  }

  return (
    <>
      <HeaderWrapper solid />
      <main>
        <section className="relative bg-navy pt-28 pb-14 lg:pt-36 lg:pb-16">
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <p className="font-stats text-[13px] font-medium tracking-widest uppercase text-teal mb-3">
              Reservas
            </p>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-tight tracking-tight text-white mb-4">
              Reserva tu cita
            </h1>
            <p className="text-lg text-white/70 max-w-xl mx-auto">
              Elige servicio, profesional y el hueco que mejor te venga. Rápido y sin llamadas.
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-4xl px-6">
            {services.length === 0 ? (
              <p className="py-10 text-center text-gray-500">
                La reserva de citas no está disponible en este momento. Escríbenos por WhatsApp y te
                atendemos.
              </p>
            ) : (
              <BookingWizard services={services} professionals={professionals} />
            )}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
