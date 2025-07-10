require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
      accounts: ["YOUR_PRIVATE_KEY"] // 请在实际部署时替换
    }
  },
  etherscan: {
    apiKey: "YOUR_ETHERSCAN_API_KEY" // 用于验证合约
  }
};