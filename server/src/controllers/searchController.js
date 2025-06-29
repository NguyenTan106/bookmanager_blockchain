// const books = require("../models/bookModel");
const { computeTfIdf } = require("../services/tfidfService");

const searchBooks = (req, res) => {
  const query = req.body.query;
  if (!query) return res.status(400).json({ error: "Missing query" });
  // console.log(tokenize(query));
  // Sắp xếp giảm dần theo độ liên quan
  const sorted = computeTfIdf(query, books).sort((a, b) => b.score - a.score);

  res.json(sorted);
};

module.exports = { searchBooks };
