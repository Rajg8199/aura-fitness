import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile } from "@/server/queries";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata = { title: "Get started" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const profile = await getProfile(session.user.id);
  if (profile?.onboardingComplete) redirect("/dashboard");

  return (
    <div className="relative min-h-dvh">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-60" />
      <OnboardingWizard name={session.user.name ?? "there"} />
    </div>
  );
}
