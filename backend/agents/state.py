from typing import TypedDict, List, Optional

class AgentState(TypedDict):
    # User input
    question:        str
    session_id:      str

    # Retrieved chunks from ChromaDB
    retrieved_chunks: List[dict]

    # Grader decision
    chunks_relevant: bool

    # Final output
    final_response:  str
    sources:         List[dict]   # list of {file, page}

    # Routing
    route:           str          # "policy" or "direct"
