import React, { useState } from "react";
import axios from "axios";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const res = await axios.post("http://localhost:8080/search", { query });
      setResults(res.data);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>TF-IDF Book Search</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter keywords..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "300px", marginRight: "1rem" }}
        />
        <button type="submit">Search</button>
      </form>

      <div style={{ marginTop: "2rem" }}>
        {results.map((book) => (
          <div key={book.id} style={{ marginBottom: "1rem" }}>
            <h3>{book.title}</h3>
            <p>{book.content}</p>
            <strong>Score:</strong> {book.score.toFixed(4)}
          </div>
        ))}
      </div>
    </div>
  );
}
