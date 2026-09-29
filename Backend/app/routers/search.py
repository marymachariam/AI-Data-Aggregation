from fastapi import APIRouter
from pydantic import BaseModel

from app.services.vector_exporter import query_vector_store

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    n_results: int = 5


@router.post("")
def search(payload: SearchRequest):
    return query_vector_store(payload.query, payload.n_results)