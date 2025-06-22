// ipfs.js
import { create } from "@web3-storage/w3up-client";

const EMAIL = "tannguyenkhacminh112@gmail.com"; // bạn đã dùng email để login
const SPACE_DID = "did:key:z6MkmfrF4bu1yD7aez49NC9s8BQG2bVwgVx86Srz5gDjzJZa";

let client;

export async function initClient() {
  client = await create();
  try {
    // await client.loadAgent(); // Tải agent từ local (nếu có)
    const account = await client.login(EMAIL); // Nếu chưa login, sẽ cần xác nhận email
    await account.plan.wait();
    if (SPACE_DID == null || SPACE_DID === "") {
      const space = await client.createSpace("BookManager", { account });
      await client.setCurrentSpace(space.did());
      console.log("🌌 Space created:", space.did());
    } else {
      console.log("Using existing space:", SPACE_DID);
      await client.setCurrentSpace(SPACE_DID);
    }
    console.log("✅ Client initialized and logged in successfully.");
  } catch {
    console.warn(
      "⚠️ No saved agent found. You may need to register and provision."
    );
  }

  return client;
}

function sanitizeFileName(filename) {
  const maxBaseLength = 100;

  const ext = filename.split(".").pop();
  const base = filename.substring(0, filename.lastIndexOf(".")) || filename;

  const safeBase = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, maxBaseLength);

  const timestamp = Date.now();

  return `${safeBase || "file"}-${timestamp}.${ext}`;
}

export async function uploadPDF(file) {
  const client = await initClient();

  try {
    // Xử lý tên file
    const cleanName = sanitizeFileName(file.name);
    const blob = new Blob([file], { type: file.type || "application/pdf" });
    const sanitizedFile = new File([blob], cleanName, { type: file.type });

    // Upload đúng kiểu File[]
    const cid = await client.uploadDirectory([sanitizedFile]);

    console.log("✅ CID returned:", cid);
    return `${cid}/${sanitizedFile.name}`;
  } catch (err) {
    console.error("❌ Upload failed:", err);
    if (err.cause) console.error("📛 Root cause:", err.cause);
    throw err;
  }
}

export async function uploadImage(file) {
  const client = await initClient();

  // Xử lý tên file
  const cleanName = sanitizeFileName(file.name);
  const blob = new Blob([file], { type: file.type || "image/jpeg" });
  const sanitizedFile = new File([blob], cleanName, { type: file.type });

  try {
    // Upload đúng kiểu File[]
    const cid = await client.uploadDirectory([sanitizedFile]);

    console.log("✅ CID returned:", cid);
    return `${cid}/${sanitizedFile.name}`;
  } catch (err) {
    console.error("❌ Upload failed:", err);
    if (err.cause) console.error("📛 Root cause:", err.cause);
    throw err;
  }
}
