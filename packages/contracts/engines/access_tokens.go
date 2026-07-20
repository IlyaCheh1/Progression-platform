package engines

import (
	"encoding/json"
	"time"
)

// AccessTokenMap is a JSON-compatible token → session map.
// Legacy snapshots stored map[string]string (token → studentId); those are
// upgraded on load with a fresh AccessTokenTTL expiry.
type AccessTokenMap map[string]AccessTokenSession

func (m AccessTokenMap) MarshalJSON() ([]byte, error) {
	if m == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(map[string]AccessTokenSession(m))
}

func (m *AccessTokenMap) UnmarshalJSON(data []byte) error {
	if len(data) == 0 || string(data) == "null" {
		*m = AccessTokenMap{}
		return nil
	}

	var asObjects map[string]AccessTokenSession
	if err := json.Unmarshal(data, &asObjects); err == nil {
		legacyEmpty := true
		for _, sess := range asObjects {
			if sess.StudentID != "" {
				legacyEmpty = false
				break
			}
		}
		if !legacyEmpty || len(asObjects) == 0 {
			out := make(AccessTokenMap, len(asObjects))
			fallbackExp := time.Now().UTC().Add(AccessTokenTTL)
			for token, sess := range asObjects {
				if sess.ExpiresAt.IsZero() {
					sess.ExpiresAt = fallbackExp
				}
				out[token] = sess
			}
			*m = out
			return nil
		}
	}

	var asStrings map[string]string
	if err := json.Unmarshal(data, &asStrings); err != nil {
		return err
	}
	out := make(AccessTokenMap, len(asStrings))
	exp := time.Now().UTC().Add(AccessTokenTTL)
	for token, sid := range asStrings {
		out[token] = AccessTokenSession{StudentID: sid, ExpiresAt: exp}
	}
	*m = out
	return nil
}
