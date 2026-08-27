import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ice px-6">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: "bg-teal hover:bg-cyan",
            footerActionLink: "text-teal hover:text-cyan",
          },
        }}
      />
    </div>
  );
}
