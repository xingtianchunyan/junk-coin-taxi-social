// 超级管理员配置
// 固定钱包地址用于身份验证，提升安全性
export const SUPER_ADMIN_CONFIG = {
  // 授权的超级管理员钱包地址（请替换为您的实际钱包地址）
  WALLET_ADDRESS: '0x1234567890123456789012345678901234567890',
  // 显示名称
  DISPLAY_NAME: 'Super Admin',
  // 签名消息模板
  SIGNATURE_MESSAGE: 'Super Admin Authentication',
} as const;

// 验证钱包地址是否为授权的超级管理员
export const isAuthorizedSuperAdmin = (walletAddress: string): boolean => {
  return walletAddress.toLowerCase() === SUPER_ADMIN_CONFIG.WALLET_ADDRESS.toLowerCase();
};