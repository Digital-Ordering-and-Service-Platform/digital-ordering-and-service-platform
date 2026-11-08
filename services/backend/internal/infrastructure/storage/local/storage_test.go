package local

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io/fs"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestPutOpenDeleteAndRestrictivePermissions(t *testing.T) {
	root := t.TempDir()
	store, err := New(root)
	if err != nil {
		t.Fatal(err)
	}
	object, err := store.Put(context.Background(), strings.NewReader("voice data"))
	if err != nil {
		t.Fatal(err)
	}
	expected := sha256.Sum256([]byte("voice data"))
	if object.Size != 10 || object.SHA256 != hex.EncodeToString(expected[:]) {
		t.Fatalf("unexpected metadata: %+v", object)
	}
	info, err := os.Stat(filepath.Join(root, object.Key))
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Fatalf("stored mode = %o, want 600", info.Mode().Perm())
	}
	file, err := store.Open(context.Background(), object.Key)
	if err != nil {
		t.Fatal(err)
	}
	contents, err := io.ReadAll(file)
	_ = file.Close()
	if err != nil {
		t.Fatal(err)
	}
	if string(contents) != "voice data" {
		t.Fatalf("contents = %q", contents)
	}
	if err := store.Delete(context.Background(), object.Key); err != nil {
		t.Fatal(err)
	}
	if _, err := store.Open(context.Background(), object.Key); !errors.Is(err, fs.ErrNotExist) {
		t.Fatalf("open after delete error = %v, want not exist", err)
	}
}

func TestRejectsTraversalAndSymlinkObjects(t *testing.T) {
	root := t.TempDir()
	store, err := New(root)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := store.Open(context.Background(), "../../etc/passwd"); err == nil {
		t.Fatal("accepted traversal key")
	}
	outside := filepath.Join(t.TempDir(), "secret")
	if err := os.WriteFile(outside, []byte("secret"), 0o600); err != nil {
		t.Fatal(err)
	}
	key := "00000000-0000-4000-8000-000000000001"
	if err := os.Symlink(outside, filepath.Join(root, key)); err != nil {
		t.Fatal(err)
	}
	if _, err := store.Open(context.Background(), key); err == nil {
		t.Fatal("followed symlink media object")
	}
	if err := store.Delete(context.Background(), key); err == nil {
		t.Fatal("deleted symlink target")
	}
}

func TestCanceledAndInsecureRootsAreRejected(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	store, err := New(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	if _, err := store.Put(ctx, strings.NewReader("data")); err == nil {
		t.Fatal("Put ignored canceled context")
	}
	root := t.TempDir()
	if err := os.Chmod(root, 0o755); err != nil {
		t.Fatal(err)
	}
	secured, err := New(root)
	if err != nil {
		t.Fatal(err)
	}
	info, err := os.Stat(secured.root)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0o700 {
		t.Fatalf("storage root mode = %o, want 700", info.Mode().Perm())
	}
}
