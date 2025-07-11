// 合约配置
export const CONTRACT_CONFIG = {
  // Flow EVM Testnet 配置
  FLOW_TESTNET: {
    chainId: 545,
    chainName: "Flow EVM Testnet",
    rpcUrl: "https://testnet.evm.nodes.onflow.org",
    blockExplorer: "https://evm-testnet.flowscan.io",
    nativeCurrency: {
      name: "Flow",
      symbol: "FLOW",
      decimals: 18,
    },
  },
  // 合约地址（部署后需要更新）
  CONTRACT_ADDRESS: "0x181aFa35Bbc64c4EFBcd1bB56757d3E8520673b5",
};

// 合约ABI - GatherMapBadges核心函数
export const CONTRACT_ABI = [
  // 只读函数
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function owner() view returns (address)",
  "function hasBadge(address user, string badgeType) view returns (bool)",
  "function getBadgeMetadata(string badgeType) view returns (string)",
  "function badgeTypes(string) view returns (bool)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",

  // 写入函数（仅管理员）
  "function mintBadge(address recipient, string badgeType, string uri)",
  "function batchMintBadges(address[] recipients, string badgeType, string[] uris)",
  "function addBadgeType(string badgeType, string metadata)",

  // 事件
  "event BadgeMinted(address indexed recipient, uint256 tokenId, string badgeType)",
  "event BadgeTypeAdded(string badgeType, string metadata)",
];

// 徽章类型配置
export const BADGE_TYPES = {
  "veteran driver": {
    label: "Digital Nomad Explorer",
    description: "Visited more than 5 places",
    icon: "🌍",
    color: "primary",
  },
  "community star": {
    label: "Community Star",
    description: "Active community contributor",
    icon: "🌟",
    color: "rose",
  }
} as const;

export type BadgeType = keyof typeof BADGE_TYPES;

// 管理员钱包地址
export const ADMIN_WALLET_ADDRESS = "0xD921050BA7b2A8dDC7EcEb390AF3CDD2758FBf8f";