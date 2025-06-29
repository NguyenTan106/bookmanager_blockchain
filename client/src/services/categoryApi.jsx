import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function fetchCategories() {
  const res = await axios.get(`${BASE_URL}/categories`);
  // console.log("DATA:", res.data);
  return res.data;
}

export async function addCategory(newCategory) {
  const res = await axios.post(`${BASE_URL}/categories/add`, {
    category: newCategory,
  });
  return res.data;
}

export async function deleteCategory(id) {
  const res = await axios.delete(`${BASE_URL}/categories/delete/${id}`);
  return res.data;
}
