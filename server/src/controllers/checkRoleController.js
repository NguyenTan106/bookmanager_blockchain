const { checkUserRole } = require("../services/checkRoleService");

const checkRole = async (req, res) => {
  const { address } = req.params;
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: "Địa chỉ không hợp lệ" });
  }

  const roles = await checkUserRole(address);
  res.json(roles);
};

module.exports = { checkRole };
