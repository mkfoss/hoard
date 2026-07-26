//go:generate go run -tags=dev ../scripts/generateLoginLocales.go
package ui

import (
	"embed"
	"io/fs"
	"runtime"
)

//go:embed v2.5/build
var uiBox embed.FS
var UIBox fs.FS

//go:embed login
var loginUIBox embed.FS
var LoginUIBox fs.FS

// The Hoard UI is a static SPA served at /hoard. Its build output contains
// hashed asset filenames beginning with an underscore, which the default embed
// pattern skips, hence the all: prefix.
//
//go:embed all:hoard/build
var hoardUIBox embed.FS

// HoardUIBox holds the built Hoard UI. Run `make ui-hoard` to populate it;
// `make touch-ui` writes a placeholder so backend-only builds still compile.
var HoardUIBox fs.FS

func init() {
	var err error
	UIBox, err = fs.Sub(uiBox, "v2.5/build")
	if err != nil {
		panic(err)
	}

	LoginUIBox, err = fs.Sub(loginUIBox, "login")
	if err != nil {
		panic(err)
	}

	HoardUIBox, err = fs.Sub(hoardUIBox, "hoard/build")
	if err != nil {
		panic(err)
	}
}

type faviconProvider struct{}

var FaviconProvider = faviconProvider{}

func (p *faviconProvider) GetFavicon() []byte {
	if runtime.GOOS == "windows" {
		ret, _ := fs.ReadFile(UIBox, "favicon.ico")
		return ret
	}

	return p.GetFaviconPng()
}

func (p *faviconProvider) GetFaviconPng() []byte {
	ret, _ := fs.ReadFile(UIBox, "favicon.png")
	return ret
}
