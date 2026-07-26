package main

import (
	"fmt"
	"path"
	"path/filepath"
	"strings"
)

// buildVarPrefix is the Go package holding the variables stamped into the binary.
const buildVarPrefix = "github.com/stashapp/stash/internal/build"

const (
	// binDir collects build output, keeping the repository root clean.
	binDir = "bin"

	// serverBinary is the Hoard server. The Go module path is still upstream's,
	// but the artefact this project produces carries the project's own name.
	serverBinary = "hoard"

	// phasherBinary is the perceptual-hashing helper, name unchanged from upstream.
	phasherBinary = "phasher"
)

// binaryPath returns a built binary's path relative to the repository root.
//
// windows is passed in rather than read from runtime so the naming rule is
// testable on any host.
func binaryPath(name string, windows bool) string {
	if windows {
		name += ".exe"
	}
	return binDir + "/" + name
}

// buildInfo is the version metadata stamped into a binary at link time.
//
// It mirrors the Makefile's build-info/build-flags targets. If those change
// upstream, change these together — a mismatch produces a binary that reports an
// empty version rather than failing to build.
type buildInfo struct {
	Date          string
	GitHash       string
	Version       string
	OfficialBuild bool
	// UpdateRepo is optional; the Makefile only stamps it when set.
	UpdateRepo string
}

// ldflags renders the -ldflags value for a build.
//
// Each variable is single-quoted because values contain spaces (the build date);
// unquoted, the link step would silently take only the first word.
func ldflags(info buildInfo) string {
	flags := []string{
		fmt.Sprintf("-X '%s.buildstamp=%s'", buildVarPrefix, info.Date),
		fmt.Sprintf("-X '%s.githash=%s'", buildVarPrefix, info.GitHash),
		fmt.Sprintf("-X '%s.version=%s'", buildVarPrefix, info.Version),
		fmt.Sprintf("-X '%s.officialBuild=%t'", buildVarPrefix, info.OfficialBuild),
	}

	if info.UpdateRepo != "" {
		flags = append(flags, fmt.Sprintf("-X '%s.updateRepo=%s'", buildVarPrefix, info.UpdateRepo))
	}

	return strings.Join(flags, " ")
}

// safeToRemove rejects a clean path that does not stay strictly inside the
// repository.
//
// Clean joins these onto the repository root and calls RemoveAll, so an empty or
// upward-traversing entry would delete the checkout, or worse. Cheap to check and
// catastrophic to get wrong, so it is checked rather than assumed.
func safeToRemove(p string) error {
	if strings.TrimSpace(p) == "" {
		return fmt.Errorf("refusing to remove an empty path")
	}
	if filepath.IsAbs(p) {
		return fmt.Errorf("refusing to remove %q: must be relative to the repository root", p)
	}

	cleaned := path.Clean(filepath.ToSlash(p))
	if cleaned == "." {
		return fmt.Errorf("refusing to remove %q: resolves to the repository root", p)
	}
	if cleaned == ".." || strings.HasPrefix(cleaned, "../") {
		return fmt.Errorf("refusing to remove %q: escapes the repository", p)
	}

	return nil
}

// cleanPaths lists what Clean removes, relative to the repository root.
//
// Only build output and generated artefacts — never sources, and never
// node_modules, which is expensive to rebuild and belongs to the package manager.
func cleanPaths() []string {
	return []string{
		binDir,
		"dist",
		"ui/v2.5/build",
		"ui/hoard/build",
		"ui/hoard/.svelte-kit",
		"ui/hoard/src/lib/api/generated",
		"ui/hoard/playwright-report",
		"ui/hoard/test-results",
	}
}
