.PHONY: generate test vet build verify

generate:
	go generate ./ent

test:
	go test ./...

vet:
	go vet ./...

build:
	go build ./cmd/api ./cmd/worker

verify: generate test vet build
