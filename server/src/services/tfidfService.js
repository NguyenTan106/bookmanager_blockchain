const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean); // loại từ rỗng
};

const computeTfIdf = async (query, documents) => {
  const totalDocs = documents.length;
  // console.log(totalDocs);
  // const categoryMap = await getCategories();
  // console.log(categoryMap);
  // B1: Tokenize toàn bộ tài liệu
  const docsTokens = documents.map((doc) => {
    return tokenize(doc.description + " " + doc.title + " " + doc.category);
  });

  // B2: Đếm df (document frequency)
  const dfMap = {}; // { từ: số tài liệu chứa từ đó }
  docsTokens.forEach((tokens) => {
    const seen = new Set();
    // console.log(tokens);
    tokens.forEach((term) => {
      // console.log(typeof term);
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
    const docTokens = docsTokens[index];
    const tfMap = {}; // TF trong document hiện tại

    // Đếm tần suất từ
    docTokens.forEach((term) => {
      tfMap[term] = (tfMap[term] || 0) + 1;
    });
    // console.log(docTokens);

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
module.exports = { computeTfIdf };
