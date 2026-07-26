<div align="center">

# Hoard

### Your media. Your server. Your rules.

A private, self-hosted home media server for organizing, enriching, managing, and enjoying the media you keep.

[![Build](https://github.com/mkfoss/hoard/actions/workflows/build.yml/badge.svg?branch=develop\&event=push)](https://github.com/mkfoss/hoard/actions/workflows/build.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Status: Early Development](https://img.shields.io/badge/status-early%20development-orange.svg)](https://github.com/mkfoss/hoard)

</div>

> [!IMPORTANT]
> **Hoard is in the early stages of its transition from Stash.**
>
> The existing Stash functionality remains the working foundation while Hoard develops a new interface and gradually expands into a general-purpose home media server. Expect ongoing changes, incomplete Hoard-specific branding, and development builds that may not yet be suitable for irreplaceable libraries.

## What is Hoard?

Hoard is an open-source, self-hosted media server designed to help you take control of a growing personal media collection.

It aims to provide one private, coherent system for discovering, organizing, enriching, and serving the media stored in your home—without requiring that your collection fit a single commercial service, content category, or cloud platform.

Hoard begins with strong support for video and image collections and is intended to grow toward a broader range of home media, including:

* films and episodic video
* personal, archival, and independently produced video
* photography and image collections
* music and other audio
* specialist and enthusiast libraries
* mature and adult media

Adult media will remain supported, but it will be treated as one kind of personal media rather than the identity of the entire application.

A hoard is not merely a pile of files. It is a collection kept because it matters.

## Built from Stash

Hoard is an independent fork of [Stash](https://github.com/stashapp/stash), an established open-source application for organizing and serving video and image collections.

Stash provides Hoard with a substantial and proven foundation, including:

* a Go media server
* filesystem scanning and reconciliation
* video and image management
* metadata, tags, performers, studios, galleries, and groups
* browser-based media playback
* thumbnails, previews, sprites, and media processing
* FFmpeg integration
* scraping and metadata-provider support
* plugins and community extensions
* a GraphQL API
* SQLite storage
* configuration, tasks, migrations, and backups

Hoard does not intend to discard that work and recreate it badly.

Instead, the project will evolve Stash incrementally: preserving useful capabilities, improving workflows, expanding the supported media domain, and replacing parts only when Hoard has a working alternative.

Hoard is not affiliated with, sponsored by, or endorsed by the Stash project. The Stash name and branding belong to their respective project and contributors.

## The Transition

Hoard will remain usable throughout its development rather than disappearing into a long ground-up rewrite.

The transition begins by adding a new SvelteKit interface alongside the existing Stash interface:

```text
/          Existing Stash interface
/hoard/    New Hoard interface
```

The new interface will be introduced through complete, usable workflows rather than a collection of disconnected replacement screens.

Once it provides sufficient coverage for normal use, the routes can be reversed:

```text
/          Hoard interface
/legacy/   Existing Stash interface
```

The legacy interface will only be removed after Hoard genuinely replaces the capabilities users still need.

Backend changes will follow demonstrated requirements. Hoard will initially continue to use the existing server, database, GraphQL API, media pipeline, plugin system, and configuration model.

## Project Direction

Hoard is moving toward a media server that is:

### Private by default

Your library, metadata, viewing activity, and files should remain under your control. Hoard is designed to run on infrastructure you own or administer.

### Useful for mixed collections

A real home library rarely contains only one kind of media. Hoard should allow different collections to coexist without forcing the entire server to adopt the identity or assumptions of one category.

### Strong at organization

Folders and filenames are not enough for a large collection. Hoard will continue to emphasize metadata, relationships, filtering, tagging, discovery, and curation.

### Pleasant to use

The new interface will prioritize clear workflows, fast navigation, accessibility, keyboard use, responsive layouts, and useful error states. Visual polish matters, but it will not take priority over usability.

### Incrementally developed

Hoard will favour complete vertical slices, small reviewable changes, and working software over speculative rewrites and grand architectural resets.

### Extensible

Existing plugins, scrapers, metadata sources, and APIs are valuable parts of the inherited ecosystem. Compatibility will be preserved where practical while Hoard develops broader extension points over time.

## Current Architecture

| Area                | Technology                                |
| ------------------- | ----------------------------------------- |
| Server              | Go                                        |
| Application API     | GraphQL and existing HTTP media endpoints |
| Database            | SQLite                                    |
| Existing interface  | React and TypeScript                      |
| New Hoard interface | SvelteKit, Svelte 5, and TypeScript       |
| Media processing    | FFmpeg                                    |
| Licence             | GNU AGPL-3.0                              |

The Hoard interface is built as a static client-side application and served by the Go server. It does not require a separate Node.js server in production.

A separate management application may eventually provide process control, health monitoring, logs, backups, configuration, and upgrades. It will remain outside the main server process so that it can continue operating while the media server is stopped or restarted.

## Development Status

Hoard is currently establishing its own identity and frontend while remaining close to upstream Stash.

Near-term work includes:

* introducing Hoard branding without obscuring the project’s origins
* adding the SvelteKit application under `ui/hoard`
* serving the Hoard interface alongside the existing interface
* building the first complete browsing and playback workflows
* establishing typed access to the existing GraphQL API
* retaining straightforward synchronization with upstream Stash
* documenting the path from specialist collection manager to general home media server

The roadmap will be driven by working user flows and real library-management needs. Features listed as future direction should not be assumed to exist until they are implemented and documented.

## Installation

Hoard does not yet have a stable end-user release or independent installation guide.

During the initial transition, much of the build and runtime behaviour remains inherited from Stash. Developers should read:

* [Development documentation](docs/DEVELOPMENT.md)
* [Contributing documentation](docs/CONTRIBUTING.md)
* [Agent and architectural instructions](AGENTS.md)
* [Stash documentation](https://docs.stashapp.cc)

Existing documentation may continue to use the Stash name while the transition is underway.

Do not test development builds against the only copy of an important media library or database. Keep verified backups.

## Contributing

Hoard welcomes thoughtful contributions that support its transition into a broader home media server.

Before beginning a large change:

1. Review [AGENTS.md](AGENTS.md).
2. Search existing issues and discussions.
3. Open an issue describing the user problem and proposed direction.
4. Keep changes focused, testable, and compatible with the current transition stage.

The project values:

* complete user workflows
* red-green-refactor development
* regression tests for bug fixes
* small, coherent commits
* accessibility
* maintainable code
* compatibility with upstream where practical
* honest documentation of incomplete work

Avoid broad rewrites, unrelated formatting changes, premature abstractions, and changes that make upstream synchronization unnecessarily difficult.

## Origin and Attribution

Hoard exists because of the years of design, development, testing, documentation, and community work invested in Stash.

The project gratefully acknowledges the Stash maintainers and contributors whose work forms Hoard’s original foundation.

Hoard preserves the upstream Git history, licence, copyright notices, and appropriate attribution. References to Stash acknowledge that origin and do not imply endorsement of Hoard by the Stash project.

## Licence

Hoard is free and open-source software distributed under the [GNU Affero General Public License v3.0](LICENSE).

You may use, study, modify, and redistribute Hoard under the terms of that licence. Modified versions that are distributed—or made available for users to interact with over a network—must provide the corresponding source code as required by the AGPL-3.0.

New contributions must be compatible with the project’s AGPL-3.0 licensing.

---

<div align="center">

**Hoard is being built for the media you chose to keep.**

[Repository](https://github.com/mkfoss/hoard) · [Issues](https://github.com/mkfoss/hoard/issues) · [Stash Project](https://github.com/stashapp/stash)

</div>
