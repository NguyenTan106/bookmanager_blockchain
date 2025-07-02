const {
  computeTfIdf,
  computeTfIdfClassify,
} = require("../services/tfidfService");
const { getTotalBooksData } = require("../utils/formatBooks");

const searchBooks = async (req, res) => {
  const query = req.body.query;
  const userAddress = req.body.userAddress;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    // 👉 Lấy số lượng sách
    const total = await getTotalBooksData(userAddress);
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

const classifyBooks = async (req, res) => {
  const query = req.body.query;
  const userAddress = req.body.userAddress;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    // 👉 Lấy số lượng sách
    const total = await getTotalBooksData(userAddress);
    // ✅ Tính TF-IDF
    const tfidfResults = await computeTfIdfClassify(query, total);
    // console.log(tfidfResults);
    const sorted = tfidfResults.sort((a, b) => b.score - a.score);

    res.json(sorted);
  } catch (err) {
    console.error("Lỗi khi tìm kiếm sách:", err);
    res.status(500).json({ error: "Không thể tìm kiếm sách" });
  }
};

const sortBooks = async (req, res) => {
  const { field = "title", order = "asc", userAddress } = req.query;

  try {
    const books = await getTotalBooksData(userAddress);

    if (order === "origin") {
      return res.json(books); // 👈 trả nguyên không sort
    }

    const sorted = books.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];

      if (typeof valA === "number" && typeof valB === "number") {
        return order === "asc" ? valA - valB : valB - valA;
      }

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

module.exports = { searchBooks, sortBooks, classifyBooks };
