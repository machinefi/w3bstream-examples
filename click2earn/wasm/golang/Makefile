build:
	@go mod tidy
	@tinygo build -o click2earn.wasm -scheduler=none --no-debug -target=wasi click2earn.go
	@echo built to click2earn.wasm
