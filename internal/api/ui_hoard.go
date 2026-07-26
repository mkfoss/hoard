package api

import (
	"io/fs"
	"net/http"
	"path"
	"strings"

	"github.com/stashapp/stash/pkg/utils"
	"github.com/vearutop/statigz"
)

const (
	// hoardEndpoint is where the Hoard UI is mounted. It is deliberately not the
	// site root: the legacy interface keeps "/" until Hoard covers the workflows
	// people rely on.
	hoardEndpoint = "/hoard"

	// hoardFallbackDocument is written by @sveltejs/adapter-static and is what
	// every client-side route resolves to.
	hoardFallbackDocument = "200.html"

	// hoardImmutableDir holds content-hashed assets, safe to cache forever.
	hoardImmutableDir = "/_app/immutable/"
)

// hoardUIHandler serves the Hoard single-page app from uiFS, mounted at prefix.
//
// Requests naming a file extension are served from uiFS and 404 when missing.
// Everything else is a client-side route and is answered with the SPA fallback
// document, so a hard refresh on a deep link still loads the app.
//
// onHTML, when non-nil, is called before writing an HTML document, so the caller
// can apply page security headers without this handler depending on plugin or
// config state.
func hoardUIHandler(prefix string, uiFS fs.ReadDirFS, onHTML func(http.ResponseWriter, *http.Request)) http.Handler {
	static := statigz.FileServer(uiFS)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Path relative to the mount point. StripSlashes has already reduced a
		// trailing slash, so "/hoard" and "/hoard/" both arrive as an empty rest.
		rest := strings.TrimPrefix(r.URL.Path, prefix)

		if path.Ext(rest) == "" {
			if onHTML != nil {
				onHTML(w, r)
			}

			serveHoardFallback(w, r, uiFS)
			return
		}

		if strings.HasPrefix(rest, hoardImmutableDir) {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			w.Header().Set("Cache-Control", "no-cache")
		}

		// statigz resolves against the root of uiFS, so hand it the relative path.
		r2 := r.Clone(r.Context())
		r2.URL.Path = rest
		static.ServeHTTP(w, r2)
	})
}

func serveHoardFallback(w http.ResponseWriter, r *http.Request, uiFS fs.FS) {
	data, err := fs.ReadFile(uiFS, hoardFallbackDocument)
	if err != nil {
		// The UI was not built into the binary. Say so plainly rather than
		// serving an empty page that looks like an application bug.
		http.Error(w, "Hoard UI is not available in this build", http.StatusNotFound)
		return
	}

	// ServeStaticContent sets Cache-Control and an ETag, and honours conditional
	// requests. It leaves an already-set Content-Type alone.
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	utils.ServeStaticContent(w, r, data)
}
