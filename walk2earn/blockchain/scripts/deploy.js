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

    // STP Rewards token
  const StepToken = await ethers.getContractFactory("StepToken");
  console.log("\nDeploying StepToken contract");
  const stepToken = await StepToken.deploy();

  console.log("StepToken Contract")
  console.log("address:", stepToken.address);

  // WalkToEarn Contract
  const WalkToEarn = await ethers.getContractFactory("WalkToEarn");
  console.log("\nDeploying WalkToEarn contract");
  const walkToEarn = await WalkToEarn.deploy(deviceBinding.address, stepToken.address);

  console.log("WalkToEarn Contract")
  console.log("address:", walkToEarn.address);

  console.log("\nDeployment completed.");
  console.log("Contracts deployed at height:", devicesRegistry.deployTransaction.blockNumber);

  console.log("\n");
  console.log("Funding the WalkToEarn contract");
  await stepToken.transfer(walkToEarn.address, await stepToken.totalSupply());
  let b = await walkToEarn.getBalance();
  console.log("WalkToEarn contract Balance: ", formatNumber(b / Math.pow(10,18)), " STP tokens");
  console.log("\n");

  // Save the contract addresses to the config file
  config.REGISTRY_CONTRACT = devicesRegistry.address;
  config.BINDING_CONTRACT = deviceBinding.address;
  config.WALKTOEARN_CONTRACT = walkToEarn.address;
  config.STEPTOKEN_CONTRACT = stepToken.address;
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