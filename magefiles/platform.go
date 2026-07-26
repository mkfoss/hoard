package main

import "runtime"

// isWindows reports whether the host needs .exe suffixes on binaries.
func isWindows() bool {
	return runtime.GOOS == "windows"
}
