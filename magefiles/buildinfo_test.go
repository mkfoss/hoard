package main

import (
	"strings"
	"testing"
)

func TestLdflagsStampsEveryBuildVariable(t *testing.T) {
	got := ldflags(buildInfo{
		Date:          "2026-07-26 12:00:00",
		GitHash:       "abc1234",
		Version:       "v0.31.1-150-gdeadbee",
		OfficialBuild: false,
	})

	// These paths must match internal/build. A typo here produces a binary that
	// reports an empty version rather than failing the build.
	want := []string{
		"-X 'github.com/stashapp/stash/internal/build.buildstamp=2026-07-26 12:00:00'",
		"-X 'github.com/stashapp/stash/internal/build.githash=abc1234'",
		"-X 'github.com/stashapp/stash/internal/build.version=v0.31.1-150-gdeadbee'",
		"-X 'github.com/stashapp/stash/internal/build.officialBuild=false'",
	}
	for _, w := range want {
		if !strings.Contains(got, w) {
			t.Errorf("ldflags missing %q\ngot: %s", w, got)
		}
	}
}

func TestLdflagsMarksOfficialBuilds(t *testing.T) {
	got := ldflags(buildInfo{OfficialBuild: true})

	if !strings.Contains(got, "internal/build.officialBuild=true'") {
		t.Errorf("official build not stamped, got: %s", got)
	}
}

func TestLdflagsOmitsUpdateRepoWhenUnset(t *testing.T) {
	got := ldflags(buildInfo{})

	if strings.Contains(got, "updateRepo") {
		t.Errorf("updateRepo should be omitted when empty, got: %s", got)
	}
}

func TestLdflagsIncludesUpdateRepoWhenSet(t *testing.T) {
	got := ldflags(buildInfo{UpdateRepo: "https://example.com/repo"})

	if !strings.Contains(got, "internal/build.updateRepo=https://example.com/repo'") {
		t.Errorf("updateRepo not stamped, got: %s", got)
	}
}

// The build variables carry values with spaces (the build date). Losing the
// quoting silently truncates the stamp.
func TestLdflagsQuotesEachVariable(t *testing.T) {
	got := ldflags(buildInfo{Date: "2026-07-26 12:00:00"})

	if !strings.Contains(got, "'github.com/stashapp/stash/internal/build.buildstamp=2026-07-26 12:00:00'") {
		t.Errorf("build date not quoted as a single argument, got: %s", got)
	}
}

func TestCleanPathsCoverBuildOutput(t *testing.T) {
	paths := cleanPaths()

	for _, want := range []string{"bin", "dist", "ui/v2.5/build", "ui/hoard/build"} {
		if !contains(paths, want) {
			t.Errorf("clean does not remove %q; got %v", want, paths)
		}
	}
}

func TestBinaryPathPutsBinariesInBin(t *testing.T) {
	if got := binaryPath("hoard", false); got != "bin/hoard" {
		t.Errorf("binaryPath = %q, want bin/hoard", got)
	}
}

func TestBinaryPathAddsExeOnWindows(t *testing.T) {
	if got := binaryPath("hoard", true); got != "bin/hoard.exe" {
		t.Errorf("binaryPath = %q, want bin/hoard.exe", got)
	}
}

// The binary is named after the project, not after upstream.
func TestBinaryNameIsHoard(t *testing.T) {
	if binaryPath(serverBinary, false) != "bin/hoard" {
		t.Errorf("server binary should be bin/hoard, got %q", binaryPath(serverBinary, false))
	}
}

// Removing a source or dependency directory would be destructive, not cleaning.
func TestCleanPathsLeaveSourcesAlone(t *testing.T) {
	paths := cleanPaths()

	for _, forbidden := range []string{"ui/hoard/src", "ui/v2.5/src", "internal", "pkg", "."} {
		if contains(paths, forbidden) {
			t.Errorf("clean must not remove %q", forbidden)
		}
	}
}

// Clean joins each path onto the repository root and calls RemoveAll. An entry
// that resolves to the root itself would delete the whole checkout, so the guard
// matters more than the current contents of the list.
func TestSafeToRemoveRejectsAnythingResolvingToTheRoot(t *testing.T) {
	for _, dangerous := range []string{"", ".", "/", "./", "..", "../sibling", "ui/../.."} {
		if err := safeToRemove(dangerous); err == nil {
			t.Errorf("safeToRemove(%q) allowed removal; want an error", dangerous)
		}
	}
}

func TestSafeToRemoveAllowsBuildOutput(t *testing.T) {
	for _, p := range cleanPaths() {
		if err := safeToRemove(p); err != nil {
			t.Errorf("safeToRemove(%q) = %v; every cleanPaths entry must be removable", p, err)
		}
	}
}

func contains(haystack []string, needle string) bool {
	for _, h := range haystack {
		if h == needle {
			return true
		}
	}
	return false
}
