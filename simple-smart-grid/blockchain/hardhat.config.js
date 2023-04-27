require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
require('dotenv').config()
const fs = require('fs');
 
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const REGISTRY_CONTRACT = process.env.REGISTRY_CONTRACT_ADDRESS;
const BINDING_CONTRACT = process.env.BINDING_CONTRACT_ADDRESS;
const WALKTOEARN_CONTRACT = process.env.WALK_TO_EARN_CONTRACT_ADDRESS;
const STEPTOKEN_CONTRACT = process.env.STEP_TOKEN_CONTRACT_ADDRESS;

extendEnvironment((hre) => {
  hre.REGISTRY_CONTRACT = process.env.REGISTRY_CONTRACT;
  hre.BINDING_CONTRACT = process.env.BINDING_CONTRACT;
});

task("envtest", async (args, hre) => {
  console.log("Registry Contract Address  : ", hre.REGISTRY_CONTRACT);
  console.log("Binding Contract Address   : ", hre.BINDING_CONTRACT);
});


task("registerDevice", "Authorize a new device by adding it to the DevicesRegistry contract")
  .addParam("deviceid", "The device id (can be anything of the size of an EVM address)")
  .setAction(async ({deviceid}) => {
    console.log("Registering device:", deviceid, ", to registry contract:", hre.REGISTRY_CONTRACT);
 
    const DevicesRegistry = await ethers.getContractFactory("DevicesRegistry");
    const devicesRegistry = await DevicesRegistry.attach(hre.REGISTRY_CONTRACT);
    let ret = await devicesRegistry.registerDevice(deviceid);
    console.log ("registerDevice:", ret);
  });
 
task("bindDevice", "Binding device to an owner's account")
  .addParam("deviceid", "The device id")
  .addParam("owneraddress", "The device owner address.")
  .setAction(async ({deviceid, owneraddress}) => {
    console.log("Binding device:", deviceid, ",to owner: ", owneraddress);
 
    const DeviceBinding = await ethers.getContractFactory("DeviceBinding");
    const deviceBinding = await DeviceBinding.attach(hre.BINDING_CONTRACT);
    let ret = await deviceBinding.bindDevice(deviceid, owneraddress );
    console.log ("bindingDevice:", ret);
  });
 

  task("isAuthorized", "Chek if a device id is authorized")
  .addParam("deviceid", "The device id.")
  .setAction(async ({deviceid}) => {
    console.log("Querying device authorization: ", deviceid);
 
    const DevicesRegistry = await ethers.getContractFactory("DevicesRegistry");
    const devicesRegistry = await DevicesRegistry.attach(hre.REGISTRY_CONTRACT);
    let ret = await devicesRegistry.isAuthorizedDevice(deviceid);
    console.log ("Is Authorized:", ret);
  });

  task("getDeviceOwner", "Return the owner of a device")
  .addParam("deviceid", "The device id.")
  .setAction(async ({deviceid}) => {
    console.log("Querying device binding: ", deviceid);
 
    const DeviceBinding = await ethers.getContractFactory("DeviceBinding");
    const deviceBinding = await DeviceBinding.attach(hre.BINDING_CONTRACT);
    let ret = await deviceBinding.getDeviceOwner(deviceid);
    console.log ("Owner is:", ret);
  });
 
 
module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      gas: 8500000,
    },
    testnet: {
      // These are the official IoTeX endpoints to be used by Ethereum clients
      // Testnet https://babel-api.testnet.iotex.io
      // Mainnet https://babel-api.mainnet.iotex.io
      url: `https://babel-api.testnet.iotex.io`,
 
      // Input your Metamask testnet account private key here
      accounts: [`${PRIVATE_KEY}`],
    },
  },
}; 
