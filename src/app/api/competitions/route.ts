import { getDynamicCompetitions } from "@/lib/dynamic-data";
import { ApiResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const competitions = await getDynamicCompetitions();

    // If no competitions found in database, use fallback
    if (competitions.length === 0) {
      const fallbackCompetitions = ["AMC8", "AMC10", "AMC12", "AIME", "Math Kangaroo", "MathCounts", "MOEMS"];
      return ApiResponse.success(fallbackCompetitions, "Using fallback competition list");
    }

    return ApiResponse.success(competitions);
  } catch (error) {
    // Return fallback data as successful response
    const fallbackCompetitions = ["AMC8", "AMC10", "AMC12", "AIME", "Math Kangaroo", "MathCounts", "MOEMS"];
    return ApiResponse.success(fallbackCompetitions, "Using fallback competition list");
  }
}
