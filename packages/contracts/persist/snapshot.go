package persist

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/masterofsword/contracts/engines"
)

var saveMu sync.Mutex

// SavePlatform writes a JSON snapshot of mutable platform + school state.
func SavePlatform(p *engines.Platform, path string) error {
	if p == nil || path == "" {
		return fmt.Errorf("platform and path required")
	}
	snap := p.ExportSnapshot()
	saveMu.Lock()
	defer saveMu.Unlock()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	b, err := json.MarshalIndent(snap, "", "  ")
	if err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, b, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

// LoadPlatform restores snapshot over an initialized platform (after seed).
func LoadPlatform(p *engines.Platform, path string) error {
	if p == nil || path == "" {
		return fmt.Errorf("platform and path required")
	}
	b, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var snap engines.PlatformSnapshot
	if err := json.Unmarshal(b, &snap); err != nil {
		return err
	}
	p.RestoreSnapshot(snap)
	return nil
}
