package engines

var rankTitleKeys = map[int]string{
	1: "school.fencing.title.student",
	2: "school.fencing.title.marozzo_student",
	3: "school.fencing.title.steadfast",
	4: "school.fencing.title.companion",
	5: "school.fencing.title.weapon_master",
	6: "school.fencing.title.eight_paths",
	7: "school.fencing.title.master_of_sword",
	8: "school.fencing.title.master_of_sword",
}

func titleItemKey(refID string) string {
	return "title:" + refID
}

func (p *Platform) grantTitleForRankFromSchool(studentID string, rank int) {
	key, ok := rankTitleKeys[rank]
	if !ok || key == "" {
		return
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	p.grantTitleHoldingLocked(studentID, key)
}

func (p *Platform) grantTitleHoldingLocked(studentID, refID string) {
	if studentID == "" || refID == "" {
		return
	}
	bag, ok := p.holdings[studentID]
	if !ok {
		bag = make(map[string]InventoryHolding)
		p.holdings[studentID] = bag
	}
	itemKey := titleItemKey(refID)
	if _, exists := bag[itemKey]; exists {
		return
	}
	bag[itemKey] = InventoryHolding{Key: itemKey, Kind: InventoryKindTitle, RefID: refID}
}

func (p *Platform) ownsTitleLocked(studentID, refID string) bool {
	bag, ok := p.holdings[studentID]
	if !ok {
		return false
	}
	_, ok = bag[titleItemKey(refID)]
	return ok
}
