import { Button, Form } from "react-bootstrap";
import { predictCategory } from "../services/naiveBayesApi";
import { useState, useEffect } from "react";
export default function TestApi({ books }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
  });
  const [result, setResult] = useState({});

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (form.title.trim() && form.description.trim()) {
        let cat_pre = await predictCategory(form.title, form.description);
        setResult(cat_pre.predictedCategory);
      } else {
        setResult("");
      }
    }, 500); // đợi 500ms sau khi người dùng ngừng gõ

    return () => clearTimeout(delayDebounce); // cleanup để tránh spam call
  }, [form.title, form.description]);
  const handlePredictCategory = async () => {
    let title = form.title;
    let description = form.description;
    let result = await predictCategory(title, description);
    console.log(result.predictedCategory);
    setResult(result);
  };
  return (
    <>
      <Form.Group className="mb-3">
        <Form.Control
          placeholder="Nhập title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mb-2"
        />
        <Form.Control
          placeholder="Nhập description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="mb-2"
        />
        <Form.Control
          placeholder="Kết quả thể loại"
          value={result}
          readOnly
          className="mb-2"
        />
      </Form.Group>

      <Button onClick={handlePredictCategory}>TestApi</Button>
    </>
  );
}
