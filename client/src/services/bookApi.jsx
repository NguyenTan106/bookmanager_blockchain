import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchBooks = async () => {
  const res = await axios.get(`${BASE_URL}/books`);
  return res.data;
};

export const sortBooks = async (field, order) => {
  const res = await axios.get(
    `${BASE_URL}/books/sort?field=${field}&order=${order}`
  );
  return res.data;
};
