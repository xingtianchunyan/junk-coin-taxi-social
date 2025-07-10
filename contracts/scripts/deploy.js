const hre = require("hardhat");

async function main() {
  console.log("Deploying CommunityBadge contract...");

  const CommunityBadge = await hre.ethers.getContractFactory("CommunityBadge");
  const communityBadge = await CommunityBadge.deploy();

  await communityBadge.deployed();

  console.log("CommunityBadge deployed to:", communityBadge.address);
  
  // 保存合约地址到配置文件
  const fs = require('fs');
  const contractConfig = {
    address: communityBadge.address,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    '../src/config/contract.json',
    JSON.stringify(contractConfig, null, 2)
  );
  
  console.log("Contract address saved to src/config/contract.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });