export default function Home() {
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
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Welcome</h1>
      <p style={{ color: "#666" }}>
        Get started by editing <code>app/page.tsx</code>.
      </p>
    </main>
  );
}
