const { contract_bookmanager } = require("../blockchain/contractBookManger");
const { keccak256, toUtf8Bytes } = require("ethers");

// const DEFAULT_ADMIN_ROLE =
//   "0x0000000000000000000000000000000000000000000000000000000000000000";
const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE")); // hash tương đương keccak256("ADMIN_ROLE")
const DEFAULT_ADMIN_ROLE = "0x" + "00".repeat(32);

const checkUserRole = async (address) => {
  try {
    const isAdmin = await contract_bookmanager.hasRole(ADMIN_ROLE, address);
    const isSuperAdmin = await contract_bookmanager.hasRole(
      DEFAULT_ADMIN_ROLE,
      address
    );

    return {
      isAdmin,
      isSuperAdmin,
    };
  } catch (err) {
    console.error("❌ Lỗi khi kiểm tra quyền:", err);
    return {
      isAdmin: false,
      isSuperAdmin: false,
    };
  }
};

module.exports = { checkUserRole };
