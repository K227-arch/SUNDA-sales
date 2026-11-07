import { NextResponse } from "next/server";
import { registerManualReload } from "@/lib/adapters/sunda-server";

/**
 * POST /api/sunda/reload
 * Body: { paymentId, litres, amountRwf?, reference, occurredAt? }
 * Proxies to the SUNDA main server [B] manual-reload endpoint.
 * Called from the Manual Payment Registration form on the payout breakdown page.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, litres, amountRwf, reference, occurredAt } = body;

    if (!paymentId || !litres || !reference) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: "paymentId, litres and reference are required" } },
        { status: 400 },
      );
    }

    const result = await registerManualReload({
      paymentId,
      litres: Number(litres),
      amountRwf: amountRwf ? Number(amountRwf) : undefined,
      reference,
      occurredAt,
    });

    const status = result.success ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: String(err) } },
      { status: 500 },
    );
  }
}
