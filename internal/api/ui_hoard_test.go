package api

import (
	"io/fs"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
)

const (
	fallbackBody = "<!doctype html><title>Hoard</title>"
	scriptBody   = "export const hoard = 1;"
)

func testHoardFS() fs.ReadDirFS {
	return fstest.MapFS{
		"200.html":                        {Data: []byte(fallbackBody)},
		"robots.txt":                      {Data: []byte("User-agent: *")},
		"_app/immutable/entry/app.abc.js": {Data: []byte(scriptBody)},
	}
}

// get issues a request through the handler and returns the recorded response.
func get(t *testing.T, h http.Handler, target string) *httptest.ResponseRecorder {
	t.Helper()

	w := httptest.NewRecorder()
	h.ServeHTTP(w, httptest.NewRequest(http.MethodGet, target, nil))

	return w
}

func TestHoardUIHandlerServesFallbackForAppRoutes(t *testing.T) {
	h := hoardUIHandler(hoardEndpoint, testHoardFS(), nil)

	// StripSlashes middleware turns "/hoard/" into "/hoard" before we see it, so
	// both the bare mount point and deep client routes must reach the SPA.
	for _, target := range []string{"/hoard", "/hoard/", "/hoard/about", "/hoard/scenes/42"} {
		t.Run(target, func(t *testing.T) {
			w := get(t, h, target)

			if w.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
			}
			if got := w.Body.String(); got != fallbackBody {
				t.Errorf("body = %q, want the SPA fallback document", got)
			}
			if ct := w.Header().Get("Content-Type"); !strings.HasPrefix(ct, "text/html") {
				t.Errorf("Content-Type = %q, want text/html", ct)
			}
		})
	}
}

func TestHoardUIHandlerServesRealFiles(t *testing.T) {
	h := hoardUIHandler(hoardEndpoint, testHoardFS(), nil)

	w := get(t, h, "/hoard/robots.txt")

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}
	if got := w.Body.String(); got != "User-agent: *" {
		t.Errorf("body = %q, want the real file contents", got)
	}
}

func TestHoardUIHandlerMarksHashedAssetsImmutable(t *testing.T) {
	h := hoardUIHandler(hoardEndpoint, testHoardFS(), nil)

	w := get(t, h, "/hoard/_app/immutable/entry/app.abc.js")

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}
	if got := w.Body.String(); got != scriptBody {
		t.Errorf("body = %q, want the asset contents", got)
	}
	if cc := w.Header().Get("Cache-Control"); !strings.Contains(cc, "immutable") {
		t.Errorf("Cache-Control = %q, want it to mark hashed assets immutable", cc)
	}
}

// A missing asset must 404 rather than fall back to the SPA document. Returning
// HTML for a missing script tells the browser nothing useful and turns a build
// problem into a confusing parse error.
func TestHoardUIHandlerDoesNotFallBackForMissingAssets(t *testing.T) {
	h := hoardUIHandler(hoardEndpoint, testHoardFS(), nil)

	w := get(t, h, "/hoard/_app/immutable/entry/gone.xyz.js")

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

// r.URL.Path is percent-decoded, so a crafted request can present ".." segments
// to the handler. io/fs rejects them, but assert it rather than assume it: this
// is the boundary between an untrusted URL and a filesystem read.
func TestHoardUIHandlerRejectsPathTraversal(t *testing.T) {
	h := hoardUIHandler(hoardEndpoint, testHoardFS(), nil)

	for _, target := range []string{
		"/hoard/../../etc/passwd.txt",
		"/hoard/_app/../../../etc/passwd.txt",
		"/hoard//etc/passwd.txt",
	} {
		t.Run(target, func(t *testing.T) {
			w := get(t, h, target)

			if w.Code == http.StatusOK {
				t.Errorf("status = 200 for %q, want a failure; body = %q", target, w.Body.String())
			}
		})
	}
}

func TestHoardUIHandlerAppliesPageHeadersToDocumentsOnly(t *testing.T) {
	var marked []string
	onHTML := func(w http.ResponseWriter, r *http.Request) {
		marked = append(marked, r.URL.Path)
	}

	h := hoardUIHandler(hoardEndpoint, testHoardFS(), onHTML)

	get(t, h, "/hoard/about")
	get(t, h, "/hoard/_app/immutable/entry/app.abc.js")
	get(t, h, "/hoard/robots.txt")

	if len(marked) != 1 || marked[0] != "/hoard/about" {
		t.Errorf("page headers applied to %v, want only the HTML document", marked)
	}
}
