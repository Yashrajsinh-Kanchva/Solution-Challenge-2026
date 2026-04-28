export default function Footer() {
  return (
    <footer style={{
      borderTop: "1.5px solid #E8EDD0",
      background: "#F7F5EE",
      padding: "0.75rem 2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
    }}>
      <p style={{ fontSize: "0.75rem", color: "#6B7160", fontFamily: "'Public Sans', sans-serif" }}>
        VolunteerBridge · Smart Volunteer Coordination
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2E6B32" }} />
        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6B7160", fontFamily: "'Public Sans', sans-serif" }}>
          All systems operational
        </p>
      </div>
    </footer>
  );
}
