import { NextResponse } from "next/server";
import { getDynamicCompetitions } from "@/lib/dynamic-data";

export async function GET() {
  try {
    const competitions = await getDynamicCompetitions();
    return NextResponse.json(competitions);
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return NextResponse.json(["AMC8", "AMC 10", "Math Kangaroo", "MOEMS", "MathCounts", "AIME"], { status: 200 });
  }
}
