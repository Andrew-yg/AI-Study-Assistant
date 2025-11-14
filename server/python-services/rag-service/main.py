"""
RAG 服务 - 主入口
提供 PDF 处理和语义检索功能
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sys
from pathlib import Path

# 添加 shared 目录到 Python 路径
sys.path.append(str(Path(__file__).parent.parent))

from shared.config import settings
from .service import rag_pipeline

# 创建 FastAPI 应用
app = FastAPI(
    title="RAG Service",
    description="文档处理和语义检索服务",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== 数据模型 =====

class ProcessRequest(BaseModel):
    """PDF 处理请求"""
    material_id: str
    user_id: str


class QueryRequest(BaseModel):
    """RAG 查询请求"""
    question: str
    material_ids: Optional[List[str]] = None
    user_id: str
    top_k: int = 5


class QueryResponse(BaseModel):
    """RAG 查询响应"""
    answer: str
    sources: List[dict]
    confidence: float


# ===== API 端点 =====

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "rag-service",
        "version": "1.0.0"
    }


@app.post("/process")
async def process_document(
    file: UploadFile = File(...),
    material_id: str = Form(...),
    user_id: str = Form(...)
):
    """
    处理上传的 PDF 文件
    - 提取文本
    - 切分文档
    - 向量化
    - 存储到 MongoDB Vector Store
    """
    try:
        file_bytes = await file.read()
        result = await rag_pipeline.process_document(
            file_bytes=file_bytes,
            filename=file.filename or "document.pdf",
            material_id=material_id,
            user_id=user_id,
        )

        return {
            "status": "success",
            "material_id": material_id,
            "user_id": user_id,
            "filename": result.filename,
            "documents": result.document_count,
            "chunk_size": result.chunk_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """
    RAG 语义查询
    - 向量化问题
    - 检索相关文档
    - 生成答案
    """
    try:
        payload = await rag_pipeline.query(
            question=request.question,
            user_id=request.user_id,
            material_ids=request.material_ids,
            top_k=request.top_k,
        )

        return QueryResponse(**payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== 启动服务 =====

if __name__ == "__main__":
    import uvicorn
    
    # 验证配置
    settings.validate()
    
    # 启动服务
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,  # 开发模式自动重载
        log_level="info"
    )
