const { computeTfIdf } = require("../services/tfidfService");
const { contract_bookmanager } = require("../blockchain/contractBookManger");
const { contract_bookcategory } = require("../blockchain/contractBookCategory");
const STATUS_MAP = {
  0: "Available",
  1: "Borrowed",
};
const searchBooks = async (req, res) => {
  const query = req.body.query;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    // 👉 Lấy số lượng sách
    const total = await getTotalBooks();
    // ✅ Tính TF-IDF
    const tfidfResults = await computeTfIdf(query, total);
    // console.log(tfidfResults);
    const sorted = tfidfResults.sort((a, b) => b.score - a.score);

    res.json(sorted);
  } catch (err) {
    console.error("Lỗi khi tìm kiếm sách:", err);
    res.status(500).json({ error: "Không thể tìm kiếm sách" });
  }
};

const sortBooks = async (req, res) => {
  const { field = "title", order = "asc" } = req.query;

  try {
    const books = await getTotalBooks();

    const sorted = books.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];

      if (typeof valA === "number" && typeof valB === "number") {
        return order === "asc" ? valA - valB : valB - valA;
      }
      if (order === "origin") {
        return books;
      }

      // default string compare
      return order === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    res.json(sorted);
  } catch (err) {
    console.error("❌ Lỗi khi sắp xếp sách:", err);
    res.status(500).json({ error: "Không thể sắp xếp sách" });
  }
};

const getTotalBooks = async () => {
  try {
    const books = await contract_bookmanager.getAllBooks();
    const filtered = books.filter((b) => !b.isDeleted);
    const categories = await contract_bookcategory.getAllCategories();
    const categoryMap = new Map(
      categories
        .filter((cat) => !cat.isDeleted)
        .map((cat) => [Number(cat.id), cat.name])
    );
    const formatted = filtered.map((book) => ({
      id: Number(book.id),
      title: book.title,
      owner: book.owner,
      price: Number(book.price),
      description: book.description,
      category: book.categoryIds
        .map((id) => {
          const name = categoryMap.get(Number(id));
          if (!name) return null;
          return { id: Number(id), name };
        })
        .filter(Boolean),
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
    return formatted;
  } catch (err) {
    console.error("❌ Lỗi lấy sách từ smart contract:", err);
  }
};

module.exports = { getTotalBooks, searchBooks, sortBooks };
