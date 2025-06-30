import React, { useState, useEffect } from "react";
import { Table, Button, Badge } from "react-bootstrap";
import BookAuthor from "./BookAuthor";
import { fetchCategories } from "../services/categoryApi";
import EditBookPopup from "./EditBookPopup";
import BookDetailPopup from "./BookDetailPopup";
import "./BookList.css";
import { sortBooks } from "../services/bookApi";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
export default function BookListTableView({
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
  sortManage,
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
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem("currentPage");
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    const totalPages = Math.ceil(books.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [books, currentPage, itemsPerPage]);

  useEffect(() => {
    const loadData = async () => {
      const cats = await loadCategories(); // load xong categories
      setCategories(cats);
      await sortManage(); // gọi sau khi categories có rồi
    };

    loadData();
  }, []);

  const openEditPopup = async (book) => {
    setEditingBook(book);
    // console.log(book.categoryIds);
    setEditForm({
      title: book.title,
      category: book.category || [], // thêm category nếu có
      price: book.price,
      oldPdfHash: book.ipfsHash, // giữ lại file PDF cũ
      oldCoverHash: book.coverImageHash || "",
      description: book.description, // thêm mô tả nếu có
    });
    await loadCategories();
    console.log(book.category);
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
  const submitDelete = (bookId, title) => {
    if (
      window.confirm(
        `❗ Bạn có chắc chắn muốn xóa sách: "${title}" (ID: ${bookId}) không?`
      )
    ) {
      handleDelete(bookId, selectedBook.owner);
    }
  };

  return (
    <>
      <Table
        striped
        bordered
        hover
        responsive
        style={{ verticalAlign: "middle" }}
      >
        <thead>
          <tr>
            <th style={{ width: "5%" }}>ID</th>
            <th>Tên sách</th>
            <th style={{ width: "25%" }}>Loại sách</th>
            <th style={{ width: "10%" }}>Tác giả</th>
            <th style={{ width: "10%" }}>Giá (ETH)</th>
            <th style={{ width: "10%" }}>Trạng thái</th>
            <th style={{ width: "15%" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {books.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center text-muted">
                Không có sách nào
              </td>
            </tr>
          ) : (
            paginatedBooks.map((book) => (
              <tr key={book.id}>
                <td>{book.id}</td>
                <td>{book.title}</td>
                <td>
                  {book.category?.map((cat, idx) => (
                    <Badge bg="secondary" className="me-1" key={idx}>
                      {cat.name}
                    </Badge>
                  ))}
                </td>
                <td>
                  <BookAuthor
                    owner={book.performedBy}
                    bookContract={bookContract}
                  />
                </td>
                <td>{book.price}</td>
                <td>
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
                    } else if (book.hasBought) {
                      label = "Đã mua";
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
                </td>
                <td>
                  {userRole === "user" &&
                    (hasBorrowed(book) ? (
                      <>
                        <Button
                          className="mt-2"
                          onClick={() => handleReturn(book.id)}
                        >
                          🔄 Trả sách
                        </Button>
                        <p className="mt-1">
                          📅 Hết hạn:{" "}
                          {book.borrows.find(
                            (b) =>
                              b.borrower.toLowerCase() === account.toLowerCase()
                          )?.returnDate || 0}
                        </p>
                      </>
                    ) : book.hasBought ? (
                      <Button
                        className="mt-2"
                        variant="info"
                        onClick={() => setSelectedBook(book)}
                      >
                        📚 <span className="d-none d-sm-inline">Chi tiết</span>
                      </Button>
                    ) : (
                      <div className="mt-2">
                        <Button
                          onClick={() => handleBorrow(book.id, book.price)}
                        >
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
                      className=""
                      variant="info"
                      onClick={() => setSelectedBook(book)}
                      style={{
                        padding: "5px 10px",
                        fontSize: "14px",
                      }}
                    >
                      📚 <span className="d-none d-sm-inline">Chi tiết</span>
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center mt-4">
          <Button
            variant="outline-primary"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="me-2"
          >
            <FaAngleLeft /> Trước
          </Button>

          {/* Trang hiện tại và xung quanh */}
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
                    pageNum === currentPage ? "primary" : "outline-primary"
                  }
                  onClick={() => handlePageChange(pageNum)}
                  className="mx-1"
                >
                  {pageNum}
                </Button>
              );
            } else if (
              (pageNum === currentPage - 2 && currentPage > 3) ||
              (pageNum === currentPage + 2 && currentPage < totalPages - 2)
            ) {
              return (
                <span key={pageNum} className="mx-1 text-muted">
                  ...
                </span>
              );
            }
            return null;
          })}

          <Button
            variant="outline-primary"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ms-2"
          >
            Sau <FaAngleRight />
          </Button>
        </div>
      )}
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
