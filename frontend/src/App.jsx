import { Routes, Route } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import HistoryPage from "./pages/HistoryPage";

function App() {
  return (
    <Routes>
      <Route path="/"        element={<ChatPage />} />
      <Route path="/history" element={<HistoryPage />} />
    </Routes>
  );
}

export default App;