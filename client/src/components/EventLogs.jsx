import React, { useEffect, useState } from "react";
import Web3 from "web3";

export default function EventLogs({
  bookContract,
  isAdmin,
  isSuperAdmin,
  account,
  contract,
}) {
  const [history, setHistory] = useState([]);
  const ADMIN_ROLE = Web3.utils.keccak256("ADMIN_ROLE");
  useEffect(() => {
    const loadLogs = async () => {
      if (!bookContract) return;

      try {
        const fromBlock = 0;
        const toBlock = "latest";
        const events = await Promise.all([
          bookContract.getPastEvents("BookAdded", { fromBlock, toBlock }),
          bookContract.getPastEvents("BookEdited", { fromBlock, toBlock }),
          bookContract.getPastEvents("BookDeleted", { fromBlock, toBlock }),
          bookContract.getPastEvents("BookBorrowed", { fromBlock, toBlock }),
          bookContract.getPastEvents("BookReturned", { fromBlock, toBlock }),
          bookContract.getPastEvents("AdminGranted", { fromBlock, toBlock }),
          bookContract.getPastEvents("AdminRevoked", { fromBlock, toBlock }),
          bookContract.getPastEvents("BookPurchased", { fromBlock, toBlock }),
        ]);

        const types = [
          "add",
          "edit",
          "delete",
          "borrow",
          "return",
          "grant",
          "revoke",
          "purchase",
        ];

        const allLogs = events.flatMap((e, i) =>
          e.map((log) => ({ ...log, type: types[i] }))
        );

        const web3 = new Web3(window.ethereum);
        const logsWithTimestamps = await Promise.all(
          allLogs.map(async (log) => {
            const block = await web3.eth.getBlock(log.blockNumber);
            return { ...log, timestamp: block.timestamp };
          })
        );

        // Tạo adminMap
        const adminMap = {};

        for (let log of logsWithTimestamps) {
          const addr = log.returnValues?.performedBy?.toLowerCase();
          if (addr && adminMap[addr] === undefined) {
            adminMap[addr] = await contract.methods
              .hasRole(ADMIN_ROLE, addr)
              .call();
          }
        }

        // Lọc log theo quyền người dùng
        const filteredLogs = logsWithTimestamps.filter((log) => {
          const performer = log.returnValues.performedBy;
          const borrower = log.returnValues.borrower;
          const buyer = log.returnValues.buyer;
          const owner = log.returnValues.owner;
          const event = log.event;
          // console.log("🔍 Account:", account);
          // console.log("📦 Log:", log.returnValues.owner);

          const isGrantOrRevoke =
            event === "AdminGranted" || event === "AdminRevoked";

          // Super admin thấy tất cả
          if (isSuperAdmin) return true;

          // Nếu là admin:
          if (isAdmin) {
            // Nếu là log gán quyền thì ẩn khỏi admin
            if (isGrantOrRevoke) return false;

            // Admin thấy chính mình hoặc người dùng (không phải admin)
            return (
              performer?.toLowerCase() === account?.toLowerCase() ||
              borrower ||
              buyer ||
              owner?.toLowerCase() === account?.toLowerCase()
            );
          }

          // Nếu là user: chỉ thấy chính mình (performer hoặc borrower)
          const userVisibleEvents = [
            "BookBorrowed",
            "BookReturned",
            "BookRevoked",
            "BookPurchased",
          ];

          if (isAdmin === false)
            return (
              userVisibleEvents.includes(event) &&
              (performer?.toLowerCase() === account?.toLowerCase() ||
                borrower?.toLowerCase() === account?.toLowerCase() ||
                buyer?.toLowerCase() === account?.toLowerCase())
            );
        });

        filteredLogs.sort(
          (a, b) => Number(b.blockNumber) - Number(a.blockNumber)
        );
        // console.log("Filtered Logs:", filteredLogs);
        setHistory(filteredLogs);
      } catch (err) {
        console.error("Lỗi khi tải event logs:", err);
      }
    };

    loadLogs();
  }, [bookContract]);

  const renderLogMessage = (log) => {
    const date = new Date(Number(log.timestamp) * 1000).toLocaleDateString();

    switch (log.type) {
      case "add":
        return `📘 Đã thêm sách ID: ${log.returnValues.id} Title: ${log.returnValues.title} | Author: ${log.returnValues.owner} (${date})`;
      case "edit":
        return `✏️ Đã sửa sách ID: ${log.returnValues.id} Title: ${log.returnValues.title} | Author: ${log.returnValues.performedBy} (${date})`;
      case "delete":
        return `🗑️ Đã xóa sách ID: ${log.returnValues.id} (${date})`;
      case "borrow":
        return `📥 Mượn sách ID: ${log.returnValues.id} bởi ${log.returnValues.borrower} vào ngày ${date}`;
      case "return":
        return `📤 Trả sách ID: ${log.returnValues.id} (${date})`;
      case "grant":
        return `👑 Cấp quyền admin cho ${log.returnValues.account} vào ngày ${date}`;
      case "revoke":
        return `⛔ Thu hồi quyền admin từ ${log.returnValues.account} vào ngày ${date}`;
      case "purchase":
        const priceEth = Web3.utils.fromWei(log.returnValues.price, "ether");
        return `💰 Mua sách: người dùng ${log.returnValues.buyer} đã mua sách ID: ${log.returnValues.id} với giá ${priceEth} ETH vào ngày ${date}`;
      default:
        return `📦 Hoạt động khác (${date})`;
    }
  };

  return (
    <div>
      <h3>📜 Lịch sử hoạt động</h3>
      {history.length === 0 ? (
        <p>⏳ Đang tải lịch sử...</p>
      ) : (
        <ul>
          {history.map((log, idx) => (
            <li key={idx}>
              ⏱️ [Block {log.blockNumber}] {renderLogMessage(log)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
