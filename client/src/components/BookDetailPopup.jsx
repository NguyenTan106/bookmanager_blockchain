import React, { useState, useEffect } from "react";
import { Container, Badge } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import BookAuthor from "./BookAuthor";
import Web3 from "web3";
import { fetchCategories } from "../services/categoryApi";
export default function BookDetailPopup({
  book,
  onClose,
  isAdmin,
  userRole,
  handleBorrow,
  handleUpdate,
  handleDelete,
  handleRevokeUser,
  setSelectedBook,
  hasBorrowed,
  bookContract,
  handleOpenEdit,
}) {
  const [showBorrowers, setShowBorrowers] = useState(false);
  const [showBuyers, setShowBuyers] = useState(false);
  const [buyersList, setBuyersList] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories(); // [{ id, name }]
        const map = {};
        data.forEach((cat) => {
          map[cat.id] = cat.name;
        });
        setCategoryMap(map);
      } catch (err) {
        console.error("Lỗi tải thể loại:", err);
      }
    };

    loadCategories();
  }, []);
  useEffect(() => {
    const loadBuyers = async () => {
      if (bookContract && book && isAdmin) {
        const buyers = await fetchBuyersFromEvents(book.id);
        setBuyersList(buyers);
      }
    };

    if (showBuyers) loadBuyers();
  }, [showBuyers]);

  const fetchBuyersFromEvents = async (bookId) => {
    try {
      const events = await bookContract.getPastEvents("BookPurchased", {
        filter: { id: bookId },
        fromBlock: 0,
        toBlock: "latest",
      });

      const buyers = events.map((event) => ({
        address: event.returnValues.buyer,
        price: Web3.utils.fromWei(event.returnValues.price, "ether"),
        timestamp: event.timestamp, // hoặc lấy block để convert timestamp sau
      }));

      // Xóa trùng người mua nếu cần
      const uniqueBuyers = buyers.filter(
        (value, index, self) =>
          index === self.findIndex((b) => b.address === value.address)
      );

      return uniqueBuyers;
    } catch (error) {
      console.error("❌ Lỗi khi lấy buyers từ event logs:", error);
      return [];
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content col-8">
        <h4>📖 Chi tiết sách</h4>
        <p>
          <strong>ID:</strong> {book.id}
        </p>
        <p>
          <strong>Tiêu đề:</strong> {book.title}
        </p>
        <p>
          {userRole === "user" && (
            <>
              <strong>Tác giả:</strong>
              <BookAuthor
                owner={book.performedBy}
                bookContract={bookContract}
              />
            </>
          )}
          {isAdmin && (
            <>
              <strong>Tác giả:</strong> {book.owner}
            </>
          )}
        </p>
        <p>
          <strong>Loại sách:</strong>{" "}
          {book.category?.map((cat, idx) => (
            <Badge bg="secondary" className="me-1" key={idx}>
              {cat.name}
            </Badge>
          ))}
          {/* {book.category.map((cat) => cat.name).join(", ")} */}
        </p>
        <p>
          <strong>IPFS:</strong> {book.ipfsHash}
        </p>
        <p>
          <strong>CoverImage:</strong> {book.coverImageHash}
        </p>
        <p>
          <strong>Description:</strong> {book.description}
        </p>
        <p>
          <strong>Price:</strong>{" "}
          <u>
            <i>{book.price} ETH</i>
          </u>
        </p>
        <p>
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
        </p>

        {isAdmin && (
          <>
            <a
              href={`https://ipfs.io/ipfs/${book.ipfsHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Xem file PDF
            </a>
            <div></div>
            <a
              href={`https://ipfs.io/ipfs/${book.coverImageHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Xem ảnh
            </a>
          </>
        )}

        {book.hasBought && (
          <>
            <a
              href={`https://ipfs.io/ipfs/${book.ipfsHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Xem file PDF
            </a>
            <div></div>
            <a
              href={`https://ipfs.io/ipfs/${book.coverImageHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Xem ảnh
            </a>
          </>
        )}

        {isAdmin && (
          <div style={{ marginTop: "10px" }}>
            <Button variant="success" onClick={() => handleUpdate(book)}>
              ✏️ Sửa
            </Button>{" "}
            <Button variant="danger" onClick={() => handleDelete(book.id)}>
              🗑️ Xóa
            </Button>
          </div>
        )}

        {userRole === "user" && !book.hasBought && (
          <Button onClick={() => handleBorrow(book.id)}>📥 Mượn</Button>
        )}

        <div style={{ marginTop: 10 }}>
          {isAdmin && (
            <Button
              variant="info"
              onClick={() => setShowBorrowers(!showBorrowers)}
            >
              👥 {showBorrowers ? "Ẩn danh sách mượn" : "Xem người đang mượn"}
            </Button>
          )}
        </div>

        {showBorrowers && (
          <div
            style={{
              marginTop: "10px",
              background: "#f2f2f2",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            <h5>👥 Người mượn</h5>
            {(book.borrows || []).length === 0 ? (
              <p>📭 Chưa có ai mượn.</p>
            ) : (
              book.borrows.map((b, i) => (
                <div key={i}>
                  <p>
                    👤 {b.borrower} – Hết hạn: {b.returnDate}
                    {isAdmin && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          handleRevokeUser(book.id, b.borrower, setSelectedBook)
                        }
                        style={{ marginLeft: "10px" }}
                      >
                        ♻️ Thu hồi
                      </Button>
                    )}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {isAdmin && (
          <div style={{ marginTop: 10 }}>
            <Button
              variant="success"
              onClick={() => setShowBuyers(!showBuyers)}
            >
              🛒 {showBuyers ? "Ẩn người mua" : "Xem người đã mua"}
            </Button>
          </div>
        )}

        {showBuyers && (
          <div
            style={{
              marginTop: "10px",
              background: "#e6ffe6",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            <h5>🛒 Người đã mua sách</h5>
            {buyersList.length === 0 ? (
              <p>📭 Chưa có ai mua.</p>
            ) : (
              buyersList.map((b, idx) => (
                <p key={idx}>
                  👤 {b.address} – 💵 {b.price} ETH
                </p>
              ))
            )}
          </div>
        )}

        <Button
          variant="secondary"
          onClick={onClose}
          style={{ marginTop: "15px" }}
        >
          ❌ Đóng
        </Button>
      </div>
    </div>
  );
}
