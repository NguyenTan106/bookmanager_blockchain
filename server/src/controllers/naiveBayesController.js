const natural = require("natural");
const books = require("../assets/sample.json");

const removeDiacritics = (str) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const cleanText = (str) => {
  return removeDiacritics(str)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "") // xoá ký tự đặc biệt
    .replace(/\s+/g, " ") // chuẩn hoá khoảng trắng
    .trim();
};

// --- TRAINING PHASE ---
const classifier = new natural.BayesClassifier();
books.forEach((book) => {
  const text = `${book.title} ${book.description}`;
  const label = book.category;
  //   console.log(label);
  classifier.addDocument(text, label);
});
classifier.train();

const naiveBayes = async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Missing title or description" });
  }

  const inputText = cleanText(`${title} ${description}`);
  const category = classifier.classify(inputText);
  const scores = classifier.getClassifications(inputText);
  //   const top3 = scores.slice(0, 3).map((s) => ({
  //     category: s.label,
  //     confidence: `${(s.value * 100).toFixed(2)}%`,
  //   }));
  //   console.log(top3);

  res.json({ predictedCategory: category, scores });
};

module.exports = { naiveBayes };
