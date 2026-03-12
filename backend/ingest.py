import os
import shutil
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

load_dotenv()

# ── Config ────────────────────────────────────────────
POLICIES_DIR = "data/policies"
CHROMA_DIR   = "data/chroma_db"

# ── Clear existing ChromaDB ───────────────────────────
if os.path.exists(CHROMA_DIR):
    shutil.rmtree(CHROMA_DIR)
    print("Cleared existing ChromaDB...")

# ── Load HuggingFace Embeddings ───────────────────────
print("Loading embedding model... (first time takes 1-2 minutes)")
embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"}
)
print("Embedding model loaded.")

# ── Load all PDFs ─────────────────────────────────────
all_chunks = []
pdf_files = [f for f in os.listdir(POLICIES_DIR) if f.endswith(".pdf")]

if not pdf_files:
    print("No PDF files found in data/policies/")
    exit()

for pdf_file in pdf_files:
    pdf_path = os.path.join(POLICIES_DIR, pdf_file)
    print(f"Loading {pdf_file}...")

    loader = PyPDFLoader(pdf_path)
    pages  = loader.load()

    # Split into chunks — 500 chars each, 50 overlap
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", ".", " "]
    )
    chunks = splitter.split_documents(pages)

    # Add source filename to each chunk metadata
    for chunk in chunks:
        chunk.metadata["source_file"] = pdf_file
        chunk.metadata["page"]        = chunk.metadata.get("page", 0) + 1

    all_chunks.extend(chunks)
    print(f"  → {len(chunks)} chunks created from {pdf_file}")

print(f"\nTotal chunks: {len(all_chunks)}")

# ── Store in ChromaDB ─────────────────────────────────
print("Storing chunks in ChromaDB...")
vectorstore = Chroma.from_documents(
    documents=all_chunks,
    embedding=embeddings,
    persist_directory=CHROMA_DIR,
    collection_name="hr_policies"
)

print(f"\n✅ Done! {len(all_chunks)} chunks stored in ChromaDB.")
print(f"ChromaDB saved at: {CHROMA_DIR}")