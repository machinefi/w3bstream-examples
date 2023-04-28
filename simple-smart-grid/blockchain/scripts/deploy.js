config = require('./config.js');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  let balanceRau = await deployer.getBalance();
  let balanceIOTX = balanceRau / Math.pow(10,18);
  console.log("Account balance:", balanceIOTX, " IOTX");

  // DevicesRegistry Contract
  const DevicesRegistry = await ethers.getContractFactory("DevicesRegistry");
  console.log("\nDeploying DevicesRegistry contract");
  const devicesRegistry = await DevicesRegistry.deploy();

  console.log("DevicesRegistry Contract")
  console.log("address:", devicesRegistry.address);

  // DeviceBinding Contract
  const DeviceBinding = await ethers.getContractFactory("DeviceBinding");
  console.log("\nDeploying DeviceBinding contract");
  const deviceBinding = await DeviceBinding.deploy();

  console.log("DeviceBinding Contract")
  console.log("address:", deviceBinding.address);

    // ECO token
  const ECOToken = await ethers.getContractFactory("ECOToken");
  console.log("\nDeploying ECOToken contract");
  const ecoToken = await ECOToken.deploy();

  console.log("EcoToken Contract")
  console.log("address:", ecoToken.address);

  console.log("\nDeployment completed.");
  console.log("Contracts deployed at height:", devicesRegistry.deployTransaction.blockNumber);

  console.log("\n");

  // Save config section

  // Save the contract addresses to the config file
  config.REGISTRY_CONTRACT = devicesRegistry.address;
  config.BINDING_CONTRACT = deviceBinding.address;
  config.TOKEN_CONTRACT = ecoToken.address;
  config.DEPLOYED_HEIGHT = devicesRegistry.deployTransaction.blockNumber;
  config.DEPLOYER_ADDRESS = deployer.address;
  config.SaveEnvConfig();
  
  console.log("Configuration saved to .env file");
}

function formatNumber(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });