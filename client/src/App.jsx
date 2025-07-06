import React, { useEffect, useState, useRef } from "react";
import Web3 from "web3";
import BookManager from "./build/contracts/BookManager.json";
import "./App.css";

import AdminManagement from "./components/AdminManagement";
import BookList from "./components/BookList";
import SearchPage from "./components/SearchPage";
import EventLogs from "./components/EventLogs";
import SetUserName from "./components/SetUserName";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import {
  Container,
  Row,
  Col,
  Button,
  DropdownButton,
  Dropdown,
} from "react-bootstrap";
import { uploadImageToBackend, uploadPDFToBackend } from "./services/ipfsAPI"; // Import các hàm upload từ backend
import { fetchBooks } from "./services/bookApi"; // Import hàm lấy sách từ API
import TestApi from "./components/TestApi";
import BookListTableView from "./components/BookListTableView";
import { sortBooks } from "./services/bookApi";
import { FaTable, FaThLarge, FaUndo } from "react-icons/fa";
import { classifyBooks } from "./services/searchApi";
function App() {
  const [account, setAccount] = useState("");
  const [bookContract, setBookContract] = useState(null);
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedCategoryLabel, setSelectedCategoryLabel] =
    useState("Phân loại");

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
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [sortOption, setSortOption] = useState({
    sortBy: "origin",
    sortOrder: "origin",
  });
  const [classifyOption, setClassifyOption] = useState("");
  const [viewMode, setViewMode] = useState("card");

  useEffect(() => {
    loadBlockchain();
  }, []);

  // useEffect(() => {
  //   const checkRole = async () => {
  //     if (bookContract && account) {
  //       const role = await getUserRole(bookContract, account);
  //       // console.log(role);
  //       setUserRole(role); // set state
  //       if (role === "user") {
  //         const delayLoadBooks = async () => {
  //           // Delay nhỏ (500ms - 2s) để node kịp cập nhật contract
  //           await new Promise((resolve) => setTimeout(resolve, 700));
  //           if (bookContract && account) {
  //             await loadBooks(bookContract);
  //           }
  //         };
  //         delayLoadBooks();
  //       }
  //     }
  //   };
  //   checkRole();
  // }, [bookContract, account]);
  useEffect(() => {
    const delayLoadBooks = async () => {
      // Delay nhỏ (500ms - 2s) để node kịp cập nhật contract
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (bookContract && account) {
        await loadBooks(bookContract);
      }
    };
    delayLoadBooks();
  }, [bookContract, account]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);

          // 👉 Xoá toàn bộ localStorage (hoặc chỉ các key liên quan nếu muốn)
          localStorage.clear();

          // Optionally: reload lại trang hoặc load dữ liệu mới
          window.location.reload();
        }
      });
    }
  }, []);

  let isLoading = false;
  const loadBlockchain = async () => {
    if (isLoading || account) return; // ⛔ Đã có account thì không gọi lại
    isLoading = true;

    try {
      if (!window.ethereum) {
        alert("Vui lòng cài đặt MetaMask.");
        return;
      }

      const web3 = new Web3(window.ethereum);

      // 🔍 Kiểm tra xem đã có tài khoản được kết nối chưa (không bật popup)
      const existingAccounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (!existingAccounts || existingAccounts.length === 0) {
        // 👇 Nếu chưa có, yêu cầu người dùng kết nối (popup)
        const requested = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (!requested || requested.length === 0) {
          alert("❌ Không có tài khoản nào được kết nối.");
          return;
        }

        setAccount(requested[0]);
      } else {
        setAccount(existingAccounts[0]);
      }

      const networkId = await web3.eth.net.getId();
      const deployed = BookManager.networks[networkId];

      if (!deployed) {
        alert("⚠️ Contract chưa được deploy trên mạng hiện tại.");
        return;
      }

      const contract = new web3.eth.Contract(BookManager.abi, deployed.address);
      setBookContract(contract);
    } catch (error) {
      if (error.code === -32002) {
        alert("MetaMask đang xử lý yêu cầu. Vui lòng chờ hoặc kiểm tra popup.");
      } else if (error.code === 4001) {
        alert("Bạn đã từ chối kết nối MetaMask.");
      } else {
        console.error("Lỗi khi load blockchain:", error);
      }
    } finally {
      isLoading = false;
    }
  };

  const loadBooks = async () => {
    try {
      const storedView = localStorage.getItem("viewMode");
      const sortSettings = localStorage.getItem("sortSettings");
      const classifySettings = localStorage.getItem("classifySettings");

      // Ưu tiên phân loại nếu có
      if (classifySettings !== " " && classifySettings && !sortSettings) {
        const classified = await classifyBooks(classifySettings);
        setSelectedCategoryLabel(classifySettings);
        setBooks(classified);
      } else if (sortSettings && !classifySettings) {
        const { sortBy, sortOrder } = JSON.parse(sortSettings);
        const sorted = await sortBooks(sortBy, sortOrder, account);
        localStorage.removeItem("classifySettings");
        setBooks(sorted);
      } else {
        // Mặc định: tải toàn bộ sách
        const result = await fetchBooks(account);
        setBooks(result);
      }

      if (storedView) setViewMode(storedView);
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
    console.log("🔍 form.category:", form.category);
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
          form.category,
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
          form.category,
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

  const hasBorrowed = (book) => {
    return book.borrows?.some(
      (b) => b.borrower.toLowerCase() === account.toLowerCase()
    );
  };

  const handleSortChange = async (sortBy, sortOrder, account) => {
    const sortState = { sortBy, sortOrder };
    localStorage.setItem("sortSettings", JSON.stringify(sortState));
    setSortOption(sortState); // set state nếu bạn dùng 1 object

    const sorted = await sortBooks(sortBy, sortOrder, account);
    // console.log(sorted);
    localStorage.removeItem("classifySettings");

    setBooks(sorted);
  };

  const handleViewChange = (mode) => {
    localStorage.setItem("viewMode", mode); // lưu lại
    setViewMode(mode);
  };

  const handleClassify = async (query, account) => {
    localStorage.setItem("classifySettings", query);
    setClassifyOption(query);

    const classify = await classifyBooks(query, account);
    localStorage.removeItem("sortSettings");

    setBooks(classify);
  };

  return (
    <Container className="mt-4">
      <TestApi books={books} />

      <Row className="justify-content-center">
        <Col className="text-center">
          <h2 className="">📚 BookChain Manager</h2>
          <div>
            <strong>Logged in:</strong> {account}
            <p className="mt-1">
              🔐 Vai trò:{" "}
              {isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "User"}
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
            setCategories={setCategories}
            categories={categories}
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
            <Row className="">
              <Col>
                <h3 md="auto" className="mb-0">
                  Book List
                </h3>
              </Col>
              <Col className="p-0">
                <SearchPage
                  setBooks={setBooks}
                  books={books}
                  bookContract={bookContract}
                  account={account}
                  loadBooks={loadBooks}
                />
              </Col>
              <Col xs lg="2" className="p-0" style={{ textAlign: "right" }}>
                <DropdownButton
                  className=""
                  id="dropdown-basic-button"
                  title="Sắp xếp theo giá"
                  variant="outline-dark"
                >
                  <Dropdown.Item
                    onClick={() => handleSortChange("", "origin", account)}
                    href="#/action-0"
                  >
                    <FaUndo className="me-2" /> {/* Icon undo */}
                    Ban đầu
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleSortChange("price", "asc", account)}
                    href="#/action-1"
                  >
                    🔼 Tăng dần
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleSortChange("price", "desc", account)}
                    href="#/action-2"
                  >
                    🔽 Giảm dần
                  </Dropdown.Item>
                </DropdownButton>
              </Col>
              <Col sm="auto" style={{ textAlign: "right" }}>
                <DropdownButton
                  className=""
                  id="dropdown-basic-button"
                  title="Sắp xếp theo tên"
                  variant="outline-dark"
                >
                  <Dropdown.Item
                    onClick={() => handleSortChange("", "origin", account)}
                    href="#/action-0"
                  >
                    <FaUndo className="me-2" /> {/* Icon undo */}
                    Ban đầu
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleSortChange("title", "asc", account)}
                    href="#/action-1"
                  >
                    🔼 Tăng dần
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleSortChange("title", "desc", account)}
                    href="#/action-2"
                  >
                    🔽 Giảm dần
                  </Dropdown.Item>
                </DropdownButton>
              </Col>
              <Col sm="auto" className="" style={{ textAlign: "right" }}>
                <DropdownButton
                  className=""
                  id="dropdown-basic-button"
                  title={selectedCategoryLabel}
                  variant="outline-dark"
                >
                  <Dropdown.Item
                    onClick={() => {
                      handleClassify(" ", account);
                      setSelectedCategoryLabel("Phân loại");
                    }}
                    href="#/action-0"
                  >
                    <FaUndo className="me-2" /> {/* Icon undo */}
                    Ban đầu
                  </Dropdown.Item>
                  {categories.map((cat) => (
                    <Dropdown.Item
                      key={cat.id}
                      onClick={() => {
                        const hasBooks = books.some((book) =>
                          book.category?.some?.(
                            (c) => c === cat.value || c.name === cat.value
                          )
                        );

                        if (!hasBooks) {
                          alert("Không có loại sách này");
                          return;
                        }
                        setSelectedCategoryLabel(cat.label);
                        handleClassify(cat.value, account);
                      }}
                      href="#/action-0"
                    >
                      {cat.label}
                    </Dropdown.Item>
                  ))}
                </DropdownButton>
              </Col>
              {isAdmin && (
                <Col md="auto" className="p-0">
                  <Button
                    variant={
                      viewMode === "table" ? "dark" : "outline-secondary"
                    }
                    onClick={() => handleViewChange("table")}
                    style={{
                      borderRadius: "8px",
                      padding: "5px 12px 8px 12px",
                      boxShadow: viewMode === "table" ? "0 0 5px #666" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    <FaTable size={18} />
                  </Button>
                </Col>
              )}
              {isAdmin && (
                <Col md="auto">
                  <Button
                    variant={viewMode === "card" ? "dark" : "outline-secondary"}
                    onClick={() => handleViewChange("card")}
                    style={{
                      borderRadius: "8px",
                      padding: "5px 12px 8px 12px",
                      boxShadow: viewMode === "card" ? "0 0 5px #666" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    <FaThLarge size={18} />
                  </Button>
                </Col>
              )}
            </Row>

            <hr />
            {!isAdmin && (
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
                handleRevoke={handleRevoke}
                hasBought={hasBought}
                hasBorrowed={hasBorrowed}
                isSuperAdmin={isSuperAdmin}
              />
            )}
            {viewMode === "card" && isAdmin && (
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
                handleRevoke={handleRevoke}
                hasBought={hasBought}
                hasBorrowed={hasBorrowed}
                setUsername={setUsername}
                username={username}
                isSuperAdmin={isSuperAdmin}
              />
            )}
            {isAdmin && viewMode === "table" && (
              <BookListTableView
                books={books}
                bookContract={bookContract}
                account={account}
                handleBorrow={handleBorrow}
                handleBuy={handleBuy}
                handleReturn={handleReturn}
                handleUpdate={handleUpdate}
                handleDelete={handleDelete}
                isAdmin={isAdmin}
                handleRevoke={handleRevoke}
                hasBought={hasBought}
                hasBorrowed={hasBorrowed}
                setUsername={setUsername}
                username={username}
                isSuperAdmin={isSuperAdmin}
              />
            )}
          </TabPanel>
          <TabPanel value="2">
            <EventLogs
              bookContract={bookContract}
              isAdmin={isAdmin}
              isSuperAdmin={isSuperAdmin}
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
