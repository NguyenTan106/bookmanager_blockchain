const axios = require("axios");

const keyword = [
  "kỹ năng",
  "lập trình",
  "việt nam",
  "kinh tế",
  "tâm lý",
  "tiếng việt",
]; // 🔁 có thể thay đổi bằng input, v.v.

const handleResponseApiBookFromGG = async (maxItems = 120) => {
  const perPage = 40;
  const bookList = [];

  for (let startIndex = 0; startIndex < maxItems; startIndex += perPage) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      keyword
    )}&startIndex=${startIndex}&maxResults=${perPage}`;

    try {
      const res = await axios.get(url);
      const items = res.data.items || [];

      for (const item of items) {
        const info = item.volumeInfo;
        if (!info.description || !info.categories) continue;

        bookList.push({
          title: info.title,
          subtitle: info.subtitle || "",
          description: info.description,
          category: info.categories.join(", "),
        });
      }

      // Nếu ít hơn 40 kết quả => hết sách => dừng luôn
      if (items.length < perPage) break;
    } catch (err) {
      console.error("Lỗi khi gọi API:", err.message);
      break;
    }
  }

  return bookList;
};
// (async () => {
//   const books = await handleResponseApiBookFromGG(10); // <= lấy tối đa 120 kết quả
//   console.log(`✅ Tổng số sách lấy được: ${books.length}`);
//   //   console.log(books.slice(0, 3)); // In thử 3 cuốn đầu
// })();

module.exports = { handleResponseApiBookFromGG };
