import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function checkRole(address) {
  const res = await axios.get(`${BASE_URL}/check-role/${address}`);
  return res.data;
}
