import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserWithProfile } from "@/server/queries";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { MobileNav } from "@/components/shared/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await getUserWithProfile(session.user.id);
  if (!user) redirect("/sign-in");
  if (!user.profile?.onboardingComplete) redirect("/onboarding");

  return (
    <div className="min-h-dvh">
      <Sidebar xp={user.profile.xp} />
      <div className="lg:pl-64">
        <Topbar
          name={user.name ?? "Athlete"}
          email={user.email}
          image={user.image}
          streak={user.profile.currentStreak}
        />
        <main className="container max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
