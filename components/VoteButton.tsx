"use client";

import { useEffect, useState } from "react";

// Human-in-the-loop selection pressure. Votes are optimistic + remembered
// locally, and posted to /api/vote so they can fold into the next generation's
// fitness (SPEC §4). One vote per visitor per piece.
export function VoteButton({ pieceId }: { pieceId: string }) {
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    setVoted(localStorage.getItem(`vote:${pieceId}`) === "1");
  }, [pieceId]);

  function toggle() {
    const v = !voted;
    setVoted(v);
    localStorage.setItem(`vote:${pieceId}`, v ? "1" : "0");
    fetch("/api/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pieceId, delta: v ? 1 : -1 }),
    }).catch(() => {});
  }

  return (
    <button
      className={"btn" + (voted ? " gold" : "")}
      onClick={toggle}
      style={{ padding: "6px 14px", fontSize: "0.85rem" }}
    >
      {voted ? "♥ Voted" : "♡ Vote"}
    </button>
  );
}
