import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchBooks = async () => {
  const res = await axios.get(`${BASE_URL}/books`);
  return res.data;
};
