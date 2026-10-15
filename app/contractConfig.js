export const MARKETPLACE_ADDRESS = "0x3aC833C18AE20C6253248a726EA389c3d872AAD9"; // <-- แปะ Contract Address ที่คัดลอกจาก Remix
export const GG_TOKEN_ADDRESS = "0x6A7db8DbC33734BD89798f2258982C2b589cA620";

export const MARKETPLACE_ABI = [
  "function mintAndList(string memory tokenURI, uint256 price) external returns (uint256)",
  "function buyNFT(uint256 tokenId) external",
  "function withdrawNFT(uint256 tokenId) external",
  "function listings(uint256) external view returns (uint256 price, address seller, bool isListed)"
];

export const GG_TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];