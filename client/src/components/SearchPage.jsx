import React, { useState, useEffect } from "react";
import { searchBooks } from "../services/searchApi";
import { Container, Form, Button, Spinner } from "react-bootstrap";
import BookAuthor from "./BookAuthor";
import BookList from "./BookList";
export default function SearchPage({ setBooks, books, bookContract }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // ⏱ Debounce timer
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim() !== "") {
        handleSearch(query);
      }
    }, 100); // ⏳ 500ms sau khi gõ xong mới tìm

    return () => clearTimeout(delayDebounce); // ❌ Clear timeout nếu user vẫn đang gõ
  }, [query]);

  const handleSearch = async (e) => {
    setLoading(true);

    try {
      const res = await searchBooks(query);
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
