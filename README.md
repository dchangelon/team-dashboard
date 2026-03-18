# Team Dashboard

A live dashboard that shows what the Data Analytics team is working on — project status, checklist progress, member workloads, and overdue alerts — all pulled from Trello.

## Why This Exists

People kept asking our team the same question: "What's the status of my request?" We had a Trello board, but nobody outside the team was going to check Trello. This dashboard gives anyone a read-only view of the team's pipeline without needing to interrupt us.

## Features

- **Pipeline view** — See how many projects are in Queue, In Progress, Pending Review, and Completed at a glance
- **Project cards** — Each card shows progress (checklist completion %), assignees, labels, due dates, and staleness indicators
- **Team workload** — Capacity bars per team member so you can see who's loaded and who has room
- **Overdue alerts** — Red indicators on overdue cards and a banner when anything is past due
- **Filtering** — Search by project name, filter by team member, or click a pipeline stage to drill down
- **Card detail modal** — Click any project to see full checklists, description, and metadata
- **Auto-refresh** — Dashboard updates every 5 minutes with a manual refresh option

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16, TypeScript, App Router |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Data | TanStack Query, Zustand, Trello REST API |
| Hosting | Vercel |

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your Trello credentials (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `TRELLO_API_KEY` | Trello API key |
| `TRELLO_TOKEN` | Trello OAuth token |
| `TRELLO_BOARD_ID` | Board ID from your Trello URL (`trello.com/b/{BOARD_ID}/...`) |
| `TEAM_MEMBER_IDS` | Comma-separated Trello member IDs for your team |
| `EXCLUDE_MEMBER_IDS` | Members to hide from workload views (optional) |

All variables are server-side only — no secrets are exposed to the browser.

## License

MIT
