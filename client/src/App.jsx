import React, { useEffect, useState, useRef } from "react";
import Web3 from "web3";
import BookManager from "./build/contracts/BookManager.json";
import "./App.css";

import AdminManagement from "./components/AdminManagement";
import BookList from "./components/BookList";
import SearchPage from "./components/SearchPage";
import EventLogs from "./components/EventLogs";
import { getUserRole } from "./components/GetUserRoles";
import SetUserName from "./components/SetUserName";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { Container, Row, Col } from "react-bootstrap";
import { uploadImageToBackend, uploadPDFToBackend } from "./services/ipfsAPI"; // Import các hàm upload từ backend
import { fetchBooks } from "./services/bookApi"; // Import hàm lấy sách từ API
import { searchBooks } from "./services/searchApi";
function App() {
  const [account, setAccount] = useState("");
  const [bookContract, setBookContract] = useState(null);
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    pdfHash: "",
    coverImageHash: "",
    description: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [value, setValue] = useState("1");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null); // state để lưu vai trò người dùng
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const isRequesting = useRef(false); // tránh gọi trùng

  useEffect(() => {
    loadBlockchain();
  }, []);
  useEffect(() => {
    const checkRole = async () => {
      if (bookContract && account) {
        const role = await getUserRole(bookContract, account);
        setUserRole(role); // set state
      }
    };

    checkRole();
  }, [bookContract, account]);
  useEffect(() => {
    const delayLoadBooks = async () => {
      // Delay nhỏ (500ms - 2s) để node kịp cập nhật contract
      await new Promise((resolve) => setTimeout(resolve, 700));
      if (bookContract && account) {
        await loadBooks(bookContract);
      }
    };
    delayLoadBooks();
  }, [bookContract, account]);

  // Hàm loadBlockchain để kết nối với MetaMask và lấy thông tin blockchain
  const loadBlockchain = async () => {
    if (isRequesting.current) return; // đã đang gọi rồi
    isRequesting.current = true;
    try {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        const existAcc = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (existAcc && existAcc.length === 0) {
          alert("Vui lòng kết nối tài khoản Ethereum trong MetaMask.");
          return;
        } else {
          const accounts = await web3.eth.getAccounts();
          setAccount(accounts[0]);
        }

        const networkId = await web3.eth.net.getId();
        const deployed = BookManager.networks[networkId];

        if (deployed) {
          const contract = new web3.eth.Contract(
            BookManager.abi,
            deployed.address
          );
          setBookContract(contract);
        } else {
          alert("Contract not deployed to detected network");
        }
      } else {
        alert("Please install MetaMask");
      }
    } catch (error) {
      if (error.code === -32002) {
        alert("MetaMask đang xử lý yêu cầu. Vui lòng chờ hoặc kiểm tra popup.");
      } else if (error.code === 4001) {
        alert("Bạn đã từ chối kết nối MetaMask.");
      } else {
        console.error("Lỗi khi load blockchain:", error);
      }
    } finally {
      isRequesting.current = false;
    }
  };

  const loadBooks = async () => {
    try {
      const result = await fetchBooks();
      const updatedBooks = await Promise.all(
        result.map(async (book) => {
          const bought = await hasBought(book.id);
          return { ...book, hasBought: bought };
        })
      );
      setBooks(updatedBooks);
      return updatedBooks;
    } catch (error) {
      console.error("❌ Lỗi khi tải sách:", error);
      return [];
    }
  };

  const handleBuy = async (bookId, priceEth) => {
    try {
      const priceInWei = Web3.utils.toWei(priceEth.toString(), "ether");
      console.log("📘 Book ID:", bookId);
      console.log("💰 Price (ETH):", priceEth);
      console.log("💰 Price (Wei):", priceInWei);

      await bookContract.methods.buyBook(bookId).send({
        from: account,
        value: priceInWei,
      });

      alert("✅ Mua sách thành công!");
      await loadBooks(bookContract);
    } catch (err) {
      console.error("❌ Lỗi khi mua sách:", err);
      alert("❌ Mua sách thất bại!");
    }
  };

  const hasBought = async (bookId) => {
    try {
      const result = await bookContract.methods
        .bookPurchases(bookId, account)
        .call();
      return result;
    } catch (error) {
      console.error("❌ Lỗi khi kiểm tra đã mua sách:", error);
      return false;
    }
  };

  const handleBorrow = async (bookId, priceEth) => {
    try {
      const priceInWei = Web3.utils.toWei(
        (Number(priceEth) * 10) / 100,
        "ether"
      );

      // console.log("🧾 Book price (wei):", typeof priceInWei);
      // console.log("👉 Địa chỉ người dùng:", account);
      console.log("👉 Book ID:", bookId);

      const estimatedGas = await bookContract.methods
        .borrowBook(bookId, 7)
        .estimateGas({ from: account, value: priceInWei });

      console.log("⛽ Ước tính Gas:", estimatedGas);

      await bookContract.methods.borrowBook(bookId, 7).send({
        from: account,
        value: priceInWei,
        gas: estimatedGas,
      });

      alert("✅ Mượn sách thành công!");
      await loadBooks(bookContract);
    } catch (err) {
      console.error("❌ Lỗi khi mượn sách:", err?.message || err);
      alert("❌ Mượn sách thất bại!");
    }
  };

  const handleReturn = async (id) => {
    await bookContract.methods.returnBook(id).send({ from: account });
    loadBooks(bookContract);
  };

  const handleUpdate = async (
    bookId,
    form,
    owner,
    currentTitle,
    pdfFile,
    imageFile
  ) => {
    console.log("🔧 Bắt đầu cập nhật sách...");
    console.log(
      "🔍 form.category:",
      form.category.map((cat) => cat.id)
    );
    try {
      // 1. Kiểm tra quyền
      if (owner.toLowerCase() !== account.toLowerCase() && !isSuperAdmin) {
        alert("❌ Bạn không có quyền sửa sách này!");
        return;
      }

      // 2. Nếu đổi tên thì mới kiểm tra trùng
      if (form.title !== currentTitle) {
        const isUsed = await bookContract.methods
          .isTitleUsed(form.title)
          .call();
        if (isUsed) {
          alert("❌ Tên sách đã tồn tại. Vui lòng chọn tên khác.");
          return;
        }
      }

      const ipfsHash = pdfFile
        ? await uploadPDFToBackend(pdfFile)
        : form.oldPdfHash;

      const imageIpfsHash = imageFile
        ? await uploadImageToBackend(imageFile)
        : form.oldCoverHash;
      // console.log(cleanPdfHash, cleanCoverHash);

      if (!ipfsHash || !imageIpfsHash) {
        alert("❌ Lỗi IPFS");
        return;
      }

      // 7. Gửi giao dịch
      const estimatedGas = await bookContract.methods
        .editBook(
          bookId,
          form.title,
          form.category.map((cat) => cat.id),
          ipfsHash,
          imageIpfsHash,
          Number(form.price),
          form.description
        )
        .estimateGas({ from: account });

      await bookContract.methods
        .editBook(
          bookId,
          form.title,
          form.category.map((cat) => cat.id),
          ipfsHash,
          imageIpfsHash,
          Number(form.price),
          form.description
        )
        .send({ from: account, gas: estimatedGas });

      await loadBooks(bookContract);
      alert("✅ Sách đã được cập nhật!");
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật sách:", error);
      alert("❌ Cập nhật thất bại. Kiểm tra console để biết thêm chi tiết.");
    }
  };

  const handleDelete = async (bookId, owner) => {
    try {
      if (owner !== account && !isSuperAdmin) {
        alert("❌ Bạn không có quyền xóa sách này!");
        return;
      }
      console.log("🔧 Bắt đầu xóa sách:", bookId);
      await bookContract.methods.deleteBook(bookId).send({ from: account });
      alert("✅ Đã xóa sách thành công!");

      // Cập nhật danh sách mà không cần reload toàn bộ từ blockchain
      await loadBooks(bookContract);
    } catch (error) {
      console.error("❌ Lỗi khi xóa sách:", error);
      alert("❌ Xóa sách thất bại. Vui lòng thử lại.");
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleRevoke = async (bookId, borrowerAddress, setSelectedBook) => {
    try {
      console.log(
        `⛔ Đang thu hồi sách ID ${bookId} từ người: ${borrowerAddress}`
      );

      await bookContract.methods
        .revokeSingleBorrower(bookId, borrowerAddress)
        .send({ from: account });

      alert("✅ Đã thu hồi sách thành công!");

      // Làm mới danh sách
      const updated = await loadBooks(bookContract);
      setBooks(updated);

      // Cập nhật lại popup
      const updatedBook = updated.find((b) => Number(b.id) === Number(bookId));
      if (updatedBook && setSelectedBook) {
        setSelectedBook({ ...updatedBook });
      }
    } catch (error) {
      console.error("❌ Lỗi khi thu hồi sách:", error);
      alert("❌ Thu hồi sách thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col className="text-center">
          <h2 className="">📚 BookChain Manager</h2>
          <div>
            <strong>Logged in:</strong> {account}
            <p className="mt-1">
              🔐 Vai trò:{" "}
              {userRole === "super"
                ? "Super Admin"
                : userRole === "admin"
                ? "Admin"
                : "User"}
            </p>
          </div>
          <SetUserName
            setUsername={setUsername}
            username={username}
            bookContract={bookContract}
            account={account}
            currentUsername={currentUsername}
            setCurrentUsername={setCurrentUsername}
          />
        </Col>
        <div>
          <AdminManagement
            bookContract={bookContract}
            account={account}
            form={form}
            setForm={setForm}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
            isSuperAdmin={isSuperAdmin}
            setIsSuperAdmin={setIsSuperAdmin}
            loadBooks={loadBooks}
            hasBought={hasBought}
            books={books}
          />
        </div>

        <hr />
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              <Tab label="Book list" value="1" />
              <Tab label="Even logs" value="2" />
              <Tab label="Dashboard" value="3" />
            </TabList>
          </Box>
          <TabPanel value="1">
            <SearchPage
              setBooks={setBooks}
              books={books}
              bookContract={bookContract}
            />
            <BookList
              books={books}
              bookContract={bookContract}
              account={account}
              handleBorrow={handleBorrow}
              handleBuy={handleBuy}
              handleReturn={handleReturn}
              handleUpdate={handleUpdate}
              handleDelete={handleDelete}
              isAdmin={isAdmin}
              userRole={userRole}
              handleRevoke={handleRevoke}
              hasBought={hasBought}
            />
          </TabPanel>
          <TabPanel value="2">
            <EventLogs
              bookContract={bookContract}
              userRole={userRole}
              contract={bookContract}
              account={account}
            />
          </TabPanel>
        </TabContext>
      </Row>
    </Container>
  );
}

export default App;
