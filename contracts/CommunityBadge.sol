// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CommunityBadge
 * @dev 社区徽章SBT合约 - 灵魂绑定代币，不可转让
 */
contract CommunityBadge is ERC721, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    // 徽章元数据
    struct Badge {
        address recipient;      // 徽章接收者
        uint256 timestamp;      // 颁发时间
        string badgeType;       // 徽章类型（driver/passenger）
        bytes32 paymentHash;    // 关联的支付交易哈希
        string metadataURI;     // 元数据URI
    }
    
    // 代币ID到徽章信息的映射
    mapping(uint256 => Badge) public badges;
    
    // 地址到徽章数量的映射
    mapping(address => uint256) public badgeCount;
    
    // 阻止转账的标志
    mapping(uint256 => bool) public soulbound;
    
    // 事件
    event BadgeMinted(address indexed recipient, uint256 indexed tokenId, string badgeType);
    event PaymentProcessed(address indexed driver, address indexed passenger, uint256 amount, bytes32 paymentHash);
    
    constructor(string memory name, string memory symbol, address initialOwner) ERC721(name, symbol) Ownable(initialOwner) {}
    
    /**
     * @dev 为司机和乘客铸造徽章
     * @param driver 司机地址
     * @param passenger 乘客地址
     * @param paymentHash 支付交易哈希
     * @param amount 支付金额
     */
    function mintBadgesForPayment(
        address driver,
        address passenger,
        bytes32 paymentHash,
        uint256 amount
    ) external onlyOwner {
        require(driver != address(0), "Invalid driver address");
        require(passenger != address(0), "Invalid passenger address");
        require(paymentHash != bytes32(0), "Invalid payment hash");
        
        // 为司机铸造徽章
        uint256 driverTokenId = _mintBadge(driver, "driver", paymentHash);
        
        // 为乘客铸造徽章
        uint256 passengerTokenId = _mintBadge(passenger, "passenger", paymentHash);
        
        emit PaymentProcessed(driver, passenger, amount, paymentHash);
    }
    
    /**
     * @dev 内部函数：铸造单个徽章
     */
    function _mintBadge(
        address recipient,
        string memory badgeType,
        bytes32 paymentHash
    ) internal returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(recipient, newTokenId);
        
        // 设置为灵魂绑定
        soulbound[newTokenId] = true;
        
        // 记录徽章信息
        badges[newTokenId] = Badge({
            recipient: recipient,
            timestamp: block.timestamp,
            badgeType: badgeType,
            paymentHash: paymentHash,
            metadataURI: string(abi.encodePacked("https://api.example.com/metadata/", toString(newTokenId)))
        });
        
        // 增加徽章计数
        badgeCount[recipient]++;
        
        emit BadgeMinted(recipient, newTokenId, badgeType);
        
        return newTokenId;
    }
    
    
    
    /**
     * @dev 获取地址拥有的所有徽章
     */
    function getBadgesOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (ownerOf(i) == owner) {
                tokenIds[index] = i;
                index++;
            }
        }
        
        return tokenIds;
    }
    
    /**
     * @dev 获取徽章详细信息
     */
    function getBadgeInfo(uint256 tokenId) external view returns (Badge memory) {
    require(ownerOf(tokenId) != address(0), "Badge does not exist");
    return badges[tokenId];
    }
    
    /**
     * @dev 获取代币URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
    require(ownerOf(tokenId) != address(0), "URI query for nonexistent token");
    return badges[tokenId].metadataURI;
    }
    
    /**
     * @dev 工具函数：将uint256转换为字符串
     */
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
