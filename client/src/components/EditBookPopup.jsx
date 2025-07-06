import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import Select from "react-select";
import { predictCategory } from "../services/naiveBayesApi";
export default function EditBookPopup({
  editForm,
  setEditForm,
  setPdfFile,
  setImageFile,
  submitUpdate,
  closePopup,
  imageFile,
  categories,
  isMulti,
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (editForm.title.trim() && editForm.description.trim()) {
        let cat_pre = await predictCategory(
          editForm.title,
          editForm.description
        );
        setEditForm({ ...editForm, category: cat_pre.predictedCategory });
      } else {
        setEditForm({ ...editForm, category: "" });
      }
    }, 500); // đợi 500ms sau khi người dùng ngừng gõ

    return () => clearTimeout(delayDebounce); // cleanup để tránh spam call
  }, [editForm.title, editForm.description]);
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          overflowY: "auto",
          maxHeight: "90vh",
        }}
      >
        <h4 className="text-center mb-3">🛠️ Cập nhật sách</h4>

        <Form.Group controlId="formTitle" className="mb-3">
          <Form.Label>📘 Tiêu đề</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập tiêu đề sách"
            value={editForm.title}
            onChange={(e) =>
              setEditForm({ ...editForm, title: e.target.value })
            }
          />
        </Form.Group>

        <Form.Label>📚 Thể loại</Form.Label>
        {/* <Select
          className="mb-3"
          isMulti={isMulti}
          options={categories} // [{ id, label, value }]
          value={categories.filter((cat) =>
            editForm.category.some((c) => c.id === cat.id)
          )}
          onChange={(selected) =>
            setEditForm({
              ...editForm,
              category: selected.map((opt) => ({
                id: opt.id,
                name: opt.label,
              })),
            })
          }
          placeholder="Chọn thể loại..."
          styles={{
            menu: (provided) => ({
              ...provided,
              zIndex: 9999,
            }),
          }}
        /> */}
        <Form.Group>
          <Form.Control
            placeholder="Kết quả thể loại"
            value={editForm.category}
            readOnly
            className="mb-2"
          />
        </Form.Group>
        <Form.Group controlId="formPrice" className="mb-3">
          <Form.Label>💰 Giá (ETH)</Form.Label>
          <Form.Control
            type="number"
            placeholder="VD: 0.01"
            value={editForm.price}
            onChange={(e) =>
              setEditForm({ ...editForm, price: e.target.value })
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>✍️ Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Nhập mô tả chi tiết về sách..."
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
          />
        </Form.Group>

        <Form.Group controlId="formPdf" className="mb-3">
          <Form.Label>📄 Tệp PDF mới (tuỳ chọn)</Form.Label>
          <Form.Control
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
          />
        </Form.Group>

        <Form.Group controlId="formImage" className="mb-3">
          <Form.Label>🖼️ Ảnh bìa mới (tuỳ chọn)</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            value={editForm.coverImage || ""}
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          {/* Preview ảnh */}
          <div className="mt-3 text-center">
            <small className="text-muted">
              {imageFile ? "🔍 Xem trước ảnh mới:" : "📎 Ảnh bìa hiện tại:"}
            </small>
            <div className="mt-2">
              <img
                src={
                  imageFile
                    ? URL.createObjectURL(imageFile)
                    : `https://ipfs.io/ipfs/${editForm.oldCoverHash}`
                }
                alt="Ảnh bìa"
                style={{
                  width: "50%",
                  maxHeight: "250px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
            </div>
          </div>
        </Form.Group>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button variant="secondary" onClick={closePopup}>
            ❌ Hủy
          </Button>
          <Button variant="success" onClick={submitUpdate}>
            ✅ Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}
