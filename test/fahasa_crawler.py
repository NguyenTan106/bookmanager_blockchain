import json
import time
from bs4 import BeautifulSoup
import undetected_chromedriver as uc


def remove_diacritics(text):
    return text.normalize("NFD").encode("ascii", "ignore").decode("utf-8")


def crawl_fahasa_books(total_pages=1, delay=1):
    books = []

    driver = uc.Chrome(
        headless=False,
        use_subprocess=True,
        options=None,
        args=[
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled",
        ]
    )

    try:
        driver.set_page_load_timeout(30)

        # Tránh bị phát hiện là bot
        driver.execute_cdp_cmd(
            "Page.addScriptToEvaluateOnNewDocument",
            {
                "source": """Object.defineProperty(navigator, 'webdriver', {get: () => false})"""
            },
        )

        driver.execute_cdp_cmd(
            "Network.setUserAgentOverride",
            {
                "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36"
            },
        )

        for p in range(1, total_pages + 1):
            url = f"https://www.fahasa.com/sach-trong-nuoc.html?p={p}"
            print(f"🔍 Đang xử lý trang {p}: {url}")

            driver.get(url)
            time.sleep(delay)

            soup = BeautifulSoup(driver.page_source, "html.parser")
            items = soup.select("li div.item-inner")

            for item in items:
                try:
                    title_tag = item.select_one(
                        "h2.product-name-no-ellipsis a")
                    if not title_tag:
                        continue
                    title = title_tag.get_text(strip=True)
                    book_url = title_tag["href"]

                    # Crawl chi tiết
                    driver.get(book_url)
                    time.sleep(delay)

                    detail = BeautifulSoup(driver.page_source, "html.parser")
                    description_tag = detail.select_one("div.std")
                    description = description_tag.get_text(
                        strip=True) if description_tag else ""

                    breadcrumb = detail.select("ol.breadcrumb li a")
                    category = breadcrumb[1].get_text(
                        strip=True) if len(breadcrumb) >= 2 else "khác"

                    books.append({
                        "title": title,
                        "description": description,
                        "category": category
                    })

                    print(f"✅ {title} [{category}]")
                except Exception as e:
                    print(f"⚠️ Lỗi khi xử lý sách: {e}")

    finally:
        if driver:
            driver.quit()
            driver = None  # tránh __del__ gọi lại

    return books


if __name__ == "__main__":
    all_books = crawl_fahasa_books(total_pages=1, delay=2)

    with open("fahasa_books_cleaned.json", "w", encoding="utf-8") as f:
        json.dump(all_books, f, ensure_ascii=False, indent=2)

    print(f"\n📚 Đã lưu {len(all_books)} sách vào fahasa_books_cleaned.json")
    print("📌 Một vài sách đầu tiên:")
    print(json.dumps(all_books[:3], indent=2, ensure_ascii=False))
