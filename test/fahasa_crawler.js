const puppeteer = require("puppeteer");
const fs = require("fs");

function removeDiacritics(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

(async () => {
  const browser = await puppeteer.launch({ headless: "new" }); // đổi thành false nếu muốn thấy trình duyệt
  const page = await browser.newPage();

  const totalPages = 1; // số trang muốn crawl
  const books = [];

  for (let p = 1; p <= totalPages; p++) {
    const url = `https://www.fahasa.com/sach-trong-nuoc.html?p=${p}`;
    console.log(`🔍 Đang xử lý trang ${p}: ${url}`);
    await page.goto(url, { waitUntil: "networkidle0" });
    // await page.waitForTimeout(2000);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36"
    );
    console.log(page);
    // Lấy danh sách sách
    const productLinks = await page.$$eval("a.product-item-link", (links) =>
      links.map((el) => ({
        title: el.innerText.trim(),
        url: el.href,
      }))
    );

    for (const product of productLinks) {
      try {
        await page.goto(product.url, { waitUntil: "domcontentloaded" });

        const description = await page
          .$eval("div.std", (el) => el.innerText.trim())
          .catch(() => "");

        const breadcrumb = await page.$$eval("ul.breadcrumbs li", (items) =>
          items.map((i) => i.innerText.trim())
        );

        const category = breadcrumb.length >= 2 ? breadcrumb[1] : "khac";

        books.push({
          title: product.title,
          description,
          label: removeDiacritics(category.toLowerCase()),
        });

        console.log(`✅ ${product.title} [${category}]`);
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.warn(`⚠️ Lỗi khi crawl: ${product.url}`, err.message);
      }
    }
  }

  // Lưu file JSON
  fs.writeFileSync(
    "fahasa_books_puppeteer.json",
    JSON.stringify(books, null, 2),
    "utf-8"
  );
  console.log("\n📚 Một vài sách đầu tiên:");
  console.log(books.slice(0, 3)); // in 3 sách đầu

  console.log(
    `🎉 Crawl xong ${books.length} sách. Lưu vào fahasa_books_puppeteer.json`
  );
  await browser.close();
})();
