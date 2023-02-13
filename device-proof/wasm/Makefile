build:
	@go mod tidy
	@tinygo build -o device-proof-applet.wasm -scheduler=none --no-debug -target=wasi device-proof-applet.go
	@echo built to device-proof-applet.wasm
