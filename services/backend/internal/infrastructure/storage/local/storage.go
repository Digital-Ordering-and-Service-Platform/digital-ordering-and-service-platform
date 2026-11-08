// Package local implements protected filesystem media storage.
package local

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/application"
	"github.com/google/uuid"
)

type Storage struct{ root string }

func New(root string) (*Storage, error) {
	if root == "" {
		return nil, errors.New("media storage root is required")
	}
	abs, err := filepath.Abs(root)
	if err != nil {
		return nil, fmt.Errorf("resolve media storage root: %w", err)
	}
	if err := os.MkdirAll(abs, 0o700); err != nil {
		return nil, fmt.Errorf("create media storage root: %w", err)
	}
	info, err := os.Lstat(abs)
	if err != nil {
		return nil, fmt.Errorf("inspect media storage root: %w", err)
	}
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return nil, errors.New("media storage root must be a real directory")
	}
	if err := os.Chmod(abs, 0o700); err != nil {
		return nil, fmt.Errorf("secure media storage root permissions: %w", err)
	}
	return &Storage{root: abs}, nil
}

func (s *Storage) Put(ctx context.Context, source io.Reader) (application.MediaObject, error) {
	if s == nil || source == nil {
		return application.MediaObject{}, errors.New("media storage and source are required")
	}
	if err := ctx.Err(); err != nil {
		return application.MediaObject{}, err
	}
	tmp, err := os.CreateTemp(s.root, ".write-*")
	if err != nil {
		return application.MediaObject{}, fmt.Errorf("create temporary media file: %w", err)
	}
	tmpName := tmp.Name()
	keep := false
	defer func() {
		if !keep {
			_ = os.Remove(tmpName)
		}
	}()
	hasher := sha256.New()
	size, copyErr := io.Copy(io.MultiWriter(tmp, hasher), contextReader{ctx: ctx, reader: source})
	if copyErr != nil {
		_ = tmp.Close()
		return application.MediaObject{}, fmt.Errorf("write media file: %w", copyErr)
	}
	if err := tmp.Sync(); err != nil {
		_ = tmp.Close()
		return application.MediaObject{}, fmt.Errorf("sync media file: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return application.MediaObject{}, fmt.Errorf("close media file: %w", err)
	}
	key := uuid.NewString()
	if err := os.Rename(tmpName, filepath.Join(s.root, key)); err != nil {
		return application.MediaObject{}, fmt.Errorf("publish media file: %w", err)
	}
	keep = true
	return application.MediaObject{Key: key, Size: size, SHA256: hex.EncodeToString(hasher.Sum(nil))}, nil
}

func (s *Storage) Open(ctx context.Context, key string) (io.ReadCloser, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	path, err := s.pathFor(key)
	if err != nil {
		return nil, err
	}
	info, err := os.Lstat(path)
	if err != nil {
		return nil, fmt.Errorf("inspect media object: %w", err)
	}
	if info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
		return nil, errors.New("media object is not a regular file")
	}
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open media object: %w", err)
	}
	return &contextFile{ctx: ctx, file: file}, nil
}

func (s *Storage) Delete(ctx context.Context, key string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	path, err := s.pathFor(key)
	if err != nil {
		return err
	}
	info, err := os.Lstat(path)
	if err != nil {
		return fmt.Errorf("inspect media object: %w", err)
	}
	if info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
		return errors.New("media object is not a regular file")
	}
	if err := os.Remove(path); err != nil {
		return fmt.Errorf("delete media object: %w", err)
	}
	return nil
}

func (s *Storage) pathFor(key string) (string, error) {
	parsed, err := uuid.Parse(key)
	if err != nil || parsed.String() != key {
		return "", errors.New("invalid media storage key")
	}
	return filepath.Join(s.root, key), nil
}

type contextReader struct {
	ctx    context.Context
	reader io.Reader
}

func (r contextReader) Read(p []byte) (int, error) {
	if err := r.ctx.Err(); err != nil {
		return 0, err
	}
	return r.reader.Read(p)
}

type contextFile struct {
	ctx  context.Context
	file *os.File
}

func (f *contextFile) Read(p []byte) (int, error) {
	if err := f.ctx.Err(); err != nil {
		return 0, err
	}
	return f.file.Read(p)
}
func (f *contextFile) Close() error { return f.file.Close() }

var _ application.MediaStorage = (*Storage)(nil)
