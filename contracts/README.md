# 社区徽章 SBT 智能合约

## 概述
这是一个基于以太坊的灵魂绑定代币（SBT）智能合约，用于为乘客和司机颁发社区徽章。

## 功能特点
- 🏆 为每次支付自动铸造司机和乘客徽章
- 🔒 灵魂绑定：徽章不可转让
- 📊 支持查询用户拥有的所有徽章
- 🔗 与支付交易哈希关联

## 部署说明

### 1. 安装依赖
```bash
cd contracts
npm install
```

### 2. 配置网络
编辑 `hardhat.config.js` 文件：
```javascript
networks: {
  sepolia: {
    url: "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
    accounts: ["YOUR_PRIVATE_KEY"]
  }
}
```

### 3. 获取测试代币
- 访问 [Sepolia Faucet](https://sepoliafaucet.com/) 获取测试ETH
- 或使用 [Alchemy Faucet](https://sepoliafaucet.com/)

### 4. 部署合约
```bash
npm run deploy
```

### 5. 验证合约（可选）
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 主要函数

### mintBadgesForPayment
为司机和乘客铸造徽章
```solidity
function mintBadgesForPayment(
    address driver,
    address passenger,
    bytes32 paymentHash,
    uint256 amount
) external onlyOwner
```

### getBadgesOfOwner
获取地址拥有的所有徽章
```solidity
function getBadgesOfOwner(address owner) external view returns (uint256[] memory)
```

### getBadgeInfo
获取徽章详细信息
```solidity
function getBadgeInfo(uint256 tokenId) external view returns (Badge memory)
```

## 前端集成

在PaymentDialog组件中已集成区块链支付功能：
1. 检测MetaMask钱包
2. 验证Sepolia网络
3. 发送ETH到司机地址
4. 自动铸造SBT徽章

## 测试网络信息
- **网络名称**: Sepolia
- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_PROJECT_ID
- **区块浏览器**: https://sepolia.etherscan.io/

## 安全注意事项
- 合约使用OpenZeppelin标准库确保安全性
- 只有合约所有者可以铸造徽章
- SBT不可转让，确保徽章的唯一性和真实性