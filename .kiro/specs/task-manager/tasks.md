# Implementation Plan: Task Manager

## Overview

Incremental build of the full-stack task manager: back-end first (Express + MongoDB), then front-end (React), with property-based and unit tests co-located with each component.

## Tasks

- [x] 1. Initialize project structure and tooling
  - Create `server/` and `client/` directories
  - Initialize `server/package.json` with dependencies: `express`, `mongoose`, `cors`, `dotenv`; dev dependencies: `jest`, `supertest`, `fast-check`
  - Bootstrap `client/` with Vite + React (`npm create vite@latest client -- --template react`)
  - Add `.env.example` with `MONGO_URI` and `PORT` placeholders
  - _Requirements: 5.1, 5.2_

- [x] 2. Implement the Task Mongoose model
  - [x] 2.1 Create `server/models/Task.js` with the Mongoose schema
    - Fields: `title` (String, required, trim), `description` (String, trim), `status` (enum: pending/in-progress/completed, default pending), `timestamps: true`
    - _Requirements: 1.3, 2.4_

  - [x] 2.2 Write property test for Task model validation (Property 2)
    - **Property 2: Whitespace/empty title rejected**
    - **Validates: Requirements 1.2**
    - Use fast-check to generate whitespace-only and empty strings; assert Mongoose validation throws

- [x] 3. Implement the Express server and database connection
  - [x] 3.1 Create `server/index.js`
    - Connect to MongoDB using `MONGO_URI` from env; log error and `process.exit(1)` on failure
    - Mount `cors`, `express.json()`, and task router at `/api/tasks`
    - Register centralized error-handling middleware (4-arg)
    - _Requirements: 5.2, 5.3, 6.1_

- [x] 4. Implement CRUD route handlers
  - [x] 4.1 Create `server/routes/tasks.js` with GET `/` — return all tasks
    - _Requirements: 2.2_

  - [x] 4.2 Implement POST `/` — create a task
    - Validate title is non-empty after trim; return 400 if invalid
    - Return 201 with created task
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 4.3 Implement PUT `/:id` — update a task
    - Return 400 for malformed ObjectId; return 404 if task not found
    - Return 200 with updated task
    - _Requirements: 3.1, 3.2, 6.2_

  - [x] 4.4 Implement DELETE `/:id` — delete a task
    - Return 400 for malformed ObjectId; return 404 if task not found
    - Return 200 with confirmation message
    - _Requirements: 4.1, 4.2, 6.2_

- [-] 5. Write back-end tests
  - [x] 5.1 Write unit tests for all route handlers (`server/__tests__/tasks.test.js`)
    - Test 400 on empty title POST
    - Test 404 on PUT/DELETE with valid-format but non-existent ID
    - Test 400 on PUT/DELETE with malformed ID
    - Test 201/200 on successful create/update/delete
    - _Requirements: 1.2, 3.2, 4.2, 6.1, 6.2_

  - [x] 5.2 Write property test — Task creation round-trip (Property 1)
    - **Property 1: Task creation persistence (round-trip)**
    - **Validates: Requirements 1.1, 1.3, 2.2**
    - Generate random valid payloads; POST then GET and assert task present with correct fields

  - [x] 5.3 Write property test — Update reflected in fetch (Property 3)
    - **Property 3: Update reflects in fetch**
    - **Validates: Requirements 3.1, 3.3**
    - Create task, generate random valid update payload, PUT then GET and assert fields match

  - [x] 5.4 Write property test — Delete removes task (Property 4)
    - **Property 4: Delete removes task**
    - **Validates: Requirements 4.1, 4.3**
    - Create task, DELETE it, GET all and assert task absent

  - [x] 5.5 Write property test — Non-existent ID → 404 (Property 5)
    - **Property 5: Non-existent valid ObjectId returns 404**
    - **Validates: Requirements 3.2, 4.2**
    - Generate valid ObjectId-format strings not in DB; assert PUT and DELETE return 404

  - [ ] 5.6 Write property test — Malformed ID → 400 (Property 6)
    - **Property 6: Malformed ID returns 400**
    - **Validates: Requirements 6.2**
    - Generate arbitrary non-ObjectId strings; assert PUT and DELETE return 400

- [x] 6. Checkpoint — Ensure all back-end tests pass
  - Ensure all tests pass; ask the user if questions arise.

- [x] 7. Implement front-end API layer
  - [x] 7.1 Add `axios` to client dependencies
  - [x] 7.2 Create `client/src/api/tasks.js` with functions: `getTasks`, `createTask`, `updateTask`, `deleteTask`
    - Each wraps the corresponding Axios call and returns response data
    - _Requirements: 2.1, 1.4, 3.3, 4.3_

- [x] 8. Implement React components
  - [x] 8.1 Create `client/src/components/TaskForm.jsx`
    - Controlled form with title, description, and status fields
    - Calls `createTask` or `updateTask` on submit; clears fields after successful create
    - _Requirements: 7.1, 7.2, 1.4, 3.3_

  - [x] 8.2 Create `client/src/components/TaskItem.jsx`
    - Displays title, description, status, createdAt
    - Inline edit toggle showing TaskForm pre-filled; delete button with confirmation
    - _Requirements: 2.4, 7.2, 7.3, 4.3_

  - [x] 8.3 Create `client/src/components/TaskList.jsx`
    - Renders a `TaskItem` per task; shows empty-state message when list is empty
    - _Requirements: 2.3, 2.4_

  - [x] 8.4 Update `client/src/App.jsx`
    - Fetch tasks on mount with `getTasks`; manage tasks state
    - Pass loading and error state down; display loading indicator and error message
    - _Requirements: 2.1, 7.4, 7.5_

- [x] 9. Write front-end tests
  - [x] 9.1 Write unit/example tests for TaskForm, TaskList, TaskItem (`client/src/__tests__/`)
    - Verify form renders required fields (title, description, status)
    - Verify empty task list shows empty-state message
    - Verify each task displays title, description, status, createdAt
    - Verify loading and error states render correctly
    - _Requirements: 2.3, 2.4, 7.1, 7.4, 7.5_

- [ ] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks are all required — comprehensive testing from the start
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations each
- The back-end tests use supertest against an in-memory MongoDB (mongodb-memory-server) to avoid needing a live DB during CI
