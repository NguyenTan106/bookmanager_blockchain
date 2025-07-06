from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
import json
from bs4 import BeautifulSoup

# Cấu hình Chrome thật
options = Options()
options.add_argument("--headless")  # Chạy ngầm không mở cửa sổ
options.add_argument("--disable-gpu")
options.add_argument("--window-size=1920x1080")
options.add_argument(
    "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36")

# Mở trình duyệt
driver = webdriver.Chrome(options=options)


def remove_diacritics(s):
    import unicodedata
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("utf-8")


def crawl_books(pages=2):
    all_books = []
    base_url = "https://www.fahasa.com/sach-trong-nuoc.html?p={}"

    for page in range(1, pages + 1):
        url = base_url.format(page)
        print(f"🔍 Crawling page {page}: {url}")
        driver.get(url)
        time.sleep(2)  # chờ trang load

        soup = BeautifulSoup(driver.page_source, "html.parser")
        products = soup.select("li.item.product.product-item")

        for item in products:
            try:
                title_tag = item.select_one("a.product-item-link")
                title = title_tag.text.strip()
                link = title_tag["href"]

                # Truy cập trang chi tiết
                driver.get(link)
                time.sleep(1.5)

                detail_soup = BeautifulSoup(driver.page_source, "html.parser")

                desc_tag = detail_soup.select_one("div.std")
                description = desc_tag.get_text(strip=True) if desc_tag else ""

                breadcrumb = detail_soup.select("ul.breadcrumbs li")
                category = breadcrumb[1].text.strip() if len(
                    breadcrumb) >= 2 else "khac"

                all_books.append({
                    "title": title,
                    "description": description,
                    "label": remove_diacritics(category).lower()
                })

            except Exception as e:
                print(f"⚠️ Lỗi khi crawl sách: {e}")

    return all_books


books = crawl_books(pages=2)

# Lưu ra JSON
with open("fahasa_books_selenium.json", "w", encoding="utf-8") as f:
    json.dump(books, f, ensure_ascii=False, indent=2)

print(
    f"✅ Đã crawl xong {len(books)} sách. Lưu vào 'fahasa_books_selenium.json'")

driver.quit()
