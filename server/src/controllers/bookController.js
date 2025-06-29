const { contract_bookmanager } = require("../blockchain/contractBookManger");
const { contract_bookcategory } = require("../blockchain/contractBookCategory");
const STATUS_MAP = {
  0: "Available",
  1: "Borrowed",
};
const getCategories = async () => {
  try {
    const categories = await contract_bookcategory.getAllCategories(); // trả về mảng struct

    const result = new Map(
      categories
        .filter((cat) => !cat.isDeleted)
        .map((cat) => [Number(cat.id), cat.name])
    );
    return result;
  } catch (error) {
    console.error("❌ Lỗi lấy thể loại:", error);
  }
};
const getTotalBooks = async (req, res) => {
  try {
    const books = await contract_bookmanager.getAllBooks();
    const filtered = books.filter((b) => !b.isDeleted);
    const categories = await getCategories();
    // Chuyển đổi BigInt về kiểu bình thường
    const formatted = filtered.map((book) => ({
      id: Number(book.id),
      title: book.title,
      owner: book.owner,
      price: Number(book.price),
      description: book.description,
      category: book.categoryIds
        .map((id) => {
          const name = categories.get(Number(id));
          if (!name) return null;
          return { id: Number(id), name };
        })
        .filter(Boolean), // loại undefined nếu có
      ipfsHash: book.ipfsHash,
      coverImageHash: book.coverImageHash,
      status: STATUS_MAP[Number(book.status)],
      borrows: book.borrows.map((borrow) => ({
        borrower: borrow.borrower,
        returnDate: Number(borrow.returnDate)
          ? new Date(Number(borrow.returnDate) * 1000).toLocaleDateString(
              "vi-VN"
            )
          : null,
      })),
      isDeleted: book.isDeleted,
      performedBy: book.performedBy,
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Lỗi lấy sách từ smart contract:", err);
    res.status(500).json({ error: "Không thể lấy danh sách sách" });
  }
};

module.exports = { getTotalBooks };
