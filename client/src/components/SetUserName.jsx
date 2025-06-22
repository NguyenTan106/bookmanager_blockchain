import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Spinner } from "react-bootstrap";

export default function SetUserName({
  bookContract,
  account,
  username,
  setUsername,
  currentUsername,
  setCurrentUsername,
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Load username hiện tại
  const fetchUsername = async () => {
    if (bookContract && account) {
      try {
        const name = await bookContract.methods.usernames(account).call();
        setCurrentUsername(name);
      } catch (err) {
        console.error("Lỗi khi lấy username:", err);
      }
    }
  };

  useEffect(() => {
    fetchUsername();
  }, [bookContract, account]);

  const handleSetUsername = async () => {
    if (!username.trim()) {
      alert("Tên không được để trống!");
      return;
    }

    try {
      setLoading(true);
      setStatus("⏳ Đang kiểm tra tên...");

      // Kiểm tra tên đã được ai đặt chưa
      const owner = await bookContract.methods.usedNames(username).call();
      if (owner) {
        alert("❌ Tên này đã được sử dụng, vui lòng chọn tên khác!");
        setStatus("❌ Tên đã tồn tại.");
        setLoading(false);
        return;
      }

      setStatus("⏳ Đang đặt tên...");
      await bookContract.methods.setUsername(username).send({ from: account });

      setStatus("✅ Đặt tên thành công!");
      setUsername("");
      fetchUsername();

      window.location.reload();
    } catch (err) {
      console.error("Lỗi khi đặt tên:", err);
      setStatus("❌ Đặt tên thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4 mb-3">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6} className="text-center">
          <h5>👤 {currentUsername || "Chưa đặt"}</h5>

          <Form className="d-flex justify-content-center align-items-center mt-3">
            <Form.Group className="me-2 mb-0" controlId="usernameInput">
              <Form.Control
                type="text"
                placeholder="Ví dụ: nohan.eth"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                style={{ minWidth: "220px" }}
              />
            </Form.Group>
            <Button
              variant="outline-secondary"
              style={{ width: "50px", height: "38px", border: "none" }}
              onClick={handleSetUsername}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" animation="border" /> : "✏️"}
            </Button>
          </Form>

          {/* Nếu muốn hiện trạng thái */}
          {/* {status && <Alert variant="info" className="mt-2">{status}</Alert>} */}
        </Col>
      </Row>
    </Container>
  );
}
