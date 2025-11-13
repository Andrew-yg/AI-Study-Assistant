"""
Quiz 服务 - 主入口
提供题目生成和答案评估功能
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
    title="Quiz Service",
    description="题目生成和评估服务",
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

class GenerateQuizRequest(BaseModel):
    """生成题目请求"""
    material_id: str
    user_id: str
    question_type: str  # 'multiple_choice', 'true_false', 'short_answer'
    difficulty: str  # 'easy', 'medium', 'hard'
    count: int = 5


class Question(BaseModel):
    """题目"""
    type: str
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    difficulty: str


class GenerateQuizResponse(BaseModel):
    """生成题目响应"""
    questions: List[Question]


class EvaluateAnswerRequest(BaseModel):
    """评估答案请求"""
    question_id: str
    user_answer: str
    correct_answer: str
    question_type: str


class EvaluateAnswerResponse(BaseModel):
    """评估答案响应"""
    is_correct: bool
    score: float
    feedback: str


# ===== API 端点 =====

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "quiz-service",
        "version": "1.0.0"
    }


@app.post("/generate", response_model=GenerateQuizResponse)
async def generate_quiz(request: GenerateQuizRequest):
    """
    生成练习题
    - 基于学习材料
    - 指定题型和难度
    - 返回题目列表
    """
    try:
        # TODO: 实现题目生成逻辑（Week 4）
        return GenerateQuizResponse(
            questions=[
                Question(
                    type=request.question_type,
                    question="Quiz generation endpoint ready",
                    options=["Option A", "Option B", "Option C", "Option D"] if request.question_type == "multiple_choice" else None,
                    correct_answer="Option A",
                    explanation="This is a placeholder question",
                    difficulty=request.difficulty
                )
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate", response_model=EvaluateAnswerResponse)
async def evaluate_answer(request: EvaluateAnswerRequest):
    """
    评估用户答案
    - 检查正确性
    - 计算得分
    - 提供反馈
    """
    try:
        # TODO: 实现答案评估逻辑（Week 4）
        return EvaluateAnswerResponse(
            is_correct=True,
            score=1.0,
            feedback="Answer evaluation endpoint ready"
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
        port=8003,
        reload=True,
        log_level="info"
    )
