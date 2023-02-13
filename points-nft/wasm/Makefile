build:
	@go mod tidy
	@tinygo build -o points-nft.wasm -scheduler=none --no-debug -target=wasi points-nft.go
	@echo built to points-nft.wasm
