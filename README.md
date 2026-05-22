# Developer OS ⚡

A premium, keyboard-first developer workspace, task manager, and productivity dashboard. Built for low-latency operation, it replaces fragmented notes, checklists, and command references with a single integrated portal.

---

## 🚀 Key Features

*   **Keyboard-Centric Navigation**: Global Command Palette (`⌘K`) launcher to search tasks, toggle themes, navigate views, or trigger quick captures without moving your hands from the keyboard.
*   **Natural Language Task Capture**: built-in regex-based syntactic parser that parses inputs like `Refactor middleware /daily #auth p1 @sprint` in real-time, extracting schedules, folders, tags, and priority markers.
*   **Kanban Boards & Checklist Management**: Smooth, highly-responsive drag-and-drop lanes (`todo`, `doing`, `done`) with checklist indicators powered by `@dnd-kit`.
*   **Markdown Daily Logs**: Standup-aligned markdown journals linked to dates, featuring templates to capture accomplishments, blockers, and learnings.
*   **Command Snippets & Playbooks**: Configurable multiline script playbooks with placeholder variables (e.g. `{{image_name}}`) and one-click copy actions, plus Git URL autofill integration.
*   **Automated Recurrence Engine**: Timezone-aware date tracking resets recurring tasks and checklists at midnight automatically.

---

## 🛠️ Technology Stack

*   **Frontend**: React 18.3, TypeScript, Vite, Tailwind CSS
*   **State Management**: Zustand (with Firestore synchronization patterns)
*   **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
*   **Utilities**: `date-fns` (time calculations, midnight tracking)
*   **Components & Icons**: Radix UI primitives, Lucide React
*   **Database & Auth**: Firebase Auth & Google Cloud Firestore

---

## 🏗️ High-Level Architecture

Developer OS follows a **Client-First SPA Architecture** served by a Next.js routing wrapper to provide static deployment compatibility:

```
┌────────────────────────────────────────────────────────┐
│                      CLIENT SIDE                       │
│                                                        │
│   Keyboard Actions (⌘K, C) ──> NLP Parser/Regex        │
│                                 │                      │
│                                 ▼                      │
│   React UI ──> Zustand Store (Immediate Local Sync)     │
│                     │                                  │
│                     └────> Asynchronous Firestore Write│
└─────────────────────────┬──────────────────────────────┘
                          │
                          ▼ (Asynchronous SDK transport)
┌────────────────────────────────────────────────────────┐
│                      CLOUD BACKEND                     │
│                                                        │
│   Firebase Auth  <──> Firestore collections (/tasks)    │
└────────────────────────────────────────────────────────┘
```

### Engineering Highlights
1.  **Zero-Latency Optimistic UI**: Zustand store actions apply mutations directly to the local cache, guaranteeing `0ms` interface response times. Data is persisted to Firestore in the background.
2.  **Keyboard Navigation Hooks**: Component focus states are managed using React ref cycles and hook listeners, providing a mouse-free experience.

---

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js 18+ or Bun
*   Firebase project configured with Email & Google Authentication and Firestore database

### Getting Started

1.  **Clone & Install Dependencies**
    ```bash
    cd "Developer OS"
    npm install
    # or using Bun
    bun install
    ```

2.  **Configure Environment Variables**
    Create a `.env` file in the root of the `Developer OS` directory:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application in the browser.

4.  **Production Build**
    ```bash
    npm run build
    npm run preview
    ```

---

## 🗺️ Project Structure

*   `app/` - Next.js catch-all routing wrapper
*   `src/` - Core React single-page application
    *   `components/flow/` - Core feature views (Kanban Board, Command Palette, etc.)
    *   `components/ui/` - Atomic Radix/Tailwind components
    *   `store/` - Zustand client state stores
    *   `lib/` - NLP syntactic parser, Firestore queries, and utility scripts
*   `public/` - Public assets, SVG icons, and fonts
