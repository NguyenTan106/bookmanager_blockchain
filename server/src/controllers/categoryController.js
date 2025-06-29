const {
  contract_bookcategory,
  signer,
} = require("../blockchain/contractBookCategory");

const addCategory = async (req, res) => {
  const { category } = req.body;

  if (!category) return res.status(400).json({ error: "Thiếu tên thể loại" });

  try {
    const tx = await contract_bookcategory
      .connect(signer)
      .addCategory(category);
    await tx.wait();

    res.status(200).json({ message: "Đã thêm thể loại", txHash: tx.hash });
  } catch (error) {
    console.error("Lỗi thêm thể loại:", error);
    res.status(500).json({ error: "Không thể thêm thể loại" });
  }
};

// ✅ Lấy tất cả thể loại còn hoạt động (không bị xoá)
const getCategories = async (req, res) => {
  try {
    // console.log(contract.getAllCategories);
    const categories = await contract_bookcategory.getAllCategories(); // trả về mảng struct

    const result = categories
      .filter((cat) => !cat.isDeleted)
      .map((cat) => ({
        id: Number(cat.id),
        name: cat.name,
      }));

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Lỗi lấy thể loại:", error);
    res.status(500).json({ error: "Không thể lấy danh sách thể loại" });
  }
};

// ✅ Xoá thể loại theo id
const deleteCategory = async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID thể loại không hợp lệ" });
  }

  try {
    const tx = await contract_bookcategory.connect(signer).deleteCategory(id); // ✅ gọi đúng hàm contract
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("❌ Lỗi xoá thể loại:", err);
    res.status(500).json({ error: "Không thể xoá thể loại" });
  }
};

module.exports = { addCategory, getCategories, deleteCategory };
