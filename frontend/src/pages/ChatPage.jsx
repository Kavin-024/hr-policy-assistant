import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { generateSessionId, sendMessage } from "../services/api";

const SESSION_KEY = "hr_session_id";
const MESSAGES_KEY = "hr_messages";

const welcome = {
  id: 1,
  role: "assistant",
  content: "Hello! I am the TechCorp HR Policy Assistant. Ask me anything about leave policies, work from home, appraisals, or any HR policy.",
  sources: [],
  found: true,
};

function ChatPage() {
  const [sessionId] = useState(() => {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const newId = generateSessionId();
    localStorage.setItem(SESSION_KEY, newId);
    return newId;
  });

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(MESSAGES_KEY);
      return saved ? JSON.parse(saved) : [welcome];
    } catch {
      return [welcome];
    }
  });

  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");

    const userMsg = { id: Date.now(), role: "user", content: text, sources: [], found: true };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await sendMessage(sessionId, text);
      const botMsg = {
        id:      Date.now() + 1,
        role:    "assistant",
        content: result.response,
        sources: result.sources || [],
        found:   result.found,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1, role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        sources: [], found: true,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleNewChat() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(MESSAGES_KEY);
    const newId = generateSessionId();
    localStorage.setItem(SESSION_KEY, newId);
    setMessages([welcome]);
    window.location.reload();
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
            justifyContent: "center", fontSize: "18px" }}>📋</div>
          <div>
            <div style={{ color: "#fff", fontWeight: "700", fontSize: "16px" }}>
              TechCorp HR Assistant
            </div>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>
              Powered by AI · Answers from official HR policy
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleNewChat} style={{ color: "#94a3b8",
            backgroundColor: "transparent", border: "1px solid #334155",
            borderRadius: "6px", padding: "6px 12px", fontSize: "13px", cursor: "pointer" }}>
            New Chat
          </button>
          <Link to="/history" style={{ color: "#94a3b8", textDecoration: "none",
            fontSize: "13px", padding: "6px 12px", border: "1px solid #334155",
            borderRadius: "6px" }}>
            History →
          </Link>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: "800px",
        width: "100%", margin: "0 auto", backgroundColor: "#fff",
        boxShadow: "0 0 20px rgba(0,0,0,0.05)", overflow: "hidden" }}>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px",
          display: "flex", flexDirection: "column" }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: "16px",
              display: "flex", flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>

              {/* Bubble */}
              <div style={{
                maxWidth: "72%", padding: "10px 14px", fontSize: "14px", lineHeight: "1.6",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                backgroundColor: msg.role === "user" ? "#2563eb" : "#f1f5f9",
                color: msg.role === "user" ? "#fff" : "#1e293b",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                whiteSpace: "pre-wrap"
              }}>
                {msg.content}
              </div>

              {/* Source citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: "6px", maxWidth: "72%" }}>
                  {msg.sources.map((s, i) => (
                    <div key={i} style={{ display: "inline-flex", alignItems: "center",
                      gap: "5px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe",
                      borderRadius: "6px", padding: "3px 10px", fontSize: "12px",
                      color: "#1d4ed8", marginRight: "6px", marginTop: "4px" }}>
                      📄 {s.file} — Page {s.page}
                    </div>
                  ))}
                </div>
              )}

              {/* Not found warning */}
              {msg.role === "assistant" && !msg.found && (
                <div style={{ marginTop: "6px", maxWidth: "72%", padding: "6px 12px",
                  backgroundColor: "#fff7ed", border: "1px solid #fed7aa",
                  borderRadius: "6px", fontSize: "12px", color: "#c2410c" }}>
                  ⚠️ Answer not found in HR policy documents
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", gap: "4px", padding: "10px 14px",
              backgroundColor: "#f1f5f9", borderRadius: "18px 18px 18px 4px",
              width: "fit-content", marginBottom: "12px" }}>
              {[0,1,2].map((i) => (
                <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%",
                  backgroundColor: "#94a3b8", animation: "bounce 1.2s infinite",
                  animationDelay: `${i * 0.2}s` }} />
              ))}
              <style>{`@keyframes bounce {
                0%,60%,100%{transform:translateY(0)}
                30%{transform:translateY(-6px)}
              }`}</style>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: "1px solid #e2e8f0", padding: "12px 16px",
          display: "flex", gap: "8px", backgroundColor: "#fff" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask about leave, WFH, appraisals, notice period..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: "24px",
              border: "1px solid #e2e8f0", fontSize: "14px", outline: "none",
              backgroundColor: loading ? "#f8fafc" : "#fff", color: "#1e293b" }}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            style={{ padding: "10px 20px", borderRadius: "24px", border: "none",
              backgroundColor: loading || !input.trim() ? "#94a3b8" : "#2563eb",
              color: "#fff", fontSize: "14px", fontWeight: "600",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer" }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;