const axios = require("axios");
const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = path.resolve(__dirname, "books.json");

function isVietnamese(text) {
  if (!text) return false;
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵêèéẹẻẽêềếệểễôồốộổỗơờớợởỡưừứựửữđ]/i;
  return vietnameseRegex.test(text.toLowerCase());
}

async function fetchBooksByKeyword(keyword, start = 0, max = 40) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    keyword
  )}&startIndex=${start}&maxResults=${max}`;

  try {
    const res = await axios.get(url);
    const books =
      res.data.items
        ?.map((item) => {
          const info = item.volumeInfo;
          const hasDescription =
            info.description && isVietnamese(info.description);
          const hasCategory =
            Array.isArray(info.categories) && info.categories.length > 0;

          if (hasDescription && hasCategory) {
            return {
              id: `${(info.title || "").trim()}__${(info.description || "")
                .trim()
                .slice(0, 100)}`, // Dùng làm ID kiểm trùng
              title: info.title || "",
              subtitle: info.subtitle,
              description: info.description,
              category: info.categories.join(),
            };
          }
          return null;
        })
        .filter(Boolean) || [];
    return books;
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
    return [];
  }
}

function loadExistingBooks() {
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const raw = fs.readFileSync(OUTPUT_FILE, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("⚠️ Lỗi đọc file JSON:", e.message);
      return [];
    }
  }
  return [];
}

async function fetchAllBooks(targetPerKeyword = 200) {
  const keywords = [
    "kỹ năng",
    "lập trình",
    "việt nam",
    "kinh tế",
    "tâm lý",
    "tiếng việt",
    "giáo dục",
    "công nghệ",
    "marketing",
    "khởi nghiệp",
    "trí tuệ nhân tạo",
    "blockchain",
    "lãnh đạo",
    "giao tiếp",
    "ngôn ngữ",
    "phát triển bản thân",
    "mac lenin",
    "hồ chí minh",
  ];

  let allBooks = loadExistingBooks();
  const seen = new Set(allBooks.map((b) => b.id));

  for (const keyword of keywords) {
    let keywordBooks = [];
    let page = 0;

    while (keywordBooks.length < targetPerKeyword) {
      const startIndex = page * 40;
      if (startIndex >= 1000) break;

      console.log(`🔍 Từ khóa: "${keyword}", trang ${page + 1}`);
      const books = await fetchBooksByKeyword(keyword, startIndex, 40);

      if (books.length === 0) {
        console.log("⛔ Hết kết quả.");
        break;
      }

      // Lọc bỏ trùng trước khi thêm
      const newBooks = books.filter((book) => !seen.has(book.id));

      newBooks.forEach((book) => {
        seen.add(book.id);
        keywordBooks.push(book);
        allBooks.push(book);
      });

      if (keywordBooks.length >= targetPerKeyword) break;
      page++;
    }

    console.log(
      `✅ Lấy ${keywordBooks.length} sách cho từ khóa "${keyword}" (Tổng cộng: ${allBooks.length})`
    );

    // 💾 Ghi vào file mỗi khi đủ 200 sách mới
    if (keywordBooks.length >= 200) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allBooks, null, 2), "utf-8");
      console.log(`💾 Đã ghi thêm vào ${OUTPUT_FILE}`);
    }
  }

  // 🧹 Ghi đè toàn bộ nếu chưa đủ 200 ở vòng cuối
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allBooks, null, 2), "utf-8");
  console.log(`🎉 Tổng số sách lưu trữ: ${allBooks.length}`);
}

fetchAllBooks(100); // 🎯 Tối đa 200 sách / từ khóa
