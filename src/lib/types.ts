// ===== Trello Raw Types =====

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  idMembers: string[];
  idLabels: string[];
  due: string | null;
  dueComplete: boolean;
  dateLastActivity: string;
  checklists: TrelloChecklist[];
}

export interface TrelloChecklist {
  id: string;
  name: string;
  checkItems: TrelloCheckItem[];
}

export interface TrelloCheckItem {
  id: string;
  name: string;
  state: "complete" | "incomplete";
}

export interface TrelloMember {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface TrelloList {
  id: string;
  name: string;
  pos: number;
}

// ===== Dashboard Types (normalized for UI) =====

export interface DashboardCard {
  id: string;
  title: string;
  description: string;
  status: string; // Specific Trello list name (e.g., "In Progress", "Pending Review")
  bucket: string; // Bucket key (e.g., "progress", "queue", "completed", "onHold")
  statusOrder: number; // List position for sorting
  assignees: string[]; // Member full names
  assigneeIds: string[]; // Member IDs
  labels: DashboardLabel[];
  dueDate: string | null;
  isOverdue: boolean;
  isComplete: boolean;
  lastActivity: string;
  checklistProgress: number; // 0-100
  checklistTotal: number;
  checklistCompleted: number;
  checklists: DashboardChecklist[];
}

export interface DashboardLabel {
  name: string;
  color: string;
}

export interface DashboardChecklist {
  name: string;
  items: { name: string; complete: boolean }[];
  completed: number;
  total: number;
}

// ===== Aggregated Types =====

export interface TeamMemberWorkload {
  memberId: string;
  memberName: string;
  cardsInProgress: number;
  cardsInReview: number;
  cardsOnHold?: number;
  cardsCompleted?: number;
  cardsTotal: number; // Excludes completed
  averageProgress: number; // Avg checklist %
  overdueCards: number;
  cards: DashboardCard[];
}

export interface BoardSummary {
  totalCards: number;
  byStatus: Record<string, number>;
  byMember: Record<string, number>;
  queueDepth: number;
  inProgress: number;
  recentlyCompleted: number; // Last 30 days
  onHold: number;
  overdueCount: number;
  lastUpdated: string; // ISO timestamp
}

export interface DashboardData {
  summary: BoardSummary;
  cards: DashboardCard[];
  members: TrelloMember[];
  lists: TrelloList[];
  workloads: TeamMemberWorkload[];
}
