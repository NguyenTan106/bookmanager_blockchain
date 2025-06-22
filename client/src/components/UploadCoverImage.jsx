import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
export default function UploadCoverImage({
  setImageFile,
  imageFile,
  fileImageRef,
}) {
  const [preview, setPreview] = useState(null);

  // ⛳ Mỗi khi imageFile bị xóa từ ngoài -> reset preview
  useEffect(() => {
    if (!imageFile) {
      setPreview(null);
    } else {
      const imageUrl = URL.createObjectURL(imageFile);
      setPreview(imageUrl);
    }
  }, [imageFile]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h5>🖼️ Ảnh bìa sách</h5>

      <div
        style={{
          width: "200px",
          height: "250px",
          border: "2px dashed #ccc",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundColor: "#f8f9fa",
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Ảnh bìa tạm thời"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        ) : (
          <p style={{ color: "#aaa" }}>Chưa có ảnh</p>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: "none" }}
        ref={fileImageRef}
      />

      <Button
        className="mt-2"
        style={{
          padding: "5px 10px",
          fontSize: "14px",
        }}
        variant="outline-primary"
        onClick={() => fileImageRef.current.click()}
      >
        📷 Chọn ảnh
      </Button>
      {imageFile && (
        <span
          className="ms-2 small text-truncate"
          style={{ maxWidth: "150px" }}
        >
          {imageFile.name}
        </span>
      )}
    </div>
  );
}
