import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function searchBooks(query) {
  const res = await axios.post(`${BASE_URL}/search`, { query: query });
  // console.log("DATA:", res.data);
  return res.data;
}
