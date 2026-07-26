# Hoard frontend

The new Hoard interface. It is a **static, browser-only SvelteKit SPA** (Svelte 5,
TypeScript in strict mode, Tailwind CSS 4, DaisyUI) that talks to the existing Go
server over same-origin HTTP.

The legacy React interface in `ui/v2.5` is unchanged and still serves `/`. This
application is mounted at `/hoard/` and will remain there until it covers the
workflows people actually rely on.

## Requirements

Use **pnpm only**. npm, yarn, and bun are not supported here — they would produce a
lockfile that disagrees with `pnpm-lock.yaml` and with `ui/v2.5`'s conventions.

## Commands

```bash
pnpm install        # install dependencies
pnpm dev            # dev server
pnpm build          # production build
pnpm preview        # serve the production build locally
pnpm check          # svelte-check / TypeScript
pnpm check:watch    # the same, in watch mode
pnpm lint           # prettier --check and eslint
pnpm format         # prettier --write
pnpm test           # fast suite: unit + component tests, single run
pnpm test:unit      # vitest in watch mode
pnpm test:e2e       # Playwright, against a real production build
```

`pnpm test` deliberately excludes Playwright so the inner loop stays fast. Full
validation runs `pnpm test:e2e` as a separate step.

From the repository root, `make validate-ui-hoard` runs check + lint + unit tests
and `make validate-ui-hoard-e2e` runs Playwright. Both are part of `make validate`
and run in CI on every pull request.

Node `^20.19.0 || >=22.12.0` is required (Vite 8). `.npmrc` sets `engine-strict`, so
pnpm refuses to install on an older runtime rather than failing later in the build.

## Base path

The app defaults to the `/hoard` base path. Override it at build time with
`HOARD_BASE_PATH`:

```bash
pnpm build                      # served from /hoard/
HOARD_BASE_PATH="" pnpm build   # served from /
HOARD_BASE_PATH=/media/hoard pnpm build
```

The value must be empty or start with `/`; a trailing slash is stripped, and
anything else fails the build. The logic lives in `src/lib/base-path.ts` and is
consumed by both `vite.config.ts` and `playwright.config.ts`, so the e2e suite
always tests the base path the build actually uses.

## Talking to the Go server in development

`pnpm dev` proxies the Go server's API and media routes, so the browser only ever
sees one origin:

```
browser ──► localhost:5173/hoard/     the app, from Vite
browser ──► localhost:5173/graphql    forwarded ──► localhost:9999/graphql
```

This matters because Stash authenticates with a **session cookie**, and browsers do
not send cookies cross-origin. `ui/v2.5` points at the server cross-origin instead,
which is why logged-in development does not work there (`docs/DEVELOPMENT.md`).
Proxying avoids that entirely and makes development match production, where the Go
binary serves the app and the API together.

Run the server on its default port and start the dev server:

```bash
./stash                              # localhost:9999
cd ui/hoard && pnpm dev              # localhost:5173/hoard/
HOARD_API_URL=http://host:8080 pnpm dev   # point at a server elsewhere
```

`HOARD_API_URL` must be an absolute http(s) URL; anything else fails fast rather
than producing a proxy that forwards nowhere.

The proxied prefixes live in `src/lib/dev-proxy.ts`. A test cross-checks them
against the route registrations in `internal/api/server.go`, so a route added to the
Go server fails the suite until it is either proxied or explicitly opted out.

This is **dev only** — `server.proxy` does not exist in a production build.

## Build output

`pnpm build` writes to `build/`, which is git-ignored. It contains only static
HTML, JavaScript, CSS, and assets — **no Node.js server is needed in production**.

`@sveltejs/adapter-static` is configured with `fallback: '200.html'`, so any
unmatched path below the base must be answered with `build/200.html` and routed on
the client.

## Serving from the Go server

`build/` is embedded into the `stash` binary by `ui/ui.go` and served at `/hoard` by
`internal/api/ui_hoard.go`. From the repository root:

```bash
make pre-ui      # once, installs deps for both UIs
make generate
make ui          # builds ui/v2.5 and ui/hoard (or just: make ui-hoard)
make build       # -> ./stash
```

The build output is not committed, matching `ui/v2.5`. For backend-only work,
`make touch-ui` writes a placeholder `build/200.html` so the `//go:embed` still
compiles — the binary then serves an empty page at `/hoard`.

**Known limitation:** the base path is baked in at build time, so Hoard does not
work behind a reverse-proxy prefix (`X-Forwarded-Prefix`). The classic UI handles
this by rewriting `<base href>` per request; a SvelteKit SPA fallback always emits
absolute asset paths, so the same trick does not apply. Rebuild with a matching
`HOARD_BASE_PATH` if you need this today.

## Themes

DaisyUI's built-in themes are all enabled in `src/app.css`:

```css
@plugin 'daisyui' {
	themes: all;
}
```

The canonical list of theme names lives in **`src/lib/theme/themes.ts`** and is the
only place theme names are written down. `themes.spec.ts` compares it against
`node_modules/daisyui/theme`, so bumping DaisyUI fails the tests if the set drifts.

`src/lib/theme/theme.ts` holds the theme service: it validates against the canonical
list, applies the selection to `document.documentElement.dataset.theme`, and stores
it under the `hoard.theme` local-storage key. Blocked or unavailable storage is
handled rather than thrown. When nothing valid is stored it follows
`prefers-color-scheme`, falling back to `dark` or `light`.

An inline script in `src/app.html` applies the remembered theme before first paint
to avoid a flash. It shares the `hoard.theme` key — change both together.

## Deliberately deferred

These are out of scope for the bootstrap and will land as their own vertical slices:

- **GraphQL integration.** No client, no generated types, no `.graphql` documents
  yet. When it lands it goes behind `src/lib/api/`, generated from the authoritative
  schema.
- **Authentication and session handling**, media browsing, playback, and metadata
  editing.

## Constraints

This app is a browser client, not another backend. Do not add `+page.server.ts`,
`+layout.server.ts`, `+server.ts`, form actions, remote functions, server hooks, or
`adapter-node`. Anything requiring a server belongs in the Go server.
