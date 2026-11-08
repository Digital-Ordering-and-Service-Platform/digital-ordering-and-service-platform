// Package application defines ports shared by infrastructure and application
// workflows without exposing infrastructure implementation types.
package application

import (
	"context"
	"io"
)

// MediaStorage stores protected media under opaque keys. Callers must authorize
// access before opening an object; implementations must not expose public URLs.
type MediaStorage interface {
	Put(context.Context, io.Reader) (MediaObject, error)
	Open(context.Context, string) (io.ReadCloser, error)
	Delete(context.Context, string) error
}

type MediaObject struct {
	Key    string
	Size   int64
	SHA256 string
}
