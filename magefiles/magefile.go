//go:build mage

// Common Hoard development tasks. Run `mage` with no arguments to list them.
//
// Sits alongside the Makefile, which stays authoritative for cross-compilation
// and release packaging. There is deliberately no Default target: mage prints the
// target list when none is declared.
package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/magefile/mage/mg"
	"github.com/magefile/mage/sh"
)

// Deps installs the frontend dependencies for both UIs. Run once after cloning.
func Deps() error {
	for _, ui := range []string{"ui/v2.5", "ui/hoard"} {
		if err := inDir(ui, "pnpm", "install", "--frozen-lockfile"); err != nil {
			return err
		}
	}
	return nil
}

// Generate regenerates all generated code: Go, and both UIs' GraphQL types.
func Generate() error {
	mg.Deps(GenerateBackend)
	return GenerateUI()
}

// GenerateBackend regenerates the Go GraphQL code. Needs no frontend build.
func GenerateBackend() error {
	if err := touchUI(); err != nil {
		return err
	}
	return inDir(".", "go", "generate", "./cmd/stash")
}

// GenerateUI regenerates the GraphQL types for both UIs.
func GenerateUI() error {
	if err := inDir("ui/v2.5", "pnpm", "run", "gqlgen"); err != nil {
		return err
	}
	return inDir("ui/hoard", "pnpm", "run", "codegen")
}

// UI builds both frontends. Requires Deps and Generate to have been run.
func UI() error {
	mg.Deps(UIClassic, UIHoard)
	return inDir(".", "go", "generate", "./ui")
}

// UIClassic builds the legacy React interface served at /.
func UIClassic() error {
	return inDir("ui/v2.5", "pnpm", "run", "build")
}

// UIHoard builds the Hoard interface served at /hoard.
func UIHoard() error {
	return inDir("ui/hoard", "pnpm", "run", "build")
}

// Build compiles the Hoard server into ./bin/hoard. Build the UI first, or the
// embedded assets will be whatever was last built.
func Build() error {
	return goBuild(serverBinary, "./cmd/stash")
}

// Phasher compiles the perceptual-hashing helper into ./bin/phasher.
func Phasher() error {
	return goBuild(phasherBinary, "./cmd/phasher")
}

// goBuild compiles pkg into ./bin, creating the directory if needed since
// `go build -o` will not create a missing parent.
func goBuild(name, pkg string) error {
	root, err := repoRoot()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Join(root, binDir), 0o755); err != nil {
		return fmt.Errorf("creating %s: %w", binDir, err)
	}

	out := binaryPath(name, isWindows())
	if err := inDir(".", "go", "build", "-o", out,
		"-v", "-ldflags", ldflags(currentBuildInfo()), pkg); err != nil {
		return err
	}

	fmt.Println("built", out)
	return nil
}

// Test runs the Go unit tests.
func Test() error {
	return inDir(".", "go", "test", "./...")
}

// IT runs the Go unit and integration tests.
func IT() error {
	return inDir(".", "go", "test", "-tags", "integration", "./...")
}

// Lint runs golangci-lint over the Go sources.
func Lint() error {
	return inDir(".", "golangci-lint", "run")
}

// Fmt formats the Go sources and both frontends.
func Fmt() error {
	if err := inDir(".", "go", "fmt", "./..."); err != nil {
		return err
	}
	if err := inDir("ui/v2.5", "pnpm", "run", "format"); err != nil {
		return err
	}
	return inDir("ui/hoard", "pnpm", "run", "format")
}

// ValidateHoard type-checks, lints and tests the Hoard UI, including Playwright.
func ValidateHoard() error {
	if err := inDir("ui/hoard", "pnpm", "run", "check"); err != nil {
		return err
	}
	if err := inDir("ui/hoard", "pnpm", "run", "lint"); err != nil {
		return err
	}
	if err := inDir("ui/hoard", "pnpm", "run", "test"); err != nil {
		return err
	}
	return inDir("ui/hoard", "pnpm", "run", "test:e2e")
}

// Validate runs everything required for a pull request to be accepted.
func Validate() error {
	mg.SerialDeps(Lint, IT, ValidateHoard)
	return inDir("ui/v2.5", "pnpm", "run", "validate")
}

// Clean removes build output and generated artefacts, leaving sources and
// node_modules alone.
func Clean() error {
	root, err := repoRoot()
	if err != nil {
		return err
	}

	for _, p := range cleanPaths() {
		if err := safeToRemove(p); err != nil {
			return err
		}

		target := filepath.Join(root, filepath.FromSlash(p))
		if err := os.RemoveAll(target); err != nil {
			return fmt.Errorf("removing %s: %w", p, err)
		}
		fmt.Println("removed", p)
	}
	return nil
}

// touchUI creates placeholder UI build output so //go:embed in ui/ui.go compiles
// without a real frontend build, mirroring the Makefile's touch-ui target.
func touchUI() error {
	root, err := repoRoot()
	if err != nil {
		return err
	}

	for dir, file := range map[string]string{
		"ui/v2.5/build":  "index.html",
		"ui/hoard/build": "200.html",
	} {
		full := filepath.Join(root, filepath.FromSlash(dir))
		if err := os.MkdirAll(full, 0o755); err != nil {
			return err
		}
		placeholder := filepath.Join(full, file)
		if _, err := os.Stat(placeholder); os.IsNotExist(err) {
			if err := os.WriteFile(placeholder, nil, 0o644); err != nil {
				return err
			}
		}
	}
	return nil
}

// inDir runs a command in a path relative to the repository root, streaming its
// output, so mage behaves like make regardless of where it was invoked from.
func inDir(dir string, cmd string, args ...string) error {
	root, err := repoRoot()
	if err != nil {
		return err
	}

	c := exec.Command(cmd, args...)
	c.Dir = filepath.Join(root, filepath.FromSlash(dir))
	c.Stdout = os.Stdout
	c.Stderr = os.Stderr
	c.Stdin = os.Stdin

	if mg.Verbose() {
		fmt.Printf("[%s] %s %s\n", dir, cmd, strings.Join(args, " "))
	}

	return c.Run()
}

// repoRoot resolves the repository root so targets work from any subdirectory.
func repoRoot() (string, error) {
	out, err := sh.Output("git", "rev-parse", "--show-toplevel")
	if err != nil {
		return "", fmt.Errorf("locating repository root: %w", err)
	}
	return strings.TrimSpace(out), nil
}

// gitOutput returns trimmed git output, or an empty string when git fails, so a
// build outside a checkout still succeeds with unstamped version metadata.
func gitOutput(args ...string) string {
	out, err := sh.Output("git", args...)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(out)
}

// currentBuildInfo collects version metadata, letting the environment override
// each value exactly as the Makefile does, so CI and release builds can pin them.
func currentBuildInfo() buildInfo {
	return buildInfo{
		// Same format and semantics as the Makefile's scripts/getDate.go: the
		// moment of the build, not of the last commit.
		Date:          envOr("BUILD_DATE", func() string { return time.Now().Format("2006-01-02 15:04:05") }),
		GitHash:       envOr("GITHASH", func() string { return gitOutput("rev-parse", "--short", "HEAD") }),
		Version:       envOr("STASH_VERSION", func() string { return gitOutput("describe", "--tags", "--exclude", "latest_develop") }),
		OfficialBuild: os.Getenv("OFFICIAL_BUILD") == "true",
		UpdateRepo:    os.Getenv("UPDATE_REPO"),
	}
}

// envOr returns the environment variable if set, otherwise the fallback's result.
func envOr(key string, fallback func() string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return fallback()
}
