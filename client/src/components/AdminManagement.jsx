import React, { useState, useEffect } from "react";
import AddBook from "./AddBook";
import { Form, Button, Alert, Card } from "react-bootstrap";
import { checkRole } from "../services/checkRoleApi";
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
  setCategories,
  categories,
}) {
  const [newAdmin, setNewAdmin] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const checkRoles = async () => {
      try {
        const res = await checkRole(account);
        // console.log(res);
        const { isAdmin, isSuperAdmin } = res;

        setIsAdmin(isAdmin || isSuperAdmin);
        setIsSuperAdmin(isSuperAdmin);
      } catch (err) {
        console.error("❌ Lỗi kiểm tra quyền từ backend:", err);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    };

    if (account) {
      checkRoles();
    }
  }, [account]);

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
        setCategories={setCategories}
        categories={categories}
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
