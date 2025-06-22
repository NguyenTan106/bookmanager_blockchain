import React, { useState, useEffect } from "react";
import Web3 from "web3";
import AddBook from "./AddBook";
import { Form, Button, Alert, Card } from "react-bootstrap";

export default function AdminManagement({
  bookContract,
  account,
  form,
  setForm,
  isAdmin,
  setIsAdmin,
  isSuperAdmin,
  setIsSuperAdmin,
  loadBooks,
}) {
  const [newAdmin, setNewAdmin] = useState("");
  const [status, setStatus] = useState("");
  const ADMIN_ROLE = Web3.utils.keccak256("ADMIN_ROLE");
  const DEFAULT_ADMIN_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  // Kiểm tra quyền khi component được mount hoặc account thay đổi
  useEffect(() => {
    const checkRoles = async () => {
      try {
        const hasAdminRole = await bookContract.methods
          .hasRole(ADMIN_ROLE, account)
          .call();
        const hasSuperAdminRole = await bookContract.methods
          .hasRole(DEFAULT_ADMIN_ROLE, account)
          .call();

        setIsAdmin(hasAdminRole || hasSuperAdminRole);
        setIsSuperAdmin(hasSuperAdminRole); // 👈 đặt riêng
      } catch (err) {
        console.error("Lỗi kiểm tra quyền:", err);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    };

    if (bookContract && account) {
      checkRoles();
    }
  }, [bookContract, account]);

  const grantAdmin = async () => {
    try {
      setStatus("🔍 Đang kiểm tra quyền mượn sách...");
      const hasPurchased = await bookContract.methods
        .hasPurchasedBooks(newAdmin)
        .call();

      if (hasPurchased) {
        setStatus("❌ Không thể cấp quyền vì người này đã mua sách.");
        return;
      }
      const hasBorrowed = await bookContract.methods
        .hasBorrowedBooks(newAdmin)
        .call();

      if (hasBorrowed) {
        setStatus("❌ Không thể cấp quyền vì người này có sách đang mượn.");
        return;
      }

      setStatus("⏳ Đang cấp quyền...");
      await bookContract.methods.grantAdmin(newAdmin).send({ from: account });
      setStatus("✅ Đã cấp quyền admin!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Lỗi khi cấp quyền!");
    }
  };

  const revokeAdmin = async () => {
    try {
      setStatus("Đang thu hồi quyền...");
      await bookContract.methods.revokeAdmin(newAdmin).send({ from: account });
      setStatus("✅ Đã thu hồi quyền admin!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Lỗi khi thu hồi quyền!");
    }
  };

  // Nếu không phải admin hoặc super admin → ẩn form
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <AddBook
        form={form}
        setForm={setForm}
        bookContract={bookContract}
        account={account}
        loadBooks={loadBooks}
      />
      {isSuperAdmin && (
        <Card className="p-4 mb-4 shadow">
          <Card.Body>
            <Card.Title className="mb-3">👑 Quản lý quyền Admin</Card.Title>

            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Nhập địa chỉ ví (0x...)"
                value={newAdmin}
                onChange={(e) => setNewAdmin(e.target.value)}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="success" onClick={grantAdmin}>
                ✅ Cấp quyền
              </Button>
              <Button variant="danger" onClick={revokeAdmin}>
                ❌ Thu hồi
              </Button>
            </div>

            {status && (
              <Alert variant="info" className="mt-3">
                {status}
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}
    </>
  );
}
