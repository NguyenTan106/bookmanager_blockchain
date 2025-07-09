const keywords = ["đắc nhân tâm"];
const sample = require("./books.json");

const bookCounts = {};
for (const category in sample) {
  bookCounts[category] = sample[category].length;
}

console.log(bookCounts);
console.log(`Tổng số thể loại: ${Object.keys(sample).length}`);

const allIds = new Set();
const duplicateIds = new Set();

Object.values(sample).forEach((books) => {
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

module.exports = { keywords };
