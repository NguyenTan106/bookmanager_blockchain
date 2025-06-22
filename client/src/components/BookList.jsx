import React, { useState, useEffect } from "react";
import "./BookList.css";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import BookDetailPopup from "./BookDetailPopup";
import BookAuthor from "./BookAuthor";
import EditBookPopup from "./EditBookPopup";

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
}) {
  const [editingBook, setEditingBook] = useState(null); // sách đang sửa
  const [editForm, setEditForm] = useState({
    title: "",
    price: "",
    oldPdfHash: "",
    oldCoverHash: "",
  }); // form sửa sách
  const [selectedBook, setSelectedBook] = useState(null);
  const [showFullPDF, setShowFullPDF] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const itemsPerPage = 4;
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem("currentPage");
    return saved ? parseInt(saved, 10) : 1;
  });
  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  const openEditPopup = (book) => {
    setEditingBook(book);
    setEditForm({
      title: book.title,
      price: book.price,
      oldPdfHash: book.ipfsHash, // giữ lại file PDF cũ
      oldCoverHash: book.coverImageHash || "",
    });
  };

  const closePopup = () => {
    setEditingBook(null);
    setEditForm({ title: "", price: "" });
  };

  const submitUpdate = () => {
    if (!editForm.title || !editForm.price) {
      alert("Vui lòng nhập đầy đủ tiêu đề sách.");
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

  const hasBorrowed = (book) => {
    return book.borrows?.some(
      (b) => b.borrower.toLowerCase() === account.toLowerCase()
    );
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
      <h3>Book List</h3>
      <Row>
        {books.length === 0 ? (
          <p>No books yet.</p>
        ) : (
          paginatedBooks.map((book, index) => (
            <Col
              className="text-center col-lg-3 col-12 mb-4 book-item"
              bg="Success"
              onClick={() => {
                if (isAdmin) {
                  setSelectedBook(book);
                } else {
                  return;
                }
              }}
              key={index}
            >
              <div>
                <strong>{book.title}</strong> by
                <BookAuthor
                  owner={book.performedBy}
                  bookContract={bookContract}
                />{" "}
                -{" "}
                <u>
                  <i>{book.price || 0} ETH</i>
                </u>
              </div>
              <div>
                <strong>Trạng thái:</strong>{" "}
                {isAdmin ? (
                  book.status == 0 ? (
                    "Available"
                  ) : (
                    "Borrowed"
                  )
                ) : book.hasBought ? (
                  <span className="text-success">Đã mua ✅</span>
                ) : hasBorrowed(book) ? (
                  "Borrowed"
                ) : (
                  "Available"
                )}
              </div>
              <div>
                <img
                  src={`https://ipfs.io/ipfs/${book.coverImageHash}`}
                  alt="Ảnh bìa"
                  style={{
                    width: "50%",
                    height: "190px",
                    borderRadius: "8px",
                    marginTop: "5px",
                  }}
                />
              </div>
              <div>
                {(userRole !== "user" ||
                  (book.borrows || []).some(
                    (b) => b.borrower.toLowerCase() === account.toLowerCase()
                  )) && (
                  <>
                    <div></div>
                    <Button
                      className="mt-2"
                      variant="secondary"
                      onClick={() => {
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
              {userRole === "user" &&
                (hasBorrowed(book) ? (
                  <>
                    <Button
                      className="mt-2"
                      onClick={() => handleReturn(book.id)}
                    >
                      🔄 Trả sách
                    </Button>
                    <p>
                      📅 Hết hạn:{" "}
                      {new Date(
                        Number(
                          book.borrows.find(
                            (b) =>
                              b.borrower.toLowerCase() === account.toLowerCase()
                          )?.returnDate || 0
                        ) * 1000
                      ).toLocaleDateString()}
                    </p>
                  </>
                ) : book.hasBought ? (
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
          <div className="d-flex justify-content-center mt-3">
            <Button
              variant="outline-secondary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="me-2"
            >
              ◀️
            </Button>
            <span style={{ lineHeight: "38px" }}>
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline-secondary"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ms-2"
            >
              ▶️
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
        />
      )}

      {/* Popup chi tiết sách */}
      {selectedBook && (
        <BookDetailPopup
          book={selectedBook}
          bookContract={bookContract}
          onClose={() => setSelectedBook(null)}
          hasBorrowed={hasBorrowed}
          hasBought={hasBought}
          isAdmin={isAdmin}
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
        />
      )}
    </>
  );
}
