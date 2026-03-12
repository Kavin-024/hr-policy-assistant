import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllSessions, getSessionMessages } from "../services/api";

function HistoryPage() {
  const [sessions, setSessions]       = useState([]);
  const [selected, setSelected]       = useState(null);
  const [messages, setMessages]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [msgLoading, setMsgLoading]   = useState(false);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const data = await getAllSessions();
        setSessions(data);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  async function handleSelectSession(sessionId) {
    setSelected(sessionId);
    setMsgLoading(true);
    try {
      const data = await getSessionMessages(sessionId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setMsgLoading(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh",
      backgroundColor: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#1e293b", padding: "14px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%",
            backgroundColor: "#2563eb", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "18px" }}>🕓</div>
          <div>
            <div style={{ color: "#fff", fontWeight: "700", fontSize: "16px" }}>
              Conversation History
            </div>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>
              All past HR policy conversations
            </div>
          </div>
        </div>
        <Link to="/" style={{ color: "#94a3b8", textDecoration: "none",
          fontSize: "13px", padding: "6px 12px", border: "1px solid #334155",
          borderRadius: "6px" }}>
          ← Back to Chat
        </Link>
      </div>

      {/* Body — two panel layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden",
        maxWidth: "1100px", width: "100%", margin: "0 auto",
        gap: "0", backgroundColor: "#fff",
        boxShadow: "0 0 20px rgba(0,0,0,0.05)" }}>

        {/* Left panel — session list */}
        <div style={{ width: "320px", borderRight: "1px solid #e2e8f0",
          overflowY: "auto", flexShrink: 0 }}>

          <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0",
            fontSize: "13px", fontWeight: "600", color: "#64748b",
            textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {sessions.length} Conversations
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
              No conversations yet.
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.session_id}
                onClick={() => handleSelectSession(session.session_id)}
                style={{
                  padding: "14px 16px", cursor: "pointer",
                  borderBottom: "1px solid #f1f5f9",
                  backgroundColor: selected === session.session_id ? "#eff6ff" : "#fff",
                  borderLeft: selected === session.session_id
                    ? "3px solid #2563eb" : "3px solid transparent",
                  transition: "all 0.1s"
                }}>
                <div style={{ fontSize: "13px", fontWeight: "600",
                  color: "#1e293b", fontFamily: "monospace", marginBottom: "4px" }}>
                  {session.session_id.substring(0, 12)}...
                </div>
                <div style={{ fontSize: "12px", color: "#475569",
                  marginBottom: "4px", overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session.last_message || "—"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {formatDate(session.last_time)}
                  </span>
                  <span style={{ fontSize: "11px", backgroundColor: "#f1f5f9",
                    color: "#64748b", padding: "2px 8px", borderRadius: "10px" }}>
                    {session.message_count} msgs
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right panel — messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {!selected ? (
            <div style={{ display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              height: "100%", color: "#94a3b8", gap: "12px" }}>
              <div style={{ fontSize: "40px" }}>💬</div>
              <div style={{ fontSize: "15px" }}>
                Select a conversation to view messages
              </div>
            </div>
          ) : msgLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
              Loading messages...
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} style={{ marginBottom: "16px", display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8",
                  marginBottom: "4px", textTransform: "capitalize" }}>
                  {msg.role}
                </div>
                <div style={{
                  maxWidth: "72%", padding: "10px 14px",
                  fontSize: "14px", lineHeight: "1.6",
                  borderRadius: msg.role === "user"
                    ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  backgroundColor: msg.role === "user" ? "#2563eb" : "#f1f5f9",
                  color: msg.role === "user" ? "#fff" : "#1e293b",
                  whiteSpace: "pre-wrap"
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                  {formatDate(msg.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;