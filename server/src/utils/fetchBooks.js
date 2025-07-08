const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { keywords } = require("./keywords");
const OUTPUT_FILE = "../assets/sample.json";

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
              id: item.id,
              title: info.title,
              subtitle: info.subtitle || "",
              description: info.description,
              category: info.categories.map((c) => c.toLowerCase().trim()), // chuẩn hoá
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
      return {};
    }
  }
  return {};
}

async function fetchBooksByCategory(minPerCategory = 10, maxPerCategory = 40) {
  const existing = loadExistingBooks();
  const categoryMap = existing; // { categoryName: [books...] }
  const seen = new Set();

  for (const keyword of keywords) {
    let page = 0;

    while (page < 25) {
      // tối đa 1000 sách
      const startIndex = page * 40;
      console.log(
        `🔍 Đang tìm sách với từ khóa "${keyword}" (trang ${page + 1})`
      );
      const books = await fetchBooksByKeyword(keyword, startIndex, 40);
      if (books.length === 0) break;

      books.forEach((book) => {
        if (seen.has(book.id)) return;

        seen.add(book.id);
        book.category.forEach((cat) => {
          if (!categoryMap[cat]) categoryMap[cat] = [];
          if (categoryMap[cat].length < maxPerCategory) {
            categoryMap[cat].push(book);
          }
        });
      });

      page++;
    }
  }

  // Lọc các category có đủ sách
  const filteredCategoryMap = {};
  Object.entries(categoryMap).forEach(([cat, books]) => {
    if (books.length >= minPerCategory) {
      filteredCategoryMap[cat] = books.slice(0, maxPerCategory);
    }
  });

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(filteredCategoryMap, null, 2),
    "utf-8"
  );
  console.log(
    `🎉 Đã lưu ${
      Object.keys(filteredCategoryMap).length
    } thể loại vào ${OUTPUT_FILE}`
  );
}

fetchBooksByCategory(10, 25);
