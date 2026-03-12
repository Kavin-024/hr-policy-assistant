import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllSessions, getSessionMessages } from "../services/api";

export default function HistoryPage() {
  const [sessions, setSessions]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    getAllSessions()
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSelect(id) {
    setSelected(id);
    setMsgLoading(true);
    try { setMessages(await getSessionMessages(id)); }
    catch (e) { console.error(e); }
    finally { setMsgLoading(false); }
  }

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      day:"2-digit", month:"short", year:"numeric",
      hour:"2-digit", minute:"2-digit", timeZone:"Asia/Kolkata"
    });
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg-base)" }}>

      {/* Header */}
      <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"0 24px", height:"60px", borderBottom:"1px solid var(--border)",
        background:"var(--bg-surface)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{ width:"34px", height:"34px", borderRadius:"10px",
            background:"linear-gradient(135deg,#0f766e,#14b8a6)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>🕓</div>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontWeight:700,
              fontSize:"15px", color:"var(--text-primary)" }}>Conversation History</div>
            <div style={{ fontSize:"11px", color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>
              {sessions.length} sessions recorded
            </div>
          </div>
        </div>
        <Link to="/" style={{ background:"var(--bg-elevated)", border:"1px solid var(--border-bright)",
          borderRadius:"8px", color:"var(--text-secondary)", padding:"6px 14px",
          fontSize:"12px", textDecoration:"none", fontFamily:"var(--font-body)" }}>
          ← Back to Chat
        </Link>
      </header>

      {/* Body */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* Left — session list */}
        <div style={{ width:"300px", borderRight:"1px solid var(--border)",
          overflowY:"auto", background:"var(--bg-surface)", flexShrink:0 }}>

          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)",
            fontSize:"10px", fontFamily:"var(--font-mono)", color:"var(--text-muted)",
            letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Recent Sessions
          </div>

          {loading ? (
            <div style={{ padding:"40px", textAlign:"center", color:"var(--text-muted)",
              fontFamily:"var(--font-mono)", fontSize:"12px" }}>Loading...</div>
          ) : sessions.length === 0 ? (
            <div style={{ padding:"40px", textAlign:"center", color:"var(--text-muted)",
              fontSize:"13px" }}>No conversations yet</div>
          ) : sessions.map(s => (
            <div key={s.session_id} onClick={() => handleSelect(s.session_id)}
              style={{ padding:"14px 16px", cursor:"pointer",
                borderBottom:"1px solid var(--border)",
                borderLeft: selected === s.session_id
                  ? "2px solid var(--accent)" : "2px solid transparent",
                background: selected === s.session_id ? "var(--bg-elevated)" : "transparent",
                transition:"all 0.15s" }}
              onMouseEnter={e => { if(selected !== s.session_id)
                e.currentTarget.style.background="var(--bg-hover)"; }}
              onMouseLeave={e => { if(selected !== s.session_id)
                e.currentTarget.style.background="transparent"; }}>

              <div style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
                color:"var(--accent)", marginBottom:"5px" }}>
                #{s.session_id.substring(0,10)}
              </div>
              <div style={{ fontSize:"12px", color:"var(--text-secondary)",
                marginBottom:"6px", overflow:"hidden", textOverflow:"ellipsis",
                whiteSpace:"nowrap" }}>
                {s.last_message || "—"}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"10px", color:"var(--text-muted)",
                  fontFamily:"var(--font-mono)" }}>
                  {formatDate(s.last_time)}
                </span>
                <span style={{ fontSize:"10px", background:"var(--bg-hover)",
                  color:"var(--text-muted)", padding:"2px 8px",
                  borderRadius:"10px", fontFamily:"var(--font-mono)" }}>
                  {s.message_count} msgs
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right — messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px",
          display:"flex", flexDirection:"column", gap:"4px" }}>

          {!selected ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", height:"100%", gap:"12px",
              color:"var(--text-muted)" }}>
              <div style={{ fontSize:"48px", opacity:0.3 }}>💬</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:"12px",
                letterSpacing:"0.05em" }}>
                SELECT A SESSION TO VIEW
              </div>
            </div>
          ) : msgLoading ? (
            <div style={{ textAlign:"center", padding:"40px",
              color:"var(--text-muted)", fontFamily:"var(--font-mono)", fontSize:"12px" }}>
              Loading messages...
            </div>
          ) : messages.map((msg, i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom:"12px", animation:"fadeUp 0.2s ease both",
              animationDelay:`${i*0.03}s` }}>
              <div style={{ fontSize:"10px", fontFamily:"var(--font-mono)",
                color:"var(--text-muted)", marginBottom:"4px",
                letterSpacing:"0.08em", textTransform:"uppercase" }}>
                {msg.role === "user" ? "Employee" : "HR Assistant"}
              </div>
              <div style={{
                maxWidth:"70%", padding:"10px 14px", fontSize:"13px", lineHeight:"1.7",
                borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
                  : "var(--bg-elevated)",
                color:"var(--text-primary)",
                border: msg.role === "user" ? "none" : "1px solid var(--border)",
                whiteSpace:"pre-wrap"
              }}>
                {msg.content}
              </div>
              <div style={{ fontSize:"10px", fontFamily:"var(--font-mono)",
                color:"var(--text-muted)", marginTop:"3px" }}>
                {formatDate(msg.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}