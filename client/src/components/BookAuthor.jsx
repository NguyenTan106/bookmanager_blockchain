import React, { useEffect, useState } from "react";

function BookAuthor({ owner, bookContract }) {
  const [author, setAuthor] = useState("");

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const name = await bookContract.methods.usernames(owner).call();
        // console.log(
        //   await bookContract.methods
        //     .usernames("0x5e46ed6a8a07D878F72ffee54DcaEC1B98e359c8")
        //     .call()
        // );
        // console.log("👤 Username của:", owner, "→", name);
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
