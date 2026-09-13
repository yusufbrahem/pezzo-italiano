import { NextResponse } from "next/server";
import { getHoursSchedule, getHoursOverride } from "@/lib/data/settings";
import { computeIsOpen } from "@/lib/hours-shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const [schedule, override] = await Promise.all([getHoursSchedule(), getHoursOverride()]);
  const status = computeIsOpen(schedule, override);
  return NextResponse.json(status, { headers: { "Cache-Control": "public, max-age=30" } });
}
