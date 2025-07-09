const fs = require("fs");
const path = require("path");
const INPUT_FILE = path.join(__dirname, "../assets/sample.json");
function isMissingField(book) {
  const requiredFields = [
    "subtitle",
    "description",
    "author",
    "pages",
    "publishedDate",
    "language",
    "imageLink",
  ];

  return requiredFields.some((field) => !(field in book));
}

function checkBookCompleteness(data) {
  let totalBooks = 0;
  let completeBooks = 0;
  let incompleteBooks = 0;

  const categoryStats = {}; // để thống kê theo từng thể loại

  for (const [category, books] of Object.entries(data)) {
    let catTotal = 0;
    let catComplete = 0;
    let catIncomplete = 0;

    for (const book of books) {
      totalBooks++;
      catTotal++;

      if (isMissingField(book)) {
        incompleteBooks++;
        catIncomplete++;
      } else {
        completeBooks++;
        catComplete++;
      }
    }

    categoryStats[category] = {
      total: catTotal,
      complete: catComplete,
      incomplete: catIncomplete,
    };
  }

  console.log("📊 Tổng quan:");
  console.log(`- Tổng số sách: ${totalBooks}`);
  console.log(`- ✅ Đủ thông tin: ${completeBooks}`);
  console.log(`- ❌ Thiếu thông tin: ${incompleteBooks}\n`);

  //   console.log("📚 Thống kê theo thể loại:");
  //   for (const [category, stat] of Object.entries(categoryStats)) {
  //     console.log(
  //       `- ${category}: ${stat.complete} đủ / ${stat.incomplete} thiếu / ${stat.total} tổng`
  //     );
  //   }
}
const data = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
checkBookCompleteness(data);
