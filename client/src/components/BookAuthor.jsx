import React, { useEffect, useState } from "react";

function BookAuthor({ owner, bookContract, account }) {
  const [author, setAuthor] = useState("");

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        if (!account || !owner || !bookContract) return; // 👈 đảm bảo đủ điều kiện
        const name = await bookContract.methods
          .usernames(owner)
          .call({ from: account });
        console.log(name);
        setAuthor(name);
      } catch (err) {
        console.error("Lỗi lấy tên tác giả:", err);
      }
    };

    fetchAuthor();
  }, [owner, bookContract, account]);

  return <>{" " + author || " Không rõ"}</>;
}

export default BookAuthor;
