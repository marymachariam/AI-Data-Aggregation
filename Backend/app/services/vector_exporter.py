import chromadb

_client = None


def get_chroma_client(persist_path: str = "./chroma_data"):
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=persist_path)
    return _client


def export_chunks_to_vector_store(chunks, owner_id: str, collection_name: str = "aggre8_chunks"):
    if not chunks:
        return

    collection = get_chroma_client().get_or_create_collection(name=collection_name)
    collection.upsert(
        ids=[c.id for c in chunks],
        documents=[c.chunk_text for c in chunks],
        metadatas=[
            {"file_id": c.file_id, "chunk_order": c.chunk_order, "owner_id": owner_id}
            for c in chunks
        ],
    )


def query_vector_store(query_text: str, n_results: int = 5, *, owner_id: str, collection_name: str = "aggre8_chunks"):
    collection = get_chroma_client().get_or_create_collection(name=collection_name)
    return collection.query(
        query_texts=[query_text],
        n_results=n_results,
        where={"owner_id": owner_id},
    )
    
def delete_chunks_for_files(file_ids: list[str], collection_name: str = "aggre8_chunks"):
    if not file_ids:
        return
    collection = get_chroma_client().get_or_create_collection(name=collection_name)
    collection.delete(where={"file_id": {"$in": file_ids}})