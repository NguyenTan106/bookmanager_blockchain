import React, { useState, useEffect } from "react";
import "./BookList.css";
import { Row, Button, Col, Badge, Form } from "react-bootstrap";
import BookDetailPopup from "./BookDetailPopup";
import BookAuthor from "./BookAuthor";
import EditBookPopup from "./EditBookPopup";
import { fetchCategories } from "../services/categoryApi";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
export default function BookList({
  books,
  handleBorrow,
  handleBuy,
  hasBought,
  handleReturn,
  account,
  handleUpdate,
  handleDelete,
  isAdmin,
  userRole,
  handleRevoke,
  bookContract,
  hasBorrowed,
  username,
  setUserName,
  isSuperAdmin,
}) {
  const [editingBook, setEditingBook] = useState(null); // sách đang sửa
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    price: "",
    oldPdfHash: "",
    oldCoverHash: "",
    description: "", // thêm mô tả
  }); // form sửa sách
  const [selectedBook, setSelectedBook] = useState(null);
  const [showFullPDF, setShowFullPDF] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [categories, setCategories] = useState([]);

  const itemsPerPage = 4;
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem("currentPage");
    return saved ? parseInt(saved, 10) : 1;
  });

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      const formatted = data.map((cat) => ({
        id: cat.id,
        value: cat.name,
        label: cat.name,
      }));
      // console.log("Thể loại:", formatted);

      setCategories(formatted);
    } catch (err) {
      console.error("Lỗi lấy thể loại:", err);
    }
  };

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    const totalPages = Math.ceil(books.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [books, currentPage, itemsPerPage]);

  const openEditPopup = async (book) => {
    setEditingBook(book);
    // console.log(book.categoryIds);
    setEditForm({
      title: book.title,
      category: book.category, // thêm category nếu có
      price: book.price,
      oldPdfHash: book.ipfsHash, // giữ lại file PDF cũ
      oldCoverHash: book.coverImageHash || "",
      description: book.description, // thêm mô tả nếu có
    });
    await loadCategories();
    // console.log(book.category);
  };

  const closePopup = () => {
    setEditingBook(null);
    setEditForm({ title: "", category: "", price: "", description: "" });
  };

  const submitUpdate = () => {
    if (!editForm.title || !editForm.price) {
      alert("Vui lòng nhập đầy đủ tiêu đề sách.");
      return;
    }
    // ✅ So sánh các trường quan trọng
    const isUnchanged =
      editForm.title === editingBook.title &&
      editForm.price === editingBook.price &&
      editForm.description === editingBook.description &&
      editForm.category === editingBook.category &&
      !pdfFile &&
      !imageFile;

    if (isUnchanged) {
      alert("Không có thay đổi nào.");
      return;
    }
    handleUpdate(
      Number(editingBook.id),
      editForm,
      editingBook.owner,
      editingBook.title,
      pdfFile,
      imageFile
    );
    closePopup();
  };

  const submitDelete = (bookId, title) => {
    if (
      window.confirm(
        `❗ Bạn có chắc chắn muốn xóa sách: "${title}" (ID: ${bookId}) không?`
      )
    ) {
      handleDelete(bookId, selectedBook.owner);
    }
  };

  // Tính tổng số trang
  const totalPages = Math.ceil(books.length / itemsPerPage);

  // Tính mảng sách hiển thị cho trang hiện tại
  const paginatedBooks = books.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Xử lý chuyển trang
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <Row>
        {books.length === 0 ? (
          <p>No books yet.</p>
        ) : (
          paginatedBooks.map((book, index) => (
            <Col
              className="text-center col-lg-3 col-12 mb-4 book-item"
              bg="Success"
              onClick={() => {
                if (isAdmin || book.hasPurchased) {
                  setSelectedBook(book);
                } else {
                  return;
                }
              }}
              key={index}
            >
              <div>
                <strong>{book.title}</strong>
                <div>
                  👤
                  <BookAuthor
                    owner={book.performedBy}
                    bookContract={bookContract}
                    account={account}
                    username={username}
                    setUserName={setUserName}
                  />{" "}
                  | 💰
                  <u>
                    <i>{book.price || 0} ETH</i>
                  </u>
                </div>
              </div>
              <div className="mb-2">
                <strong>Trạng thái:</strong>{" "}
                {(() => {
                  let label = "Unknown";
                  let variant = "secondary";

                  if (isAdmin) {
                    if (book.status === "Available" || book.status === 0) {
                      label = "Available";
                      variant = "success";
                    } else {
                      label = "Borrowed";
                      variant = "warning";
                    }
                  } else if (book.hasPurchased) {
                    label = "Purchased";
                    variant = "info";
                  } else if (hasBorrowed(book)) {
                    label = "Borrowed";
                    variant = "warning";
                  } else {
                    label = "Available";
                    variant = "success";
                  }

                  return (
                    <Badge bg={variant} className="ms-2">
                      {label}
                    </Badge>
                  );
                })()}
              </div>

              <div
                style={{
                  width: "100%", // chiếm 100% của col
                  paddingTop: "80%", // tỷ lệ 2:3 (height/width * 100%)
                  position: "relative",
                  overflow: "hidden",
                  marginTop: "5px",
                }}
              >
                <img
                  src={`https://ipfs.io/ipfs/${book.coverImageHash}`}
                  alt="Ảnh bìa"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain", // hoặc "contain" nếu muốn toàn ảnh hiển thị
                  }}
                />
              </div>
              <div>
                {isAdmin && (
                  <>
                    <div></div>
                    <Button
                      className="mt-2"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPDF(book.ipfsHash);
                        setShowFullPDF(true);
                      }}
                    >
                      🔍 Phóng to PDF
                    </Button>
                  </>
                )}
              </div>

              {/* Các nút thao tác */}
              {!isAdmin &&
                (hasBorrowed(book) ? (
                  <>
                    <Button
                      className="mt-2"
                      variant="info"
                      onClick={() => setSelectedBook(book)}
                    >
                      📚 Chi tiết
                    </Button>
                  </>
                ) : book.hasPurchased ? (
                  <Button
                    className="mt-2"
                    variant="info"
                    onClick={() => setSelectedBook(book)}
                  >
                    📚 Chi tiết
                  </Button>
                ) : (
                  <div className="mt-2">
                    <Button onClick={() => handleBorrow(book.id, book.price)}>
                      📥 Mượn
                    </Button>
                    <Button
                      className="ms-2"
                      variant="success"
                      onClick={() => handleBuy(book.id, book.price)}
                    >
                      🛒 Mua
                    </Button>
                  </div>
                ))}

              {isAdmin && (
                <Button
                  className="mt-2"
                  variant="info"
                  onClick={() => setSelectedBook(book)}
                >
                  📚 Chi tiết
                </Button>
              )}
            </Col>
          ))
        )}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center flex-wrap gap-2 mt-4">
            <Button
              variant="outline-secondary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-pill px-3 fw-semibold shadow-sm hover-shadow transition-all"
              style={{ minWidth: "80px" }}
            >
              <FaAngleLeft className="me-1" />
              Trước
            </Button>

            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                Math.abs(currentPage - pageNum) <= 1
              ) {
                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === currentPage
                        ? "secondary"
                        : "outline-secondary"
                    }
                    onClick={() => handlePageChange(pageNum)}
                    className="rounded-circle fw-semibold"
                    style={{ width: "40px", height: "40px" }}
                  >
                    {pageNum}
                  </Button>
                );
              } else if (
                (pageNum === currentPage - 2 && currentPage > 3) ||
                (pageNum === currentPage + 2 && currentPage < totalPages - 2)
              ) {
                return (
                  <span
                    key={pageNum}
                    className="text-secondary mx-2"
                    style={{ fontWeight: "bold" }}
                  >
                    ...
                  </span>
                );
              }
              return null;
            })}
            <Button
              variant="outline-secondary"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-pill px-3 fw-semibold shadow-sm hover-shadow transition-all"
              style={{ minWidth: "80px" }}
            >
              Sau <FaAngleRight className="ms-1" />
            </Button>
          </div>
        )}
      </Row>
      {/* Hiển thị PDF phóng to */}
      {showFullPDF && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "10px", textAlign: "right" }}>
            <Button variant="light" onClick={() => setShowFullPDF(false)}>
              ❌ Đóng
            </Button>
          </div>
          <iframe
            src={`https://docs.google.com/gview?url=https://ipfs.io/ipfs/${selectedPDF}&embedded=true`}
            width="100%"
            height="100%"
            style={{ border: "none", flexGrow: 1 }}
            sandbox="allow-scripts allow-same-origin"
            title="Xem PDF phóng to"
          />
        </div>
      )}
      {/* Popup sửa sách */}
      {editingBook && (
        <EditBookPopup
          imageFile={imageFile}
          editForm={editForm}
          setEditForm={setEditForm}
          setPdfFile={setPdfFile}
          setImageFile={setImageFile}
          submitUpdate={submitUpdate}
          closePopup={closePopup}
          categories={categories}
          isMulti={true}
        />
      )}

      {/* Popup chi tiết sách */}
      {selectedBook && (
        <BookDetailPopup
          book={selectedBook}
          bookContract={bookContract}
          account={account}
          onClose={() => setSelectedBook(null)}
          hasBorrowed={hasBorrowed}
          hasBought={hasBought}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          userRole={userRole}
          handleBorrow={handleBorrow}
          handleUpdate={(book) => {
            setSelectedBook(null);
            openEditPopup(book);
          }}
          handleDelete={(bookId) => {
            setSelectedBook(null);
            submitDelete(bookId, selectedBook.title);
          }}
          handleRevokeUser={handleRevoke}
          setSelectedBook={setSelectedBook}
          handleReturn={handleReturn}
        />
      )}
    </>
  );
}
