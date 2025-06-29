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
    // const delayDebounce = setTimeout(() => {
    //   if (query.trim() !== "") {
    //     handleSearch(query);
    //   }
    // }, 100); // ⏳ 500ms sau khi gõ xong mới tìm

    // return () => clearTimeout(delayDebounce); // ❌ Clear timeout nếu user vẫn đang gõ
    handleSearch(query);
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
    <Container className="my-4">
      <h2 className="mb-4 ">🔍 Tìm kiếm sách</h2>

      <Form className="d-flex justify-content-left mb-4">
        <Form.Control
          type="text"
          placeholder="Nhập từ khoá..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "400px" }}
        />
        <Button
          variant="none"
          style={{ width: "50px", height: "38px", border: "none" }}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" animation="border" /> : ""}
        </Button>
      </Form>

      {/* {loading && <p className="text-center">⏳ Đang tìm kiếm...</p>} */}

      {/* <Row>
        {books === null && query && !loading && (
          <p className="text-center">❗Không tìm thấy kết quả nào.</p>
        )}
        {books.map((book) => (
          <Col key={book.id} md={6} lg={4} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>{book.title}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  📚{" "}
                  {(
                    <BookAuthor
                      owner={book.performedBy}
                      bookContract={bookContract}
                    />
                  ) || "Không rõ"}{" "}
                  | 💰 {book.price} ETH
                </Card.Subtitle>
                <Card.Text style={{ minHeight: "4em" }}>
                  {book.description?.slice(0, 120) || "Không có mô tả"}...
                </Card.Text>
                <div className="mb-2">
                  {book.category?.map((cat, idx) => (
                    <Badge bg="secondary" className="me-1" key={idx}>
                      {cat.name}
                    </Badge>
                  ))}
                </div>
                <p className="mb-0">
                  <strong>⚡ Score:</strong> {book.score?.toFixed(4)}
                </p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row> */}
    </Container>
  );
}
