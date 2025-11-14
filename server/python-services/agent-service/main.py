"""
Agent 服务 - 主入口
提供 AI Agent 对话功能
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import sys
from pathlib import Path

# 添加当前服务目录和 shared 目录到 Python 路径，确保可作为脚本运行
service_dir = Path(__file__).resolve().parent
python_services_dir = service_dir.parent

for extra_path in (service_dir, python_services_dir):
    path_str = str(extra_path)
    if path_str not in sys.path:
        sys.path.append(path_str)

from shared.config import settings
from service import create_orchestrator

# 创建 FastAPI 应用
app = FastAPI(
    title="Agent Service",
    description="AI Agent 对话服务",
    version="1.0.0"
)

orchestrator = create_orchestrator()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== 数据模型 =====

class ChatMessage(BaseModel):
    """对话消息"""
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    """Agent 对话请求"""
    message: str
    conversation_id: str
    user_id: str
    history: Optional[List[ChatMessage]] = None
    material_ids: Optional[List[str]] = None


# ===== API 端点 =====

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "agent-service",
        "version": "1.0.0"
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Agent 对话接口
    - 理解用户意图
    - 调用合适的工具
    - 生成回复
    """
    try:
        history = [{"role": item.role, "content": item.content} for item in (request.history or [])]
        stream = orchestrator.stream_chat(
            message=request.message,
            user_id=request.user_id,
            history=history,
            material_ids=request.material_ids,
        )

        return StreamingResponse(stream, media_type="text/event-stream")
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
        port=8002,
        reload=True,
        log_level="info"
    )
