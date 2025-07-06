import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function predictCategory(title, description) {
  const res = await axios.post(`${BASE_URL}/predict`, {
    title: title,
    description: description,
  });
  //   console.log(res.data);
  return res.data;
}
