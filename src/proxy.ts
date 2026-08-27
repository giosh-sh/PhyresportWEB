import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/__clerk(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/servicios(.*)",
  "/equipo(.*)",
  "/cursos(.*)",
  "/productos(.*)",
  "/contacto(.*)",
  "/shop(.*)",
  "/product(.*)",
  "/cart(.*)",
  "/checkout(.*)",
  "/orders(.*)",
  "/wishlist(.*)",
  "/tienda(.*)",
  "/api/contact(.*)",
  "/api/webhooks(.*)",
  "/api/checkout(.*)",
  "/api/verify-payment(.*)",
  "/api/products(.*)",
  "/api/categories(.*)",
  "/api/public(.*)",
  "/api/discount(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};