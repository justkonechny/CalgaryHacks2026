"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    console.log("Effect ran");
  }, []);

  // function for calling LLM for searching
  async function searchTest() {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // put search input parameters in here
        query: `socrates plato aristotle`,
      }),
    });

    const data = await response.json();

    // logs the data
    console.log(data);
  }

  function testClick() {
    console.log("button pressed");
    searchTest();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2rem" }}>a js app</h1>
      <button onClick={testClick}>test</button>
    </main>
  );
}
