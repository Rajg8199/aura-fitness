import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCoachContext } from "@/server/coach-context";
import {
  streamCoachReply,
  mockCoachReply,
  isCoachLive,
  type CoachMessage,
} from "@/lib/coach";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const message: string = (body.message ?? "").toString().slice(0, 2000);
  let conversationId: string | undefined = body.conversationId;
  if (!message.trim()) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  // Ensure a conversation exists
  if (!conversationId) {
    const convo = await prisma.coachConversation.create({
      data: { userId, title: message.slice(0, 40) },
    });
    conversationId = convo.id;
  } else {
    const owned = await prisma.coachConversation.findFirst({ where: { id: conversationId, userId } });
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Persist the user message
  await prisma.coachMessage.create({
    data: { conversationId, role: "user", content: message },
  });

  // Build context + history
  const ctx = await buildCoachContext(userId);
  const priorMessages = await prisma.coachMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  const history: CoachMessage[] = priorMessages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const encoder = new TextEncoder();

  // ── Live (Claude) ──
  if (isCoachLive()) {
    const stream = new ReadableStream({
      async start(controller) {
        let full = "";
        try {
          const claude = await streamCoachReply(ctx, history);
          claude.on("text", (t) => {
            full += t;
            controller.enqueue(encoder.encode(t));
          });
          await claude.finalMessage();
        } catch {
          const fallback = mockCoachReply(ctx, message);
          full = fallback;
          controller.enqueue(encoder.encode(fallback));
        }
        await prisma.coachMessage.create({
          data: { conversationId: conversationId!, role: "assistant", content: full },
        });
        await prisma.coachConversation.update({ where: { id: conversationId! }, data: { updatedAt: new Date() } });
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Conversation-Id": conversationId },
    });
  }

  // ── Mock (stream word by word for a live feel) ──
  const reply = mockCoachReply(ctx, message);
  const stream = new ReadableStream({
    async start(controller) {
      const tokens = reply.split(/(\s+)/);
      for (const tok of tokens) {
        controller.enqueue(encoder.encode(tok));
        await new Promise((r) => setTimeout(r, 14));
      }
      await prisma.coachMessage.create({
        data: { conversationId: conversationId!, role: "assistant", content: reply },
      });
      await prisma.coachConversation.update({ where: { id: conversationId! }, data: { updatedAt: new Date() } });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Conversation-Id": conversationId },
  });
}
