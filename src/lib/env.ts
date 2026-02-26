import "server-only";
import { z } from "zod";

const envSchema = z.object({
  TRELLO_API_KEY: z.string().min(1, "TRELLO_API_KEY is required"),
  TRELLO_TOKEN: z.string().min(1, "TRELLO_TOKEN is required"),
  TRELLO_BOARD_ID: z.string().min(1, "TRELLO_BOARD_ID is required"),
  TEAM_MEMBER_IDS: z.string().min(1, "TEAM_MEMBER_IDS is required"),
  EXCLUDE_MEMBER_IDS: z.string().default(""),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new Error(
      `Missing environment variables: ${missing}. See .env.example`
    );
  }
  return result.data;
}

export const env = loadEnv();

export const teamMemberIds = env.TEAM_MEMBER_IDS.split(",").map((s) =>
  s.trim()
);
export const excludeMemberIds = env.EXCLUDE_MEMBER_IDS
  ? env.EXCLUDE_MEMBER_IDS.split(",").map((s) => s.trim())
  : [];
