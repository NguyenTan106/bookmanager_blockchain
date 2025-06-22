import { uploadPDF, uploadImage } from "../ipfs";
import React, { useState, useRef } from "react";
import { Container, Button, Col, Form, Row } from "react-bootstrap";
import UploadCoverImage from "./UploadCoverImage";
export default function AddBook({
  form,
  setForm,
  bookContract,
  account,
  loadBooks,
}) {
  const [pdfFile, setPdfFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const fileImageRef = useRef(null);

  const handleUploadAndAddBook = async () => {
    console.log(form);
    if (!pdfFile || !form.title || !form.price || !imageFile) {
      alert("Thiếu thông tin hoặc file PDF");
      return;
    }

    // Kiểm tra tên sách đã dùng chưa
    const isUsed = await bookContract.methods.isTitleUsed(form.title).call();
    if (isUsed) {
      alert("Tên sách đã tồn tại, vui lòng chọn tên khác");
      return;
    }

    // ✅ Kiểm tra người dùng đã đặt username chưa
    const username = await bookContract.methods.usernames(account).call();
    if (!username || username.trim() === "") {
      alert("❗ Bạn cần đặt tên tài khoản trước khi thêm sách.");
      return;
    }

    try {
      setUploading(true);

      // Upload file PDF lên IPFS
      const ipfsHash = await uploadPDF(pdfFile);
      console.log("Uploaded IPFS hash:", ipfsHash);

      if (!ipfsHash || typeof ipfsHash !== "string") {
        alert("❌ Lỗi IPFS");
        setUploading(false);
        return;
      }

      // Nếu có ảnh bìa, upload lên IPFS
      const imageIpfsHash = await uploadImage(imageFile);
      console.log("Uploaded cover image IPFS hash:", imageIpfsHash);
      if (!imageIpfsHash || typeof imageIpfsHash !== "string") {
        alert("❌ Lỗi IPFS khi upload ảnh bìa");
        setUploading(false);
        return;
      }
      // Gọi smart contract: chỉ cần truyền title + ipfsHash
      await bookContract.methods
        .addBook(form.title, ipfsHash, imageIpfsHash, Number(form.price))
        .send({ from: account });

      // Reset lại form
      setForm({ title: "", price: 0, pdfHash: "", coverImageHash: "" });
      setPdfFile(null);
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      if (fileImageRef.current) {
        fileImageRef.current.value = null;
      }

      await loadBooks(bookContract);
      alert("✅ Thêm sách thành công!");
    } catch (err) {
      console.error("❌ Lỗi khi thêm sách:", err);
      alert("❌ Thêm sách thất bại");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container className="mb-4">
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <Row className="g-3 align-items-start">
            {/* Cột trái: thông tin sách */}
            <Col xs={12} md={7}>
              <Form.Group className="mb-3">
                <Form.Label>📖 Tiêu đề sách</Form.Label>
                <Form.Control
                  placeholder="Nhập tiêu đề..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>💰 Giá (ETH)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Nhập giá..."
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>📄 Tệp PDF</Form.Label>
                <div className="d-flex align-items-center">
                  <Form.Control
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files[0])}
                    style={{ display: "none" }}
                    ref={fileInputRef}
                  />
                  <Button
                    style={{
                      padding: "5px 10px",
                      fontSize: "14px",
                    }}
                    variant="outline-primary"
                    onClick={() => fileInputRef.current.click()}
                  >
                    📁 Chọn PDF
                  </Button>
                  {pdfFile && (
                    <span
                      className="ms-2 small text-truncate"
                      style={{ maxWidth: "200px" }}
                    >
                      {pdfFile.name}
                    </span>
                  )}
                </div>
              </Form.Group>

              <div className="text-center mt-4">
                <Button
                  variant="primary"
                  onClick={handleUploadAndAddBook}
                  disabled={uploading}
                >
                  {uploading ? "📤 Đang tải lên..." : "📥 Thêm sách"}
                </Button>
              </div>
            </Col>

            {/* Cột phải: ảnh bìa */}
            <Col xs={12} md={5}>
              <UploadCoverImage
                setImageFile={setImageFile}
                imageFile={imageFile}
                fileImageRef={fileImageRef}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
}
