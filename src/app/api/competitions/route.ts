import { getDynamicCompetitions } from "@/lib/dynamic-data";
import { ApiResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const competitions = await getDynamicCompetitions();
    return ApiResponse.success(competitions);
  } catch (error) {
    console.error("Error fetching competitions:", error);
    // Return fallback data as successful response
    const fallbackCompetitions = ["AMC8", "AMC 10", "Math Kangaroo", "MOEMS", "MathCounts", "AIME"];
    return ApiResponse.success(fallbackCompetitions, "Using fallback competition list");
  }
}
