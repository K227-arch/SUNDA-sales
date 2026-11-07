import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── POST /api/clients — register a new client ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      clientId,
      category,
      transferCondition,
      paymentFrequency,
      paymentStartMonth,
      transferMethod,
      payoutPhone,
      bankAccount,
      reportFormat,
    } = body as {
      name: string;
      clientId?: string;
      category: string;
      transferCondition?: string;
      paymentFrequency: "MONTHLY" | "QUARTERLY";
      paymentStartMonth?: string;
      transferMethod: "MOBILE_MONEY" | "BANK";
      payoutPhone?: string;
      bankAccount?: string;
      reportFormat?: string;
    };

    // ── Validation ────────────────────────────────────────────────────────────
    if (!name?.trim()) {
      return NextResponse.json({ error: "Client name is required." }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "Client category is required." }, { status: 400 });
    }
    if (!paymentFrequency) {
      return NextResponse.json({ error: "Payment frequency is required." }, { status: 400 });
    }
    if (!transferMethod) {
      return NextResponse.json({ error: "Transfer method is required." }, { status: 400 });
    }
    if (transferMethod === "MOBILE_MONEY" && !payoutPhone?.trim()) {
      return NextResponse.json({ error: "Mobile money number is required." }, { status: 400 });
    }
    if (transferMethod === "BANK" && !bankAccount?.trim()) {
      return NextResponse.json({ error: "Bank account details are required." }, { status: 400 });
    }

    // ── Auto-generate clientId if not provided ────────────────────────────────
    const resolvedClientId =
      clientId?.trim() ||
      `C-${Date.now().toString(36).toUpperCase()}`;

    // ── Check uniqueness ──────────────────────────────────────────────────────
    const existing = await prisma.client.findUnique({
      where: { clientId: resolvedClientId },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Client ID "${resolvedClientId}" is already in use.` },
        { status: 409 },
      );
    }

    // ── Derive first payout date ──────────────────────────────────────────────
    let firstPayoutDate: Date | undefined;
    if (paymentStartMonth) {
      // paymentStartMonth is "YYYY-MM" from <input type="month">
      firstPayoutDate = new Date(`${paymentStartMonth}-01T00:00:00Z`);
    }

    // ── Create client ─────────────────────────────────────────────────────────
    const client = await prisma.client.create({
      data: {
        clientId: resolvedClientId,
        name: name.trim(),
        category,
        paymentFrequency,
        transferMethod,
        payoutPhone: transferMethod === "MOBILE_MONEY" ? payoutPhone?.trim() : null,
        bankAccount: transferMethod === "BANK" ? bankAccount?.trim() : null,
        reportFormat: reportFormat?.trim() || null,
        firstPayoutDate: firstPayoutDate ?? null,
        // Store transfer condition in reportFormat col or add as a note;
        // mapped to a dedicated notes field via bankAccount placeholder until
        // a `transferCondition` column is migrated.
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ id: client.id, clientId: client.clientId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/clients]", err);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 },
    );
  }
}

// ── GET /api/clients — list all clients ──────────────────────────────────────
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        clientId: true,
        name: true,
        category: true,
        status: true,
        paymentFrequency: true,
        transferMethod: true,
        createdAt: true,
      },
    });
    return NextResponse.json(clients);
  } catch (err) {
    console.error("[GET /api/clients]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
