# Walk To Earn Workshop 
## Requirements

- Docker and docker-compose

## Deploy the app

### Run the W3bstream node

```shell
export PRIVATE_KEY=<WEBSTREAM_PRIVATE_KEY>
curl https://raw.githubusercontent.com/machinefi/w3bstream/main/docker-compose.yaml > docker-compose.yaml

docker-compose -p w3bstream -f ./docker-compose.yaml up -d
```

### Deploy smart contracts

```shell
make deploy
```
Take note of the RegistryContract deployment height!
### Build W3bstream handlers

```shell
make wasm
```
