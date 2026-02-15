"use client";

import { useState } from "react";

const menus = [
  { id: "A", label: "A", items: ["1", "2", "3"] },
  { id: "B", label: "B", items: ["1", "2", "3"] },
];

export default function LeftNav() {
  const [openIds, setOpenIds] = useState(new Set());

  const toggle = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <nav
      style={{
        width: "220px",
        minWidth: "220px",
        height: "100vh",
        backgroundColor: "#0f0f0f",
        borderRight: "1px solid #2a2a2a",
        display: "flex",
        flexDirection: "column",
        paddingTop: "1rem",
        paddingLeft: "0.75rem",
        paddingRight: "0.75rem",
        gap: "0.25rem",
      }}
    >
      <h2
        style={{
          margin: 0,
          padding: "0.6rem 0.75rem",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#888",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Topics
      </h2>
      {menus.map(({ id, label, items }) => {
        const isOpen = openIds.has(id);
        return (
          <div key={id}>
            <button
              type="button"
              onClick={() => toggle(id)}
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "transparent",
                color: "#fff",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#2a2a2a";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <span>{label}</span>
              <span style={{ opacity: 0.7, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>▼</span>
            </button>
            {isOpen && (
              <div
                style={{
                  paddingLeft: "0.75rem",
                  paddingTop: "0.25rem",
                  paddingBottom: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.2rem",
                }}
              >
                {items.map((item) => (
                  <a
                    key={item}
                    href="#"
                    style={{
                      padding: "0.4rem 0.5rem",
                      borderRadius: "6px",
                      color: "#bbb",
                      fontSize: "0.9rem",
                      transition: "background-color 0.15s ease, color 0.15s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#2a2a2a";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#bbb";
                    }}
                  >
                    {item}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
