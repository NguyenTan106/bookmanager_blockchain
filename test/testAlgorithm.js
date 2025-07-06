const removeDiacritics = (str) =>
  str.normalize("NFD").replace(/đ/g, "d").replace(/Đ/g, "D");

const tokenize_label = (text) => {
  return removeDiacritics(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, "")
    .trim();
};

const tokenize_content = (text) => {
  return removeDiacritics(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
};

const documents = [
  { email: "E1", content: "mua ngay khuyến mãi", label: "spam" },
  { email: "E2", content: "giảm giá cực sốc", label: "spam" },
  { email: "E3", content: "họp nhóm vào chiều nay", label: "không spam" },
  { email: "E4", content: "mời bạn họp tuần tới", label: "không spam" },
];

const computeNaiveBayes = (docs, testEmail) => {
  const totalDocs = docs.length;
  const labelWordCount = {}; // {label: {word: count}}
  const labelDocCount = {}; // {label: số lượng doc}
  const labelTotalWords = {}; // {label: tổng số từ}
  const vocab = new Set();

  // B1: Lặp từng tài liệu
  docs.forEach((doc) => {
    const label = tokenize_label(doc.label);
    const words = tokenize_content(doc.content);

    labelDocCount[label] = (labelDocCount[label] || 0) + 1;
    labelWordCount[label] = labelWordCount[label] || {};
    labelTotalWords[label] = labelTotalWords[label] || 0;

    words.forEach((word) => {
      vocab.add(word);
      labelWordCount[label][word] = (labelWordCount[label][word] || 0) + 1;
      labelTotalWords[label]++;
    });
  });
  console.log(labelDocCount);
  //   console.log(labelWordCount);
  console.log(labelTotalWords);

  const vocabSize = vocab.size;

  // B2: Tính xác suất mỗi lớp
  const testWords = tokenize_content(testEmail);
  const result = {};

  Object.keys(labelDocCount).forEach((label) => {
    const prior = labelDocCount[label] / totalDocs; // P(c)
    // console.log(prior);
    let prob = Math.log(prior); // log để tránh số quá nhỏ

    testWords.forEach((word) => {
      const count = (labelWordCount[label][word] || 0) + 1; // Laplace smoothing
      const total = labelTotalWords[label] + vocabSize;
      prob += Math.log(count / total); // cộng log xác suất
    });
    result[label] = prob;
    // console.log(result);
  });

  // In kết quả
  //   console.log("Xác suất (log) mỗi lớp:", result);
  //   const predicted = Object.entries(result).sort((a, b) => b[1] - a[1])[0][0];
  //   console.log("Dự đoán:", predicted);
};

computeNaiveBayes(documents, "giảm giá khuyến mãi");
