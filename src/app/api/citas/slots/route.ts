import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/citas/actions";
import { ANY_PROFESSIONAL } from "@/lib/citas/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");
  const professionalId = searchParams.get("professionalId") || ANY_PROFESSIONAL;

  if (!date || !serviceId) {
    return NextResponse.json({ error: "Faltan parámetros (date, serviceId)" }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(date, serviceId, professionalId);
    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json({ error: "Error al calcular disponibilidad" }, { status: 500 });
  }
}
