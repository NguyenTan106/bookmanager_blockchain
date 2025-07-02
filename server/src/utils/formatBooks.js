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

const formatBooksWithUser = async (books, userAddress) => {
  const categories = await getCategories();

  return await Promise.all(
    books
      .filter((b) => !b.isDeleted)
      .map(async (book) => {
        let hasPurchased = false;

        if (userAddress) {
          try {
            hasPurchased = await contract_bookmanager.hasPurchased(
              book.id,
              userAddress
            );
          } catch (e) {
            console.warn(`⚠️ Lỗi kiểm tra mua sách ID ${book.id}:`, e);
          }
        }

        return {
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
          hasPurchased,
        };
      })
  );
};

const getTotalBooksData = async (userAddress) => {
  const books = await contract_bookmanager.getAllBooks();
  return await formatBooksWithUser(books, userAddress);
};

module.exports = { formatBooksWithUser, getTotalBooksData };
