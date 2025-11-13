"""
Agent 服务 - 主入口
提供 AI Agent 对话功能
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
from pathlib import Path

# 添加 shared 目录到 Python 路径
sys.path.append(str(Path(__file__).parent.parent))

from shared.config import settings

# 创建 FastAPI 应用
app = FastAPI(
    title="Agent Service",
    description="AI Agent 对话服务",
    version="1.0.0"
)

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
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    """Agent 对话响应"""
    message: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None


# ===== API 端点 =====

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "agent-service",
        "version": "1.0.0"
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Agent 对话接口
    - 理解用户意图
    - 调用合适的工具
    - 生成回复
    """
    try:
        # TODO: 实现 Agent 对话逻辑（Week 3）
        return ChatResponse(
            message="Agent chat endpoint ready. Your message: " + request.message,
            tool_calls=[],
            metadata={"conversation_id": request.conversation_id}
        )
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
