import React, { useState, useEffect, useRef } from "react";
import { searchBooks } from "../services/searchApi";
import { Container, Form, Button, Spinner } from "react-bootstrap";
import { fetchBooks } from "../services/bookApi";
export default function SearchPage({
  setBooks,
  books,
  bookContract,
  account,
  loadBooks,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const firstLoad = useRef(true); // 👈 ref để tránh gọi khi vừa load trang

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (firstLoad.current) {
        firstLoad.current = false;
        return; // ❌ Bỏ qua lần đầu
      }

      if (query.trim() !== "") {
        handleSearch(query);
      } else {
        setResults([]);
        await loadBooks(); // ✅ Chỉ gọi khi người dùng xóa truy vấn
      }
    }, 100); // bạn có thể để 300ms cho mượt

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSearch = async (e) => {
    setLoading(true);

    try {
      const res = await searchBooks(query, account);
      // console.log(res);
      setResults(res);
      setBooks(res);
    } catch (err) {
      console.error("❌ Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form className="d-flex justify-content-end">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "350px",
          border: "1px solid #ccc",
          borderRadius: "30px",
          padding: "0rem 1rem",
          backgroundColor: "#fff",
        }}
      >
        <span role="img" aria-label="search" style={{ marginRight: "8px" }}>
          🔍
        </span>
        <Form.Control
          type="text"
          placeholder="Nhập từ khoá..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            border: "none",
            boxShadow: "none",
            outline: "none",
            backgroundColor: "transparent",
          }}
        />
        <Button
          variant="none"
          style={{ width: "50px", height: "38px", border: "none" }}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" animation="border" /> : ""}
        </Button>
      </div>
    </Form>
  );
}
