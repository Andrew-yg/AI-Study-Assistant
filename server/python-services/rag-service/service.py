"""RAG 核心逻辑实现"""
from __future__ import annotations

import asyncio
import os
import tempfile
from dataclasses import dataclass
from typing import Dict, List, Optional

from llama_index.core import Settings, StorageContext, VectorStoreIndex
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.readers import SimpleDirectoryReader
from llama_index.core.vector_stores import MetadataFilter, MetadataFilters
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.vector_stores.mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient

from shared.config import settings


@dataclass
class ProcessResult:
    document_count: int
    chunk_count: int
    filename: str


class RAGPipeline:
    """封装 LlamaIndex + MongoDB RAG 处理逻辑"""

    def __init__(self) -> None:
        self._init_models()
        self._init_vector_store()

    def _init_models(self) -> None:
        """初始化 Embedding / LLM / 切分器"""
        Settings.embed_model = OpenAIEmbedding(model=settings.OPENAI_EMBEDDING_MODEL)
        Settings.llm = OpenAI(model=settings.OPENAI_COMPLETION_MODEL, temperature=0)
        Settings.node_parser = SentenceSplitter(chunk_size=1024, chunk_overlap=200)

    def _init_vector_store(self) -> None:
        client = MongoClient(settings.MONGODB_URI)
        self._vector_store = MongoDBAtlasVectorSearch(
            mongo_client=client,
            db_name=settings.MONGODB_VECTOR_DB,
            collection_name=settings.MONGODB_VECTOR_COLLECTION,
            index_name=settings.MONGODB_VECTOR_INDEX,
            text_key="text",
            embedding_key="embedding",
        )

    async def process_document(self, *, file_bytes: bytes, filename: str, material_id: str, user_id: str) -> ProcessResult:
        """读取 PDF，切分并写入向量库"""
        if not file_bytes:
            raise ValueError("Empty file content")

        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1] or ".pdf") as tmp_file:
            tmp_file.write(file_bytes)
            tmp_file_path = tmp_file.name

        try:
            documents = SimpleDirectoryReader(input_files=[tmp_file_path]).load_data()
        finally:
            try:
                os.remove(tmp_file_path)
            except OSError:
                pass

        if not documents:
            raise ValueError("No text extracted from PDF")

        for doc in documents:
            doc.metadata.update({
                "material_id": material_id,
                "user_id": user_id,
                "filename": filename,
            })

        storage_context = StorageContext.from_defaults(vector_store=self._vector_store)
        VectorStoreIndex.from_documents(documents, storage_context=storage_context)

        chunk_count = sum(len(doc.text) for doc in documents)
        return ProcessResult(
            document_count=len(documents),
            chunk_count=chunk_count,
            filename=filename,
        )

    async def query(self, *, question: str, user_id: str, material_ids: Optional[List[str]] = None, top_k: int = 5):
        if not question:
            raise ValueError("Question cannot be empty")

        filters_list = [MetadataFilter(key="user_id", value=user_id)]
        if material_ids:
            filters_list.append(MetadataFilter(key="material_id", value=material_ids, operator="in"))

        metadata_filters = MetadataFilters(filters=filters_list)

        storage_context = StorageContext.from_defaults(vector_store=self._vector_store)
        index = VectorStoreIndex.from_vector_store(storage_context=storage_context)
        query_engine = index.as_query_engine(
            similarity_top_k=top_k,
            filters=metadata_filters,
        )

        response = await asyncio.to_thread(query_engine.query, question)

        sources: List[Dict[str, str]] = []
        for node in response.source_nodes:
            sources.append({
                "snippet": node.get_content(strip_newlines=False),
                "score": node.score,
                "metadata": node.metadata,
            })

        return {
            "answer": str(response),
            "sources": sources,
            "confidence": float(response.score or 0.0),
        }


rag_pipeline = RAGPipeline()
