# 📚 DApp Quản Lý Sách - Hướng Dẫn Cài Đặt & Triển Khai

## 🔺 Giới Thiệu

Dự án DApp quản lý sách sử dụng Ethereum smart contract (Truffle), IPFS (Pinata) và giao diện React.

---

## 🛠️ Cài đặt môi trường

### 1. Cài Ganache

- Truy cập: [https://archive.trufflesuite.com/ganache/](https://archive.trufflesuite.com/ganache/)
- Cài đặt và chạy Ganache.
- Tạo workspace mới hoặc dùng quickstart.

### 2. Cài MetaMask

- Truy cập: [MetaMask Extension](https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)
- Thêm vào Chrome, tạo hoặc import tài khoản.

#### Thêm mạng Ganache:

- Network name: `Ganache`
- RPC URL: `http://127.0.0.1:7545`
- Chain ID: `1337`
- Currency Symbol: `ETH`

#### Import tài khoản:

- Vào Ganache, copy Private Key
- Trong MetaMask: **Import Account** → paste Private Key

### 3. Tạo tài khoản Pinata

- Truy cập: [https://www.pinata.cloud](https://www.pinata.cloud)
- Đăng ký tài khoản
- Vào **API Keys** → **Create Key**
  - Chọn quyền: `pinFileToIPFS`
- Sao chép JWT Token (bắt đầu bằng `eyJ...`)

---

## ⚖️ Deploy Smart Contract

### Ởt thư mục gốc (chứa `truffle-config.js`)

```bash
npm install
truffle migrate --reset
```

Sau bước này, contract được deploy lên local blockchain (Ganache).

> ⚠️ **Lưu ý**: KHÔNG mở trình duyệt trước khi deploy xong, tránh lỗi MetaMask spam request.

---

## 🌐 Khởi động frontend

### Ởt thư mục `client`

```bash
cd client
```

### Tạo file `.env`

```env
VITE_PINATA_JWT=Bearer eyJ...
```

### Cài package và chạy

```bash
npm install
npm run dev
```

---

## Bổ sung

Em có để file hình ảnh và pdf ở /client/src/assets để thầy dễ test

## ✅ Tóm tắt

| Bước           | Việc cần làm                       |
| -------------- | ---------------------------------- |
| Ganache        | Cài đặt, khởi động, tạo workspace  |
| MetaMask       | Thêm RPC Ganache, import tài khoản |
| Pinata         | Tạo JWT Token và copy vào `.env`   |
| Truffle        | `npm i` + `truffle migrate`        |
| React frontend | Tạo `.env`, `npm i`, `npm run dev` |

---

> ✨ Sẵn sàng triển khai và test DApp của bạn!

---

_Created by Nguyen Khac Minh Tan._
