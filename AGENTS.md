# Hoard Agent Instructions

## Project

Hoard is an AGPL-3.0 open-source fork of Stash.

The project will evolve Stash incrementally rather than replace it through a ground-up rewrite. The existing Go media engine, database, GraphQL API, plugins, scrapers, media processing, and legacy React interface provide the working foundation.

The first major goal is a new SvelteKit interface served alongside the legacy interface.

## Core Strategy

1. Keep the application working throughout the transition.
2. Prefer small additions over invasive rewrites.
3. Preserve reasonable compatibility with upstream Stash.
4. Replace functionality through complete vertical slices.
5. Do not remove the legacy interface until Hoard covers the required workflows.
6. Let demonstrated product needs drive backend changes.

Initially:

```text
/          Existing Stash interface
/hoard/    New Hoard interface
```

Later, after sufficient feature coverage:

```text
/          Hoard interface
/legacy/   Existing Stash interface
```

Do not reverse these routes prematurely.

## Repository Discipline

The Git remotes should be:

```text
origin    Hoard fork
upstream  stashapp/stash
```

Preserve upstream history. Never rewrite, squash, or force-push upstream-derived history.

Keep changes easy to review and easy to rebase:

* Do not perform unrelated renames or formatting.
* Do not reorganize upstream Go packages without a concrete need.
* Do not modify the legacy React frontend unless the task explicitly requires it.
* Do not mix rebranding, infrastructure, backend, and feature changes in one commit.
* Never overwrite unrelated user changes.
* Do not commit secrets, local configuration, databases, generated media, dependency caches, or build output.
* Commit completed green slices as small, coherent commits.
* Never commit known failing work unless explicitly instructed.

Before changing upstream-derived code, understand its current behaviour and use the narrowest viable extension point.

## Architecture

### Existing backend

The existing Go server remains the authoritative application backend.

Use its existing:

* GraphQL schema and resolvers
* authentication and session handling
* media and streaming endpoints
* database and migration system
* plugin and scraper systems
* task infrastructure
* configuration conventions

Do not introduce a replacement REST API, PostgreSQL layer, repository abstraction, or alternate domain model unless a task explicitly requires one.

Do not duplicate backend functionality in the frontend.

### Hoard frontend

Place the new frontend under:

```text
ui/hoard/
```

Use:

* SvelteKit
* Svelte 5
* TypeScript in strict mode
* static SPA output through `adapter-static`
* pnpm only
* Tailwind CSS
* DaisyUI

The SvelteKit application is a browser client, not another backend.

Do not use:

* `adapter-node`
* `+page.server.ts`
* `+layout.server.ts`
* SvelteKit API routes
* form actions
* remote functions
* a required Node.js runtime in production
* legacy Svelte syntax

Use current Svelte 5 runes and current SvelteKit conventions. Do not introduce deprecated patterns for familiarity.

The production build must be static and embeddable in the Go binary.

### API access

The Hoard frontend communicates directly with the Go server through same-origin HTTP.

Use the existing GraphQL API for application data and existing HTTP endpoints for media, uploads, downloads, and other non-GraphQL operations.

Keep API access behind a small, explicit frontend boundary:

```text
ui/hoard/src/lib/api/
```

Requirements:

* Store GraphQL operations in dedicated `.graphql` documents.
* Generate TypeScript operation and result types from the authoritative schema.
* Do not manually duplicate generated GraphQL types.
* Do not scatter raw `fetch` calls throughout components.
* Preserve existing session-cookie behaviour.
* Never embed privileged API keys in browser assets.
* Avoid changing the GraphQL schema solely to make frontend code slightly more convenient.

Generated files must only be changed through their generator.

### Future management application

A future management interface may start, stop, update, back up, or inspect the main Hoard server.

That functionality must run in a separate process. The main server cannot reliably provide the interface used to stop itself.

Do not implement this management process until explicitly requested.

## UI Principles

Hoard is UI-first, but not appearance-first.

Prioritize:

1. clear workflows
2. speed and responsiveness
3. predictable navigation
4. accessibility
5. keyboard usability
6. useful loading, empty, and error states
7. responsive layouts
8. visual polish

