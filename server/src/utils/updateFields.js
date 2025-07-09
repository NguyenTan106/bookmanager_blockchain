const fs = require("fs");
const path = require("path");
const axios = require("axios");

const INPUT_FILE = path.join(__dirname, "books.json");
const OUTPUT_FILE = path.join(__dirname, "sample_enriched.json");

// Danh sách thứ tự trường cần có
const requiredFields = [
  "id",
  "title",
  "subtitle",
  "description",
  "author",
  "pages",
  "publishedDate",
  "language",
  "imageLink",
  "category",
];

// 1. Kiểm tra lỗi font (Unicode hỏng)
function hasBrokenFont(text) {
  if (!text) return false;
  const brokenCharRegex = /[¿�Ã¤¦¨¸«]/;
  return brokenCharRegex.test(text);
}

function isLikelyFontError(book) {
  return (
    hasBrokenFont(book.title) ||
    hasBrokenFont(book.subtitle) ||
    hasBrokenFont(book.description) ||
    hasBrokenFont(book.author)
  );
}

// 2. Kiểm tra thiếu field (không tồn tại key)
function isMissingField(book) {
  return requiredFields.some((field) => !book.hasOwnProperty(field));
}

// 3. Gọi Google Books API lấy thông tin enrich
async function fetchBookDetail(id) {
  const url = `https://www.googleapis.com/books/v1/volumes/${id}`;
  try {
    const res = await axios.get(url);
    return res.data.volumeInfo;
  } catch (err) {
    console.error(`❌ Lỗi khi fetch sách ID ${id}: ${err.message}`);
    return null;
  }
}

// 4. Format Title Case
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// 5. Làm giàu sách
async function enrichBook(book) {
  const info = await fetchBookDetail(book.id);
  if (!info) return book;

  if (!book.hasOwnProperty("subtitle")) book.subtitle = info.subtitle || "";
  if (!book.hasOwnProperty("description"))
    book.description = info.description || "";
  if (!book.hasOwnProperty("author"))
    book.author = info.authors ? info.authors.join(", ") : "";
  if (!book.hasOwnProperty("pages")) book.pages = info.pageCount || "";
  if (!book.hasOwnProperty("publishedDate"))
    book.publishedDate = info.publishedDate || "";
  if (!book.hasOwnProperty("language")) book.language = info.language || "";
  if (!book.hasOwnProperty("imageLink"))
    book.imageLink =
      info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "";

  // Format title
  if (book.title) book.title = toTitleCase(book.title);

  return book;
}

// 6. Đảm bảo đủ và đúng thứ tự trường
function normalizeBookFields(book) {
  const normalized = {};
  for (const field of requiredFields) {
    if (field === "title" && book[field]) {
      normalized[field] = toTitleCase(book[field]);
    } else {
      normalized[field] = book.hasOwnProperty(field) ? book[field] : "";
    }
  }
  return normalized;
}

// 7. Hàm chính
async function enrichAllBooks() {
  const raw = fs.readFileSync(INPUT_FILE, "utf-8");
  const data = JSON.parse(raw);
  const result = {};
  let totalBooks = 0;
  let enrichedBooks = 0;
  let skippedBooks = 0;

  for (const [category, books] of Object.entries(data)) {
    console.log(`📚 Đang xử lý category "${category}"...`);
    result[category] = [];

    for (const book of books) {
      totalBooks++;
      const needEnrich = isMissingField(book) || isLikelyFontError(book);

      let finalBook = book;

      if (needEnrich) {
        enrichedBooks++;
        console.log(`🔧 Cập nhật sách: ${book.title}`);
        finalBook = await enrichBook(book);
        await new Promise((r) => setTimeout(r, 300));
      } else {
        skippedBooks++;
      }

      const normalizedBook = normalizeBookFields(finalBook);
      result[category].push(normalizedBook);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), "utf-8");

  console.log("\n✅ Đã lưu kết quả enrich vào:", OUTPUT_FILE);
  console.log("📊 Thống kê:");
  console.log(`- Tổng số sách: ${totalBooks}`);
  console.log(`- 🛠️ Enriched (thiếu hoặc lỗi font): ${enrichedBooks}`);
  console.log(`- ✅ Bỏ qua (đã đủ & đúng): ${skippedBooks}`);
}

enrichAllBooks();
