build:
	@go mod tidy
	@tinygo build -o points-token.wasm -scheduler=none --no-debug -target=wasi points-token.go
	@echo built to points-token.wasm
