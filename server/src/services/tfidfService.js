const stopwords = require("vietnamese-stopwords");

const removeDiacritics = (str) =>
  str
    .normalize("NFD") // tách các dấu ra khỏi từ
    .replace(/đ/g, "d") // thay đ -> d
    .replace(/Đ/g, "D");

const tokenize_category = (text) => {
  return removeDiacritics(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean); // loại từ rỗng
};

// const tokenize = (text) => {
//   return removeDiacritics(text)
//     .toLowerCase()
//     .replace(/[^\p{L}\p{N}]/gu, "")
//     .split(""); // tách từng ký tự
// };

const tokenize = (text) => {
  const cleaned = removeDiacritics(text).toLowerCase();

  const words = cleaned
    .replace(/[^\p{L}\p{N}\s]/gu, "") // bỏ ký tự đặc biệt
    .split(/\s+/) // xác định các từ bằng 1 hoặc nhiều khoảng trắng
    .filter((word) => word && !stopwords.includes(word)); // Loại bỏ stop words

  const chars = cleaned
    .replace(/[^\p{L}\p{N}]/gu, "") // bỏ ký tự không phải chữ/số
    .split(""); // tách ký tự

  // Kết hợp từ + ký tự, bỏ trùng bằng Set
  // return Array.from(new Set([...words, ...chars]));
  return [...words, ...chars];
};

// Công thức chung TF-IDF
// TF(t,d) = số lần t xuất hiện trong tài liệu / tổng số từ trong tài liệu
// IDF(t) = log(N/df(t))
// - N: tổng số tài liệu trong tập
// - df(t): số tài liệu có chứa từ t (hoặc từ khác)
// TF-IDF = TF(t,d) x IDF(t)

const computeTfIdf = async (query, documents) => {
  const totalDocs = documents.length;
  // console.log(totalDocs);
  // B1: Tokenize toàn bộ tài liệu
  const docsTokens = documents.map((doc) => {
    // console.log(
    //   tokenize(
    //     doc.description +
    //       " " +
    //       doc.title +
    //       " " +
    //       doc.category.map((cat) => cat.name).join(", ")
    //   )
    // );
    return tokenize(
      doc.description +
        " " +
        doc.title +
        " " +
        doc.category.map((cat) => cat.name).join(", ")
    );
  });

  // B2: Đếm df (document frequency)
  const dfMap = {}; // { từ: số tài liệu chứa từ đó }
  docsTokens.forEach((tokens) => {
    const seen = new Set();
    // console.log(tokens);
    tokens.forEach((term) => {
      // console.log(term);
      if (!seen.has(term)) {
        dfMap[term] = (dfMap[term] || 0) + 1;
        seen.add(term);
        // console.log(term + ": " + dfMap[term]);
      }
    });
  });

  // B3: Tính TF-IDF của query với từng sách
  const queryTokens = tokenize(query);

  return documents.map((doc, index) => {
    // console.log(doc);
    const docTokens = docsTokens[index];
    const tfMap = {}; // TF trong document hiện tại

    // Đếm tần suất từ
    docTokens.forEach((term) => {
      tfMap[term] = (tfMap[term] || 0) + 1;
    });
    // console.log(tfMap);

    const totalTerms = docTokens.length;
    // console.log(totalTerms);
    // Tính điểm TF-IDF cho các từ trong truy vấn
    let score = 0;
    queryTokens.forEach((term) => {
      const isChar = term.length === 1;
      const tf = (tfMap[term] || 0) / totalTerms;
      const df = dfMap[term] || 1; // tránh chia cho 0
      const idf = Math.log(totalDocs / df);
      const weight = isChar ? 0.2 : 1;
      score += tf * idf * weight;
    });
    // console.log({ ...doc, score });
    return { ...doc, score };
  });
};

const computeTfIdfClassify = async (query, documents) => {
  const totalDocs = documents.length;
  // console.log(totalDocs);
  // B1: Tokenize toàn bộ tài liệu
  const docsTokens = documents.map((doc) => {
    console.log(
      tokenize_category(doc.category.map((cat) => cat.name).join(", "))
    );
    return tokenize_category(doc.category.map((cat) => cat.name).join(", "));
  });

  // B2: Đếm df (document frequency)
  const dfMap = {}; // { từ: số tài liệu chứa từ đó }
  docsTokens.forEach((tokens) => {
    const seen = new Set();
    // console.log(tokens);
    tokens.forEach((term) => {
      // console.log(term);
      if (!seen.has(term)) {
        dfMap[term] = (dfMap[term] || 0) + 1;
        seen.add(term);
        // console.log(term + ": " + dfMap[term]);
      }
    });
  });

  // B3: Tính TF-IDF của query với từng sách
  const queryTokens = tokenize_category(query);

  return documents.map((doc, index) => {
    // console.log(doc);
    const docTokens = docsTokens[index];
    const tfMap = {}; // TF trong document hiện tại

    // Đếm tần suất từ
    docTokens.forEach((term) => {
      tfMap[term] = (tfMap[term] || 0) + 1;
    });
    // console.log(tfMap);

    const totalTerms = docTokens.length;
    // console.log(totalTerms);
    // Tính điểm TF-IDF cho các từ trong truy vấn
    let score = 0;
    queryTokens.forEach((term) => {
      const tf = (tfMap[term] || 0) / totalTerms;
      const df = dfMap[term] || 1; // tránh chia cho 0
      const idf = Math.log(totalDocs / df);
      score += tf * idf;
    });
    // console.log({ ...doc, score });
    return { ...doc, score };
  });
};
module.exports = { computeTfIdf, computeTfIdfClassify };
