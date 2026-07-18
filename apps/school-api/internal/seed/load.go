package seed

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/masterofsword/contracts/engines"
)

type fileShape struct {
	Accounts []struct {
		StudentID    string             `json:"studentId"`
		Name         string             `json:"name"`
		Login        string             `json:"login"`
		Password     string             `json:"password"`
		Role         string             `json:"role"`
		CharacterID  string             `json:"characterId"`
		Mastery      map[string]float64 `json:"masteryPointsAsOf"`
		MasteryUnits map[string]int64   `json:"masteryUnits"`
		Ranks        map[string]int     `json:"ranks"`
	} `json:"accounts"`
}

func LoadDemo(p *engines.Platform, root string) (int, error) {
	path := filepath.Join(root, "infra", "local", "seed", "demo-students.json")
	b, err := os.ReadFile(path)
	if err != nil {
		return 0, err
	}
	var data fileShape
	if err := json.Unmarshal(b, &data); err != nil {
		return 0, err
	}
	for _, a := range data.Accounts {
		if _, err := p.CreateCharacter(a.CharacterID, "user-"+a.StudentID); err != nil {
			// already exists on reload — ignore
		}
		role := a.Role
		if role == "" {
			role = engines.RoleStudent
		}
		st := engines.Student{
			ID:          a.StudentID,
			DisplayName: a.Name,
			UserID:      "user-" + a.StudentID,
			CharacterID: a.CharacterID,
			Login:       a.Login,
			Password:    a.Password,
			Role:        role,
			Mastery:     map[string]int64{},
			Ranks:       map[string]int{},
		}
		for k, v := range a.MasteryUnits {
			st.Mastery[k] = v
		}
		for k, v := range a.Ranks {
			st.Ranks[k] = v
		}
		p.UpsertStudent(st)
		for alias, pts := range a.Mastery {
			_ = p.ApplyMasterySnapshot(a.StudentID, alias, pts)
		}
	}
	return len(data.Accounts), nil
}

func FindRoot() string {
	wd, _ := os.Getwd()
	for d := wd; d != filepath.Dir(d); d = filepath.Dir(d) {
		if _, err := os.Stat(filepath.Join(d, "015-platform-development-agent-spec.md")); err == nil {
			return d
		}
	}
	return wd
}

func MustLoad(p *engines.Platform) {
	n, err := LoadDemo(p, FindRoot())
	if err != nil {
		fmt.Fprintf(os.Stderr, "seed warning: %v\n", err)
		return
	}
	fmt.Printf("loaded %d demo students\n", n)
}
