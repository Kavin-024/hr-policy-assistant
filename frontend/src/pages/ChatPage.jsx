import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { generateSessionId, sendMessage } from "../services/api";

const SESSION_KEY  = "hr_session_id";
const MESSAGES_KEY = "hr_messages";

const welcome = {
  id: 1, role: "assistant",
  content: "Hello! I'm your TechCorp HR Policy Assistant.\n\nAsk me anything about leave policies, work from home rules, appraisals, notice periods, or any HR policy.",
  sources: [], found: true,
};

const SUGGESTIONS = [
  "How many annual leave days do I get?",
  "What is the WFH policy?",
  "What is the notice period?",
  "Salary increment for rating 5?",
];

export default function ChatPage() {
  const [sessionId] = useState(() => {
    const e = localStorage.getItem(SESSION_KEY);
    if (e) return e;
    const n = generateSessionId();
    localStorage.setItem(SESSION_KEY, n);
    return n;
  });
  const [messages, setMessages] = useState(() => {
    try { const s = localStorage.getItem(MESSAGES_KEY); return s ? JSON.parse(s) : [welcome]; }
    catch { return [welcome]; }
  });
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(p => [...p, { id: Date.now(), role: "user", content: msg, sources: [], found: true }]);
    setLoading(true);
    try {
      const r = await sendMessage(sessionId, msg);
      setMessages(p => [...p, { id: Date.now()+1, role: "assistant",
        content: r.response, sources: r.sources || [], found: r.found }]);
    } catch {
      setMessages(p => [...p, { id: Date.now()+1, role: "assistant",
        content: "Connection error. Please check if the backend is running.", sources: [], found: true }]);
    } finally { setLoading(false); }
  }

  function handleNewChat() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(MESSAGES_KEY);
    const n = generateSessionId();
    localStorage.setItem(SESSION_KEY, n);
    setMessages([welcome]);
    window.location.reload();
  }

  const isOnlyWelcome = messages.length === 1;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg-base)" }}>

      {/* ── Header ── */}
      <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"0 24px", height:"60px", borderBottom:"1px solid var(--border)",
        background:"var(--bg-surface)", flexShrink:0 }}>

        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{ width:"34px", height:"34px", borderRadius:"10px",
            background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"16px", boxShadow:"0 0 12px rgba(59,130,246,0.4)" }}>📋</div>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontWeight:700,
              fontSize:"15px", color:"var(--text-primary)", letterSpacing:"0.01em" }}>
              HR Policy Assistant
            </div>
            <div style={{ fontSize:"11px", color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>
              TechCorp · Powered by RAG
            </div>
          </div>
        </div>

        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <div style={{ width:"7px", height:"7px", borderRadius:"50%",
            background:"var(--success)", boxShadow:"0 0 6px var(--success)",
            animation:"pulse-glow 2s infinite" }} />
          <span style={{ fontSize:"12px", color:"var(--text-secondary)", marginRight:"16px" }}>
            Online
          </span>
          <button onClick={handleNewChat} style={{ background:"transparent",
            border:"1px solid var(--border-bright)", borderRadius:"8px",
            color:"var(--text-secondary)", padding:"6px 14px", fontSize:"12px",
            cursor:"pointer", fontFamily:"var(--font-body)",
            transition:"all 0.2s" }}
            onMouseEnter={e => e.target.style.borderColor="var(--accent)"}
            onMouseLeave={e => e.target.style.borderColor="var(--border-bright)"}>
            New Chat
          </button>
          <Link to="/history" style={{ background:"var(--accent)", border:"none",
            borderRadius:"8px", color:"#fff", padding:"6px 14px", fontSize:"12px",
            cursor:"pointer", textDecoration:"none", fontFamily:"var(--font-body)",
            fontWeight:500 }}>
            History →
          </Link>
        </div>
      </header>

      {/* ── Messages ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px",
        display:"flex", flexDirection:"column", gap:"4px" }}>

        {/* Suggestions — shown only when just welcome message */}
        {isOnlyWelcome && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px",
            justifyContent:"center", marginBottom:"24px", marginTop:"8px",
            animation:"fadeUp 0.5s ease both" }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => handleSend(s)}
                style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)",
                  borderRadius:"20px", color:"var(--text-secondary)", padding:"7px 16px",
                  fontSize:"12px", cursor:"pointer", fontFamily:"var(--font-body)",
                  transition:"all 0.2s", animationDelay:`${i*0.08}s` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)";
                  e.currentTarget.style.color="var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)";
                  e.currentTarget.style.color="var(--text-secondary)"; }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={msg.id} style={{ display:"flex", flexDirection:"column",
            alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom:"12px",
            animation:"fadeUp 0.3s ease both",
            animationDelay:`${idx === messages.length-1 ? 0 : 0}s` }}>

            {/* Role label */}
            <div style={{ fontSize:"10px", fontFamily:"var(--font-mono)",
              color:"var(--text-muted)", marginBottom:"5px", letterSpacing:"0.08em",
              textTransform:"uppercase" }}>
              {msg.role === "user" ? "You" : "HR Assistant"}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth:"72%", padding:"12px 16px", fontSize:"14px", lineHeight:"1.7",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: msg.role === "user"
                ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
                : "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: msg.role === "user" ? "none" : "1px solid var(--border)",
              boxShadow: msg.role === "user"
                ? "0 4px 20px rgba(59,130,246,0.25)"
                : "0 2px 8px rgba(0,0,0,0.3)",
              whiteSpace:"pre-wrap", wordBreak:"break-word"
            }}>
              {msg.content}
            </div>

            {/* Sources */}
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginTop:"6px", maxWidth:"72%" }}>
                {msg.sources.map((s, i) => (
                  <div key={i} style={{ display:"inline-flex", alignItems:"center", gap:"5px",
                    background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.25)",
                    borderRadius:"6px", padding:"3px 10px", fontSize:"11px",
                    color:"#60a5fa", fontFamily:"var(--font-mono)" }}>
                    📄 {s.file} · pg {s.page}
                  </div>
                ))}
              </div>
            )}

            {/* Not found */}
            {msg.role === "assistant" && msg.found === false && (
              <div style={{ marginTop:"6px", maxWidth:"72%", padding:"5px 12px",
                background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)",
                borderRadius:"6px", fontSize:"11px", color:"var(--warning)",
                fontFamily:"var(--font-mono)" }}>
                ⚠ Not found in policy documents
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", marginBottom:"12px" }}>
            <div style={{ fontSize:"10px", fontFamily:"var(--font-mono)", color:"var(--text-muted)",
              marginBottom:"5px", letterSpacing:"0.08em", textTransform:"uppercase" }}>
              HR Assistant
            </div>
            <div style={{ display:"flex", gap:"5px", padding:"12px 16px",
              background:"var(--bg-elevated)", borderRadius:"16px 16px 16px 4px",
              border:"1px solid var(--border)" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:"7px", height:"7px", borderRadius:"50%",
                  background:"var(--accent)", animation:"bounce 1.2s infinite",
                  animationDelay:`${i*0.2}s`, opacity:0.7 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ padding:"16px 24px 20px", borderTop:"1px solid var(--border)",
        background:"var(--bg-surface)", flexShrink:0 }}>
        <div style={{ display:"flex", gap:"10px", maxWidth:"800px", margin:"0 auto",
          background:"var(--bg-elevated)", border:"1px solid var(--border-bright)",
          borderRadius:"14px", padding:"6px 6px 6px 16px",
          transition:"border-color 0.2s", boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==="Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            disabled={loading}
            placeholder="Ask about leave, WFH, appraisals, notice period..."
            style={{ flex:1, background:"transparent", border:"none", outline:"none",
              color:"var(--text-primary)", fontSize:"14px", fontFamily:"var(--font-body)",
              padding:"6px 0" }} />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()}
            style={{ background: loading || !input.trim()
              ? "var(--bg-hover)" : "linear-gradient(135deg,#1d4ed8,#3b82f6)",
              border:"none", borderRadius:"10px", color:"#fff", padding:"10px 20px",
              fontSize:"13px", fontWeight:600, cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontFamily:"var(--font-body)", transition:"all 0.2s",
              boxShadow: loading || !input.trim() ? "none" : "0 0 12px rgba(59,130,246,0.4)" }}>
            Send
          </button>
        </div>
        <div style={{ textAlign:"center", marginTop:"8px", fontSize:"11px",
          color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>
          Answers sourced from official TechCorp HR Policy 2025
        </div>
      </div>
    </div>
  );
}