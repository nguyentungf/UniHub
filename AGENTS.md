# AGENTS.md - Developer & AI Agent Guidelines for UniHub

Welcome to **UniHub**! This document defines the engineering standards, architectural boundaries, and operational rules for all AI agents and human contributors working on this codebase.

---

## 1. Project Vision & Core Stack

**UniHub** is an offline-first, client-side university student productivity web application. It operates entirely in the browser with persistent local storage.

- **Framework**: React 18+ with TypeScript (Strict mode enabled)
- **Bundler & Tooling**: Vite
- **Styling**: Tailwind CSS + `shadcn/ui` (Radix UI primitives)
- **Routing**: React Router v6+ (nested layouts, declarative routes)
- **State Management**: Zustand (modular feature stores)
- **Validation**: Zod (runtime validation, schema-driven inference)
- **Data Visualization**: Recharts (clean, responsive student analytics)
- **Date Handling**: `date-fns` (never use native Date arithmetic or moment.js)
- **Persistence**: IndexedDB (for relational/entity data) + LocalStorage (for UI preferences & active semester)

---

## 2. Absolute Non-Negotiables & Constraints

1. **Client-Only Architecture**:
   - **DO NOT** introduce external backends, Node.js servers, Docker containers, or cloud databases (Firebase, Supabase, Prisma, PostgreSQL).
   - All persistence must go through the Data Access Layer (`@/lib/storage`).
2. **No Overengineering**:
   - Keep code clean, readable, and accessible for a beginner developer.
   - Avoid premature micro-abstractions, excessive design patterns, or bloated external libraries.
3. **Strict Type Safety**:
   - **NEVER** use `any` or `@ts-ignore` without explicit justification.
   - All domain entity types must come from `@/types` and be validated through `@/lib/validation/schemas.ts`.
4. **Data Integrity & Offline First**:
   - The app must work 100% offline.
   - All changes must survive browser reloads.
   - Provide safe fallback and error boundaries so corrupted local data never bricks the UI.

---

## 3. Directory & Folder Conventions

UniHub follows a **Feature-Driven Architecture**:

```text
src/
├── assets/                 # Static assets (SVGs, icons, illustrations)
├── components/
│   ├── common/             # App-wide UI (Sidebar, Navbar, PageHeader, EmptyState, StatCard)
│   └── ui/                 # Atomic shadcn/ui components (button, card, dialog, input...)
├── constants/              # Seed data, default config, grading scale definitions
├── features/               # Domain-specific feature modules
│   ├── dashboard/          # Summary widgets, schedule peek, alerts
│   ├── courses/            # Course catalog, syllabus breakdown, detail views
│   ├── timetable/          # Weekly calendar grid, clash detection
│   ├── assignments/        # Kanban & list views, deadline tracking
│   ├── exams/              # Exam timeline, countdown cards, seat info
│   ├── gpa/                # GPA calculator, target simulator, scale settings
│   ├── study/              # Pomodoro timer, stopwatch, session logs
│   ├── notes/              # Markdown notes, tagging, course link
│   └── settings/           # Semester management, backup import/export
├── hooks/                  # Global reusable React hooks (useMediaQuery, useDebounce...)
├── lib/
│   ├── storage/            # IndexedDB engine, LocalStorage helpers, Repositories (DAL)
│   ├── validation/         # Zod schemas for all entities and backup payloads
│   └── utils.ts            # Classnames helper (cn), formatting utilities
├── routes/                 # Route configuration and router definition
├── stores/                 # Zustand store slices (or feature-based stores)
├── types/                  # Centralized TypeScript entity & interface definitions
├── App.tsx                 # Root application component with providers
└── main.tsx                # Application entrypoint
```

### Feature Module Structure Rules:
Inside each `src/features/[feature-name]/`:
- `components/`: Feature-specific UI components (e.g. `AssignmentKanban.tsx`, `AssignmentCard.tsx`).
- `hooks/`: Feature-specific hooks (e.g. `useAssignmentFilters.ts`).
- `types/`: Sub-types exclusive to this feature (if not already in global `@/types`).
- `index.ts`: Public API export barrel for the feature.

---

## 4. Data Access Layer (DAL) Rules

**Rule**: React components and Zustand stores must **NEVER** call raw IndexedDB or `window.localStorage` directly.

- All data operations must pass through the typed repository pattern in `@/lib/storage/dal.ts`.
- Every mutation must perform **Optimistic UI Updates** in Zustand while dispatching asynchronous persistence to the repository.
- If storage fails, catch the error, roll back state, and display a user-friendly error message.

```typescript
// ✅ CORRECT: Interacting via Repository
await dbRepository.courses.create(newCourse);

// ❌ WRONG: Bypassing the DAL
window.localStorage.setItem('courses', JSON.stringify(courses));
const rawDb = window.indexedDB.open('UniHub_DB');
```

---

## 5. State Management Conventions (Zustand)

1. **One Store per Feature**: Prefer feature-scoped stores (`useCourseStore`, `useAssignmentStore`, `useStudyStore`) over a single monolithic store.
2. **State & Actions Co-location**: Keep state variables and their updater actions inside the same store definition.
3. **Selectors for Performance**: When consuming store state in components, always use granular selectors:
   ```typescript
   // ✅ GOOD
   const courses = useCourseStore((state) => state.courses);
   
   // ❌ BAD (triggers unnecessary re-renders)
   const { courses, removeCourse, updateCourse } = useCourseStore();
   ```

---

## 6. UI & Styling Rules

1. **Component Library**: Use standard `shadcn/ui` components (Radix primitives styled with Tailwind).
2. **Icons**: Use `lucide-react` exclusively. Do not mix icon sets.
3. **Accessibility**: All buttons, inputs, and modals must have proper `aria-labels` and keyboard focus states.
4. **Color Tokens**: Course colors must use accessible, predefined hex tokens that render clearly in both Light and Dark modes.
5. **Responsive Design**: Mobile-first design. The sidebar must collapse to a bottom navigation or sheet drawer on viewports `< 768px`.

---

## 7. Data Validation & Import/Export Rules

1. **Zod Validation**:
   - Validate form inputs with Zod schemas before persisting.
   - Use `z.infer<typeof Schema>` to keep validation and types strictly synced.
2. **Backup & Restore**:
   - The export format is a single JSON envelope: `{ version: 1, exportedAt: string, appName: "UniHub", data: { ... } }`.
   - On import, **ALWAYS** validate the incoming JSON using `BackupDataSchema.safeParse(json)`.
   - If validation fails, abort import with informative field-level errors to prevent storage corruption.

---

## 8. Definition of Done for Future Tasks

When adding a new feature or fixing an issue:
1. Ensure TypeScript compiles without errors (`tsc --noEmit`).
2. Verify that mock seed data loads and renders cleanly.
3. Test that changes survive hard page refresh (`F5`).
4. Keep the code concise, maintain comments for non-obvious logic, and preserve existing structure.
