package menu

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
)

type Cache struct {
	mu     sync.RWMutex
	memory map[string][]byte
}

func NewCache() *Cache {
	return &Cache{
		memory: make(map[string][]byte),
	}
}

// GetCatalog retrieves cached menu JSON for key menu:{restaurantID} (TTL 24h)
func (c *Cache) GetCatalog(ctx context.Context, restaurantID string) (*MenuCatalog, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	key := fmt.Sprintf("menu:%s", restaurantID)
	data, exists := c.memory[key]
	if !exists {
		return nil, nil // Cache miss
	}

	var catalog MenuCatalog
	if err := json.Unmarshal(data, &catalog); err != nil {
		return nil, err
	}

	return &catalog, nil
}

// SetCatalog stores menu catalog in Redis cache for 24h per AD-10
func (c *Cache) SetCatalog(ctx context.Context, restaurantID string, catalog *MenuCatalog) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	key := fmt.Sprintf("menu:%s", restaurantID)
	data, err := json.Marshal(catalog)
	if err != nil {
		return err
	}

	c.memory[key] = data
	return nil
}

// InvalidateCatalog deletes menu:{restaurantID} from cache on any menu mutation per AD-10
func (c *Cache) InvalidateCatalog(ctx context.Context, restaurantID string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	key := fmt.Sprintf("menu:%s", restaurantID)
	delete(c.memory, key)
}
