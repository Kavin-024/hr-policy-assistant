from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    session_id: str
    message:    str

class SourceItem(BaseModel):
    file: str
    page: int

class ChatResponse(BaseModel):
    response:  str
    sources:   List[SourceItem]
    found:     bool           # True if answer found in docs, False if not
