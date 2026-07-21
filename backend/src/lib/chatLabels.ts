import { prisma } from "./prisma";

export interface ChatMaskingContext {
  buyerProfileId: string;
  buyerCompanyName: string;
  supplierLabels: Map<string, string>; // supplierProfileId -> "Supplier N"
  supplierNames: Map<string, string>; // supplierProfileId -> real company name (buyer view only)
}

// Stable per-group numbering (order suppliers were added), not the price-based
// ranking used for bid responses — a chat label must never shift mid-conversation.
export async function buildChatMaskingContext(groupId: string): Promise<ChatMaskingContext> {
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    include: {
      buyerProfile: { select: { companyName: true } },
      suppliers: {
        where: { supplierProfileId: { not: null } },
        orderBy: { addedAt: "asc" },
        include: { supplierProfile: { select: { companyName: true } } },
      },
    },
  });

  const supplierLabels = new Map<string, string>();
  const supplierNames = new Map<string, string>();
  group.suppliers.forEach((s, i) => {
    const id = s.supplierProfileId as string;
    supplierLabels.set(id, `Supplier ${i + 1}`);
    supplierNames.set(id, s.supplierProfile!.companyName);
  });

  return {
    buyerProfileId: group.buyerProfileId,
    buyerCompanyName: group.buyerProfile.companyName,
    supplierLabels,
    supplierNames,
  };
}

export interface RawChatMessage {
  id: string;
  senderProfileId: string | null;
  text: string;
  type: "text" | "system";
  createdAt: number;
}

export interface MaskedChatMessage {
  id: string;
  text: string;
  type: "text" | "system";
  createdAt: number;
  senderLabel: string;
  isYou: boolean;
}

export function maskMessage(
  message: RawChatMessage,
  viewerProfileId: string,
  viewerIsBuyer: boolean,
  ctx: ChatMaskingContext
): MaskedChatMessage {
  if (message.type === "system" || !message.senderProfileId) {
    return { id: message.id, text: message.text, type: message.type, createdAt: message.createdAt, senderLabel: "", isYou: false };
  }

  const isYou = message.senderProfileId === viewerProfileId;
  let senderLabel: string;

  if (isYou) {
    senderLabel = "You";
  } else if (message.senderProfileId === ctx.buyerProfileId) {
    senderLabel = ctx.buyerCompanyName;
  } else if (viewerIsBuyer) {
    senderLabel = ctx.supplierNames.get(message.senderProfileId) ?? "Unknown Supplier";
  } else {
    senderLabel = ctx.supplierLabels.get(message.senderProfileId) ?? "Unknown Supplier";
  }

  return { id: message.id, text: message.text, type: message.type, createdAt: message.createdAt, senderLabel, isYou };
}
