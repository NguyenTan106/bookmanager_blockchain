import Web3 from "web3";

const ADMIN_ROLE = Web3.utils.keccak256("ADMIN_ROLE");

export const getUserRole = async (bookContract, account) => {
  if (!bookContract || !account) return null;

  try {
    const isSuper = await bookContract.methods
      .hasRole(Web3.utils.padLeft("0x0", 64), account)
      .call();
    if (isSuper) return "super";

    const isAdmin = await bookContract.methods
      .hasRole(ADMIN_ROLE, account)
      .call();
    if (isAdmin) return "admin";

    return "user";
  } catch (err) {
    console.error("Lỗi khi kiểm tra vai trò:", err);
    return null;
  }
};