Use semantic HTML. Interactive elements must be keyboard accessible and visibly focusable.

Do not reproduce legacy screens blindly. Preserve capabilities while improving their workflow.

Build one complete vertical slice at a time, such as:

```text
browse scenes
→ filter and paginate
→ open scene
→ play media
→ edit metadata
→ save and refresh
→ handle failure
```

A partially implemented collection of screens is less valuable than one finished workflow.

## Backend Changes

Change the backend only when existing behaviour cannot support a concrete Hoard requirement.

For backend changes:

* Follow existing Go package boundaries and conventions.
* Prefer extending existing APIs over creating parallel systems.
* Preserve database and configuration compatibility where practical.
* Use the existing migration framework for schema changes.
* Never edit a user database outside the established database layer.
* Validate filesystem paths and preserve existing media-access protections.
* Consider plugins, scrapers, generated assets, backups, and migrations before changing shared models.
* Add tests covering compatibility and failure behaviour.

Do not casually rename Stash configuration keys, database fields, GraphQL fields, plugin interfaces, or filesystem paths. These are compatibility surfaces, even when their names are no longer ideal.

## Testing

Use strict red-green-refactor development for changed behaviour.

1. Write or identify a failing test.
2. Confirm that it fails for the expected reason.
3. Implement the smallest correct change.
4. Confirm that the test passes.
5. Refactor while keeping tests green.

Once implementation of a tested behaviour has begun, do not weaken, delete, skip, or rewrite the test merely to obtain a passing result. Ask for permission if the test itself is proven incorrect.

Tests must cover behaviour rather than implementation details.

Use:

* Go unit and integration tests for backend behaviour
* frontend unit tests for isolated logic
* component tests for meaningful UI behaviour
* Playwright end-to-end tests for important user workflows

Bug fixes require a regression test whenever practical.

Mock only external or genuinely expensive boundaries. Prefer realistic GraphQL responses and real browser workflows over excessive mocking.

## Commands and Tooling

Use the project-provided commands and pinned tool versions.

For upstream code, follow the existing Makefile and development documentation. Common checks include:

```bash
make fmt
make lint
make it
make validate
make generate
make ui
make stash
```

For `ui/hoard`, always use pnpm:

```bash
pnpm install
pnpm check
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Use the actual scripts defined in `ui/hoard/package.json`; add missing scripts deliberately rather than bypassing them.

Never use npm, yarn, or bun in the Hoard frontend.

Do not upgrade dependencies, regenerate lockfiles, or alter tool versions unless required by the task.

## Working Method

Before editing:

1. Read the relevant code and documentation.
2. Check for local instructions in deeper directories.
3. Inspect the current Git status.
4. Identify generated files and compatibility boundaries.
5. State a concise implementation plan.

During implementation:

* Work in small, testable increments.
* Reuse existing functionality before creating new abstractions.
* Avoid speculative frameworks and premature generalization.
* Keep components and packages narrowly responsible.
* Handle errors explicitly.
* Do not leave placeholder implementations presented as complete.

Before completion:

1. Run targeted tests.
2. Run the broadest reasonable validation for the affected areas.
3. Run formatting and static checks.
4. Review the diff for unrelated changes.
5. Confirm the working tree contains no accidental generated or local files.
6. Update documentation when behaviour, setup, or architecture changed.

Report:

* what changed
* important design decisions
* tests and validation run
* anything not validated
* known limitations or follow-up work

Never claim a command passed unless it was actually run successfully.

## Licensing and Branding

Hoard is distributed under AGPL-3.0.

* Preserve the licence and existing copyright notices.
* Do not remove Stash attribution from source history or legal notices.
* New project code must be compatible with AGPL-3.0.
* Use Hoard branding for new user-facing work.
* Do not imply that Hoard is an official Stash release or endorsed by the Stash project.

## Decision Rule

When uncertain, choose the option that:

1. delivers a usable vertical slice,
2. changes less upstream code,
3. preserves compatibility,
4. is easier to test,
5. adds fewer dependencies,
6. and remains easy to remove or revise.
