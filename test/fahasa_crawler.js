const puppeteer = require("puppeteer");
const fs = require("fs");

function removeDiacritics(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // Để kiểm tra giao diện thật (headless: "new" vẫn bị chặn ở 1 số site)
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36"
  );

  // Tránh bị phát hiện là bot
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const totalPages = 1; // số trang muốn crawl
  const books = [];

  for (let p = 1; p <= totalPages; p++) {
    const url = `https://www.fahasa.com/sach-trong-nuoc.html?p=${p}`;
    console.log(`🔍 Đang xử lý trang ${p}: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const productLinks = await page.$$eval("li div.item-inner", (items) =>
      items.map((el) => {
        const title =
          el.querySelector("h2.product-name-no-ellipsis a")?.innerText.trim() ||
          "";
        const url =
          el.querySelector("h2.product-name-no-ellipsis a")?.href || "";
        const img =
          el.querySelector("a.product-image img")?.getAttribute("data-src") ||
          "";
        const priceNew =
          el.querySelector("p.special-price span.price")?.innerText.trim() ||
          "";
        const priceOld =
          el.querySelector("p.old-price span.price")?.innerText.trim() || "";
        const discount =
          el.querySelector("span.discount-percent")?.innerText.trim() || "";
        const ratingCount =
          el.querySelector("div.rating-links")?.innerText.trim() || "0";

        return {
          title,
          url,
          image: img,
          priceNew,
          priceOld,
          discount,
          ratingCount,
        };
      })
    );

    for (const product of productLinks) {
      try {
        await page.goto(product.url, { waitUntil: "networkidle2" });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const description = await page
          .$eval("div.std", (el) => el.innerText.trim())
          .catch(() => "");

        const breadcrumb = await page.$$eval("ol.breadcrumb li", (items) =>
          items.map((i) => i.innerText.trim())
        );

        const category = breadcrumb.length >= 2 ? breadcrumb[1] : "khac";

        books.push({
          title: product.title,
          description,
          label: category,
        });

        console.log(`✅ ${product.title} [${category}]`);
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.warn(`⚠️ Lỗi khi crawl: ${product.url}`, err.message);
      }
    }
  }

  // Ghi file JSON
  fs.writeFileSync(
    "fahasa_books_puppeteer.json",
    JSON.stringify(books, null, 2),
    "utf-8"
  );

  console.log("\n📚 Một vài sách đầu tiên:");
  console.log(books.slice(0, 3)); // in 3 sách đầu tiên

  console.log(
    `🎉 Crawl xong ${books.length} sách. Lưu vào fahasa_books_puppeteer.json`
  );
  await browser.close();
})();
