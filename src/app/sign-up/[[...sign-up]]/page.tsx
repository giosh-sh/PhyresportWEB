import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ice px-6">
      <SignUp
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
