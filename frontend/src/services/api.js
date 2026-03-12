const BASE_URL = "http://localhost:8000";

export function generateSessionId() {
  return Math.random().toString(36).substring(2, 10);
}

export async function sendMessage(sessionId, message) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  if (!response.ok) throw new Error("Failed to send message");
  return await response.json();
  // returns { response, sources, found }
}

export async function getAllSessions() {
  const response = await fetch(`${BASE_URL}/history`);
  if (!response.ok) throw new Error("Failed to fetch sessions");
  return await response.json();
}

export async function getSessionMessages(sessionId) {
  const response = await fetch(`${BASE_URL}/history/${sessionId}`);
  if (!response.ok) throw new Error("Failed to fetch messages");
  return await response.json();
}