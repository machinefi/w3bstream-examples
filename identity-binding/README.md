## Simple Identity/Binding contracts

### Quick start

```sh
npm install

export PRIVATE_KEY=<Your IoTeX testnet wallet private key>

# Deploy contracts
npx hardhat run scripts/deploy.js  --network testnet

# Check deployment info
cat .env

# Register/Authorize (aka "ship") a new device id
npx hardhat registerDevice --deviceid 0x4c123380CA640a146D803f844E0D9c90b52C5C97 --network testnet

# Check device is authorized
npx hardhat isAuthorized --deviceid 0x4c123380CA640a146D803f844E0D9c90b52C5C97 --network testnet

# Bind a device to an owner's account address
npx hardhat bindDevice --deviceid 0x4c123380CA640a146D803f844E0D9c90b52C5C97 --owneraddress 0xE91686163CaB6c619EC73595bDdd0E997197Af49 --network testnet

# Check the owner of a device id
npx hardhat getDeviceOwner --deviceid 0x4c123380CA640a146D803f844E0D9c90b52C5C97 --network testnet
```
