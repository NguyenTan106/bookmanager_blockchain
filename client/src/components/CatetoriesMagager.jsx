import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  ListGroup,
  Row,
  Col,
  Table,
} from "react-bootstrap";
import Select from "react-select";
import {
  fetchCategories,
  addCategory,
  deleteCategory,
} from "../services/categoryApi";

const CategoryManagerModal = ({
  show,
  onHide,
  isMulti,
  value,
  onChange,
  loadBooks,
  categories,
  setCategories,
}) => {
  const [newCategory, setNewCategory] = useState("");

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      // console.log(data);
      const formatted = data.map((cat) => ({
        id: cat.id,
        value: cat.name,
        label: cat.name,
      }));
      setCategories(formatted);
      await loadBooks();
    } catch (err) {
      console.error("Lỗi lấy thể loại:", err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []); // ✅ Chỉ load 1 lần khi mở modal

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    try {
      await addCategory(newCategory);
      setNewCategory("");
      alert("✅ Thêm thành công");
      await loadCategories(); // ✅ Không đóng modal
    } catch (err) {
      alert("❌ Thêm thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xoá?")) return;
    try {
      await deleteCategory(id);
      alert("✅ Xoá thành công");
      await loadCategories(); // ✅ Không đóng modal
    } catch (err) {
      alert("❌ Xoá thất bại");
    }
  };

  return (
    <>
      <Select
        className="basic-multi-select"
        classNamePrefix="select"
        isMulti={isMulti}
        options={categories} // ✅ dùng trực tiếp
        value={
          isMulti
            ? categories.filter((opt) => value.includes(opt.id))
            : categories.find((opt) => opt.id === value) || null
        }
        onChange={(selected) =>
          isMulti
            ? onChange(selected.map((opt) => opt.id)) // truyền array string
            : onChange(selected?.value)
        }
        placeholder="Chọn thể loại..."
        styles={{
          menu: (provided) => ({
            ...provided,
            zIndex: 9999,
          }),
        }}
      />

      <Modal show={show} onHide={onHide} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Quản lý thể loại sách</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="mb-3">
            <Row>
              <Col xs={9}>
                <Form.Control
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nhập tên thể loại mới"
                />
              </Col>
              <Col>
                <Button variant="outline-primary" onClick={handleAdd}>
                  ➕ Thêm
                </Button>
              </Col>
            </Row>
          </Form>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th style={{ width: "10%" }}>#</th>
                <th>Tên thể loại</th>
                <th style={{ width: "15%" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center text-muted">
                    Không có thể loại nào
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.id}</td>
                    <td>{cat.label}</td>
                    <td>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(cat.id)}
                      >
                        🗑 Xoá
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CategoryManagerModal;
