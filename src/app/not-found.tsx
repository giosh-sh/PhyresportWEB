import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ice px-6 text-center">
      <p className="font-stats text-8xl font-bold text-teal mb-4">404</p>
      <h1 className="font-display text-2xl font-bold text-navy mb-3">
        Página no encontrada
      </h1>
      <p className="text-gray-500 mb-8 max-w-md">
        La página que buscas no existe o ha sido movida. Vuelve al inicio para encontrar lo que
        necesitas.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-teal text-white font-display font-semibold rounded-full hover:bg-cyan transition-all"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
