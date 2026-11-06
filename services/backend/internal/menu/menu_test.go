package menu_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	internalmenu "menuflow/backend/internal/menu"
)

func TestMenuCRUDAndRedisCacheInvalidation(t *testing.T) {
	repo := internalmenu.NewMemoryRepository()
	cache := internalmenu.NewCache()
	handler := internalmenu.NewHandler(repo, cache)

	// 1. Create Category
	catPayload := internalmenu.MenuCategory{
		NameEN:    "Traditional Meals",
		NameAM:    "የባህል ምግቦች",
		SortOrder: 1,
	}
	catBody, _ := json.Marshal(catPayload)
	reqCat := httptest.NewRequest(http.MethodPost, "/api/v1/admin/menu/categories", bytes.NewReader(catBody))
	recCat := httptest.NewRecorder()

	handler.HandleCreateCategory(recCat, reqCat)

	if recCat.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created for category, got %d", recCat.Code)
	}

	var createdCat internalmenu.MenuCategory
	json.Unmarshal(recCat.Body.Bytes(), &createdCat)

	// 2. Create Item with Add-ons
	itemPayload := internalmenu.MenuItem{
		CategoryID:      createdCat.ID,
		NameEN:          "Special Shekla Tibs",
		NameAM:          "የሸክላ ጥብስ",
		DescriptionEN:   "Sizzling prime beef",
		DescriptionAM:   "በሸክላ የተጠበሰ",
		Price:           480.00,
		PrepTimeMinutes: 15,
		AllergenTags:    []string{"Dairy"},
		Options: []internalmenu.ItemOption{
			{NameEN: "Extra Injera", NameAM: "ተጨማሪ እንጀራ", PriceDelta: 30.0, Type: "addon"},
		},
	}
	itemBody, _ := json.Marshal(itemPayload)
	reqItem := httptest.NewRequest(http.MethodPost, "/api/v1/admin/menu/items", bytes.NewReader(itemBody))
	recItem := httptest.NewRecorder()

	handler.HandleCreateItem(recItem, reqItem)

	if recItem.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created for item, got %d", recItem.Code)
	}

	// 3. Test Guest Menu Cache Miss then Cache Hit
	reqGuest1 := httptest.NewRequest(http.MethodGet, "/api/v1/guest/menu?restaurant_id=01J8RESTAURANT000000000001", nil)
	recGuest1 := httptest.NewRecorder()
	handler.HandleGetGuestMenu(recGuest1, reqGuest1)

	if recGuest1.Header().Get("X-Cache") != "MISS" {
		t.Errorf("expected cache MISS on first read, got %s", recGuest1.Header().Get("X-Cache"))
	}

	reqGuest2 := httptest.NewRequest(http.MethodGet, "/api/v1/guest/menu?restaurant_id=01J8RESTAURANT000000000001", nil)
	recGuest2 := httptest.NewRecorder()
	handler.HandleGetGuestMenu(recGuest2, reqGuest2)

	if recGuest2.Header().Get("X-Cache") != "HIT" {
		t.Errorf("expected cache HIT on second read, got %s", recGuest2.Header().Get("X-Cache"))
	}

	// 4. Test Bulk Price Update & Cache Invalidation
	bulkPayload := internalmenu.BulkPriceUpdateRequest{
		AdjustmentPercent: 10.0, // 10% price increase
	}
	bulkBody, _ := json.Marshal(bulkPayload)
	reqBulk := httptest.NewRequest(http.MethodPost, "/api/v1/admin/menu/prices/bulk", bytes.NewReader(bulkBody))
	recBulk := httptest.NewRecorder()

	handler.HandleBulkPrices(recBulk, reqBulk)

	if recBulk.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK for bulk price update, got %d", recBulk.Code)
	}

	// 5. Verify Cache Invalidated
	reqGuest3 := httptest.NewRequest(http.MethodGet, "/api/v1/guest/menu?restaurant_id=01J8RESTAURANT000000000001", nil)
	recGuest3 := httptest.NewRecorder()
	handler.HandleGetGuestMenu(recGuest3, reqGuest3)

	if recGuest3.Header().Get("X-Cache") != "MISS" {
		t.Errorf("expected cache MISS after mutation, got %s", recGuest3.Header().Get("X-Cache"))
	}
}
