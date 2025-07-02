const { contract_bookmanager } = require("../blockchain/contractBookManger");

const { formatBooksWithUser } = require("../utils/formatBooks");

const getTotalBooks = async (req, res) => {
  try {
    const userAddress = req.query.userAddress;
    if (!userAddress)
      return res.status(400).json({ error: "Missing user address" });

    const books = await contract_bookmanager.getAllBooks();
    const formatted = await formatBooksWithUser(books, userAddress);

    res.json(formatted);
  } catch (err) {
    console.error("❌ Lỗi lấy sách từ smart contract:", err);
    res.status(500).json({ error: "Không thể lấy danh sách sách" });
  }
};

module.exports = { getTotalBooks };
