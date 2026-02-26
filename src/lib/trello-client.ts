import { env } from "./env";
import type {
  TrelloCard,
  TrelloLabel,
  TrelloList,
  TrelloMember,
} from "./types";

const TRELLO_API_BASE = "https://api.trello.com/1";

export class TrelloClient {
  private apiKey = env.TRELLO_API_KEY;
  private token = env.TRELLO_TOKEN;
  private boardId = env.TRELLO_BOARD_ID;

  private async request<T>(
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${TRELLO_API_BASE}${endpoint}`);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("token", this.token);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Trello authentication failed. Check TRELLO_API_KEY and TRELLO_TOKEN.",
        );
      }
      throw new Error(
        `Trello API ${response.status}: ${response.statusText} — ${endpoint}`,
      );
    }
    return response.json();
  }

  async getLists(): Promise<TrelloList[]> {
    return this.request(`/boards/${this.boardId}/lists`, { filter: "open" });
  }

  async getCards(): Promise<TrelloCard[]> {
    return this.request(`/boards/${this.boardId}/cards`, {
      fields:
        "name,desc,idList,idMembers,idLabels,due,dueComplete,dateLastActivity,shortUrl",
      checklists: "all",
      filter: "open",
    });
  }

  async getMembers(): Promise<TrelloMember[]> {
    return this.request(`/boards/${this.boardId}/members`, {
      fields: "fullName,username,avatarUrl",
    });
  }

  async getLabels(): Promise<TrelloLabel[]> {
    return this.request(`/boards/${this.boardId}/labels`, {
      fields: "name,color",
    });
  }
}
