import React, { useEffect, useState } from "react";

function BookAuthor({ owner, bookContract }) {
  const [author, setAuthor] = useState("");

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const name = await bookContract.methods.usernames(owner).call();
        setAuthor(name);
      } catch (err) {
        console.error("Lỗi lấy tên tác giả:", err);
      }
    };

    if (owner) fetchAuthor();
  }, [owner, bookContract]);

  return <> {author || "Không rõ"}</>;
}

export default BookAuthor;
