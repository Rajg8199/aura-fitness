import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCoachLive } from "@/lib/coach";
import { ChatInterface } from "@/components/coach/chat-interface";

export const metadata = { title: "AI Coach" };

export default async function CoachPage() {
  const session = await auth();
  const userId = session!.user.id;

  const convo = await prisma.coachConversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="flex flex-col">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">AI Coach</h1>
        <p className="text-sm text-muted-foreground">Your personal trainer & nutritionist, on call 24/7.</p>
      </div>
      <ChatInterface
        userName={session!.user.name ?? "Athlete"}
        live={isCoachLive()}
        initialConversationId={convo?.id}
        initialMessages={
          convo?.messages.map((m) => ({
            id: m.id,
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })) ?? []
        }
      />
    </div>
  );
}
