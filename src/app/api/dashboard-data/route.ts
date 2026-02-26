import { getDashboardData } from "@/lib/trello-data-service";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";

export const maxDuration = 30;

export async function GET() {
  try {
    const data = await getDashboardData();
    return Response.json(data);
  } catch (error) {
    logApiError("dashboard-data GET failed", error);

    if (
      error instanceof Error &&
      error.message.includes("authentication failed")
    ) {
      return apiErrorResponse(
        401,
        "auth_error",
        "Trello authentication failed. Check TRELLO_API_KEY and TRELLO_TOKEN.",
      );
    }

    return apiErrorResponse(
      500,
      "internal_error",
      error instanceof Error ? error.message : "Failed to fetch dashboard data",
    );
  }
}
