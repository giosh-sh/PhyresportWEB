import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Nombre, email y mensaje son obligatorios" },
        { status: 400 }
      );
    }

    const { error } = await resend.emails.send({
      from: "Phyresport Web <onboarding@resend.dev>",
      to: ["info@phyresport.com"],
      subject: `Nuevo contacto de ${name}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ""}
        <p><strong>Mensaje:</strong></p>
        <p>${message}</p>
      `,
    });

    if (error) {
      return NextResponse.json({ error: "Error al enviar el email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
