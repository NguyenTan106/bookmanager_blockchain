const fs = require("fs");
const path = require("path");
const data = require("../assets/sample.json");

const OUTPUT_CLEANED = "../assets/sample.json";

const allIds = new Set();
const duplicateIds = new Set();

Object.values(data).forEach((books) => {
  books.forEach((b) => {
    const id = b.id.trim().toLowerCase();
    if (allIds.has(id)) {
      duplicateIds.add(id);
    } else {
      allIds.add(id);
    }
  });
});

console.log(`📚 Sách trùng ID:`, [...duplicateIds]);

// function removeDuplicateBooks(data) {
//   const seenIds = new Set();
//   const cleanedData = {};

//   for (const [category, books] of Object.entries(data)) {
//     cleanedData[category] = [];

//     books.forEach((book) => {
//       const id = book.id.trim().toLowerCase();
//       if (!seenIds.has(id)) {
//         seenIds.add(id);
//         cleanedData[category].push(book);
//       }
//     });
//   }

//   return cleanedData;
// }

// function main() {
//   const cleaned = removeDuplicateBooks(data);

//   fs.writeFileSync(
//     path.resolve(__dirname, OUTPUT_CLEANED),
//     JSON.stringify(cleaned, null, 2),
//     "utf-8"
//   );

//   console.log(`✅ Đã ghi dữ liệu đã lọc trùng vào: ${OUTPUT_CLEANED}`);
//   const originalCount = Object.values(data).reduce(
//     (sum, arr) => sum + arr.length,
//     0
//   );
//   const cleanedCount = Object.values(cleaned).reduce(
//     (sum, arr) => sum + arr.length,
//     0
//   );

//   console.log(`📉 Trước: ${originalCount} sách`);
//   console.log(
//     `📈 Sau: ${cleanedCount} sách (đã loại bỏ ${
//       originalCount - cleanedCount
//     } sách trùng ID)`
//   );
// }

// main();
