const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { keywords } = require("./keywords");

const OUTPUT_FILE = "./books.json";

// ⚠️ Kiểm tra lỗi font unicode thường gặp
function hasBrokenFont(text) {
  if (!text) return false;
  const brokenRegex = /[¿�Ã¤¦¨¸«]/;
  return brokenRegex.test(text);
}

// ⚠️ Kiểm tra sách có hợp lệ không
function isValidBook(book) {
  if (
    !book.id ||
    hasBrokenFont(book.title) ||
    hasBrokenFont(book.subtitle) ||
    hasBrokenFont(book.description) ||
    hasBrokenFont(book.author)
  ) {
    return false;
  }
  return true;
}

// ✅ Hàm crawl theo từ khóa
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
          const hasDesOrSub = info.description || info.subtitle;
          const hasCategory =
            Array.isArray(info.categories) && info.categories.length > 0;

          if (!hasDesOrSub || !hasCategory) return null;

          const book = {
            id: item.id,
            title: info.title || "",
            subtitle: info.subtitle || "",
            description: info.description || "",
            category: info.categories.map((c) => c.toLowerCase().trim()),
            author: (info.authors || []).join(", "),
            pages: info.pageCount || "",
            publishedDate: info.publishedDate || "",
            language: info.language || "",
            imageLink:
              info.imageLinks?.thumbnail ||
              info.imageLinks?.smallThumbnail ||
              "",
          };

          return isValidBook(book) ? normalizeBookFields(book) : null;
        })
        .filter(Boolean) || [];

    return books;
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
    return [];
  }
}

function normalizeBookFields(book) {
  return {
    id: book.id || "",
    title: book.title || "",
    subtitle: book.subtitle || "",
    description: book.description || "",
    category: book.category || [],
    author: book.author || "",
    pages: book.pages || "",
    publishedDate: book.publishedDate || "",
    language: book.language || "",
    imageLink: book.imageLink || "",
  };
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
  const categoryMap = existing;
  const seen = new Set();

  for (const keyword of keywords) {
    let page = 0;

    while (page < 25) {
      const startIndex = page * 40;
      console.log(
        `🔍 Đang tìm sách với từ khóa "${keyword}" (trang ${page + 1})`
      );
      const books = await fetchBooksByKeyword(keyword, startIndex, 40);
      if (books.length === 0) break;

      let addedCount = 0;

      books.forEach((book) => {
        if (seen.has(book.id)) return;
        seen.add(book.id);

        book.category.forEach((cat) => {
          if (!categoryMap[cat]) categoryMap[cat] = [];

          const existsInCategory = categoryMap[cat].some(
            (b) => b.id.trim().toLowerCase() === book.id.trim().toLowerCase()
          );

          if (!existsInCategory && categoryMap[cat].length < maxPerCategory) {
            categoryMap[cat].push(book);
          }
        });

        addedCount++;
      });

      console.log(`📚 Đã thêm ${addedCount} sách mới từ "${keyword}"`);
      page++;
    }
  }

  // Tiếp tục crawl nếu thiếu sách
  const missingCategories = Object.entries(categoryMap)
    .filter(([_, books]) => books.length < minPerCategory)
    .map(([cat]) => cat);

  missingCategories.forEach((cat) => {
    const currentCount = categoryMap[cat]?.length || 0;
    const needed = minPerCategory - currentCount;
    console.log(`📉 "${cat}": thiếu ${needed} sách (hiện có ${currentCount})`);
  });

  for (const missingCat of missingCategories) {
    let page = 0;

    while (true) {
      const startIndex = page * 40;
      console.log(
        `🔍 Tiếp tục tìm sách cho category thiếu "${missingCat}" (trang ${
          page + 1
        })`
      );
      const books = await fetchBooksByKeyword(missingCat, startIndex, 40);
      if (books.length === 0) {
        console.log(`⛔️ Hết kết quả cho "${missingCat}"`);
        break;
      }

      let added = 0;

      books.forEach((book) => {
        const normalizedId = book.id.trim().toLowerCase();
        if (seen.has(normalizedId)) return;
        seen.add(normalizedId);

        if (book.category.includes(missingCat)) {
          if (!categoryMap[missingCat]) categoryMap[missingCat] = [];

          const existsInCategory = categoryMap[missingCat].some(
            (b) => b.id.trim().toLowerCase() === normalizedId
          );

          if (
            !existsInCategory &&
            categoryMap[missingCat].length < maxPerCategory
          ) {
            categoryMap[missingCat].push(book);
            added++;
          }
        }
      });

      if (categoryMap[missingCat].length >= minPerCategory) {
        console.log(`✅ Đã đủ sách cho category "${missingCat}"`);
        break;
      }

      if (added === 0) {
        console.log(`⚠️ Không có sách mới nào thêm cho "${missingCat}"`);
        break;
      }

      page++;
    }
  }

  // Lưu kết quả
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

  const totalBooks = Object.values(filteredCategoryMap).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  console.log(
    `📁 Tổng cộng ${totalBooks} sách thuộc ${
      Object.keys(filteredCategoryMap).length
    } thể loại đã được ghi.`
  );
}

fetchBooksByCategory(5, 10);
