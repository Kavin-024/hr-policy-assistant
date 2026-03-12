import os
from langchain_chroma import Chroma
from rag.embeddings import get_embeddings

CHROMA_DIR = "data/chroma_db"

_vectorstore = None

def get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = Chroma(
            persist_directory=CHROMA_DIR,
            embedding_function=get_embeddings(),
            collection_name="hr_policies"
        )
    return _vectorstore

def search_policy(question: str, k: int = 4) -> list[dict]:
    vs = get_vectorstore()
    results = vs.similarity_search_with_score(question, k=k)

    chunks = []
    for doc, score in results:
        chunks.append({
            "content":     doc.page_content,
            "source_file": doc.metadata.get("source_file", "Unknown"),
            "page":        doc.metadata.get("page", 1),
            "score":       round(float(score), 4)
        })
    return chunks