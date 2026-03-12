from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from agents.state import AgentState
from rag.vectorstore import search_policy
import os

# ── LLM Setup ─────────────────────────────────────────
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY")
)

# ── Node 1: Router ────────────────────────────────────
def router_node(state: AgentState) -> AgentState:
    question = state["question"].lower().strip()

    greetings = ["hi", "hello", "hey", "good morning", "good afternoon",
                 "good evening", "howdy", "greetings"]
    goodbyes  = ["bye", "goodbye", "see you", "thanks", "thank you",
                 "that's all", "exit", "quit"]

    if any(g in question for g in greetings):
        return {**state, "route": "direct",
                "final_response": "Hello! I am the TechCorp HR Policy Assistant. Ask me anything about leave policies, work from home, appraisals, code of conduct, or any other HR policy.",
                "sources": []}

    if any(g in question for g in goodbyes):
        return {**state, "route": "direct",
                "final_response": "Thank you for using the HR Policy Assistant. Have a great day!",
                "sources": []}

    return {**state, "route": "policy"}


# ── Node 2: RAG Agent ─────────────────────────────────
def rag_node(state: AgentState) -> AgentState:
    question = state["question"]
    chunks   = search_policy(question, k=4)
    return {**state, "retrieved_chunks": chunks}


# ── Node 3: Grader Agent ──────────────────────────────
def grader_node(state: AgentState) -> AgentState:
    question = state["question"]
    chunks   = state["retrieved_chunks"]

    if not chunks:
        return {**state, "chunks_relevant": False}

    # Build context from top chunks
    context = "\n\n".join([c["content"] for c in chunks])

    messages = [
        SystemMessage(content="""You are a relevance grader.
Your only job is to decide if the retrieved document chunks are relevant to the user question.
Respond with ONLY one word: YES or NO.
YES = the chunks contain information that can directly or partially answer the question.
YES = even if the chunks are about a related policy topic that helps answer the question.
NO  = only if the chunks are completely unrelated to the question topic."""),
        HumanMessage(content=f"Question: {question}\n\nRetrieved chunks:\n{context}")
    ]

    response = llm.invoke(messages)
    answer   = response.content.strip().upper()

    relevant = "YES" in answer
    return {**state, "chunks_relevant": relevant}


# ── Node 4: Writer Agent ──────────────────────────────
def writer_node(state: AgentState) -> AgentState:
    question  = state["question"]
    chunks    = state["retrieved_chunks"]
    relevant  = state["chunks_relevant"]

    # If grader said not relevant
    if not relevant:
        return {
            **state,
            "final_response": "I could not find information about this in the current HR policy documents. Please contact the HR team directly at hr@techcorp.com or call +91-98765-43210.",
            "sources": []
        }

    # Build context
    context = "\n\n".join([
        f"[Source: {c['source_file']}, Page {c['page']}]\n{c['content']}"
        for c in chunks
    ])

    messages = [
        SystemMessage(content="""You are a helpful HR Policy Assistant for TechCorp.
Answer the employee's question using ONLY the policy content provided below.
Be clear, professional, and concise.
Do not make up any information not present in the content.
If the content partially answers the question, answer what you can and say the rest should be confirmed with HR."""),
        HumanMessage(content=f"Question: {question}\n\nPolicy Content:\n{context}")
    ]

    response = llm.invoke(messages)

    # Deduplicate sources
    seen    = set()
    sources = []
    for c in chunks:
        key = (c["source_file"], c["page"])
        if key not in seen:
            seen.add(key)
            sources.append({"file": c["source_file"], "page": c["page"]})

    return {
        **state,
        "final_response": response.content.strip(),
        "sources":        sources
    }


# ── Router function for LangGraph ─────────────────────
def route_decision(state: AgentState) -> str:
    return state["route"]