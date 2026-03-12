from fastapi import APIRouter
from db.models import ChatRequest, ChatResponse, SourceItem
from db.mongodb import save_message, get_session_messages, get_all_sessions
from agents.graph import hr_graph

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session_id = request.session_id
    message    = request.message

    # Invoke LangGraph pipeline
    result = hr_graph.invoke({
        "question":         message,
        "session_id":       session_id,
        "retrieved_chunks": [],
        "chunks_relevant":  False,
        "final_response":   "",
        "sources":          [],
        "route":            ""
    })

    # Save to MongoDB
    save_message(session_id, "user",      message)
    save_message(session_id, "assistant", result["final_response"])

    sources = [SourceItem(file=s["file"], page=s["page"]) for s in result["sources"]]
    found   = len(sources) > 0 or result.get("route") == "direct"

    return ChatResponse(
        response=result["final_response"],
        sources=sources,
        found=found
    )

@router.get("/history")
async def get_history():
    sessions = get_all_sessions()
    for s in sessions:
        s["session_id"] = s.pop("_id")
    return sessions

@router.get("/history/{session_id}")
async def get_session_history(session_id: str):
    messages = get_session_messages(session_id)
    return messages