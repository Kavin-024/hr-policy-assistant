from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.nodes import router_node, rag_node, grader_node, writer_node, route_decision

def build_graph():
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("router",  router_node)
    graph.add_node("rag",     rag_node)
    graph.add_node("grader",  grader_node)
    graph.add_node("writer",  writer_node)

    # Entry point
    graph.set_entry_point("router")

    # Conditional routing after router
    graph.add_conditional_edges(
        "router",
        route_decision,
        {
            "direct": END,
            "policy": "rag"
        }
    )

    # Sequential after rag
    graph.add_edge("rag",    "grader")
    graph.add_edge("grader", "writer")
    graph.add_edge("writer", END)

    return graph.compile()

# Compile once at import time
hr_graph = build_graph()