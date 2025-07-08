const natural = require("natural");
const stopwords = require("vietnamese-stopwords");
const fs = require("fs");
const path = require("path");

const sample = require("../assets/sample.json");

const removeDiacritics = (str) =>
  str
    .normalize("NFD")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[\u0300-\u036f]/g, ""); // xoá dấu

// Làm sạch văn bản & loại bỏ từ dừng
const cleanAndTokenize = (text) => {
  return removeDiacritics(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter((word) => word && !stopwords.includes(word));
};

// --- TRAINING PHASE ---
const classifier = new natural.BayesClassifier();

Object.entries(sample).forEach(([category, books]) => {
  books.forEach((book) => {
    const rawText = `${book.title} ${book.subtitle ?? ""} ${book.description}`;
    const tokens = cleanAndTokenize(rawText).join(" "); // Natural expects string input
    classifier.addDocument(tokens, category);
  });
});

classifier.train();

console.log("📚 Mô hình đã huấn luyện xong!");

const naiveBayes = async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Thiếu tiêu đề hoặc mô tả" });
  }

  const input = `${title} ${description}`;
  const tokens = cleanAndTokenize(input).join(" ");
  const predicted = classifier.classify(tokens);
  const scores = classifier.getClassifications(tokens);
  const top3 = scores
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((score) => ({
      category: score.label,
      score: score.value, // Làm tròn đến 4 chữ số thập phân
    }));
  res.json({ predictedCategory: predicted, top3, scores });
};

module.exports = { naiveBayes };
