const sample = require("../assets/sample.json");

const bookCounts = {};
let totalBooks = 0;

for (const category in sample) {
  const count = sample[category].length;
  bookCounts[category] = count;
  totalBooks += count;
}

console.log(bookCounts);
console.log(`Tổng số thể loại: ${Object.keys(sample).length}`);
console.log(`Tổng số sách: ${totalBooks}`);
