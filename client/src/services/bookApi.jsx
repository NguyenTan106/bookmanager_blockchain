import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchBooks = async (address) => {
  const res = await axios.get(`${BASE_URL}/books?userAddress=${address}`);
  return res.data;
};

export const sortBooks = async (field, order, address) => {
  const res = await axios.get(
    `${BASE_URL}/books/sort?field=${field}&order=${order}&userAddress=${address}`
  );
  // console.log(res);
  return res.data;
};
