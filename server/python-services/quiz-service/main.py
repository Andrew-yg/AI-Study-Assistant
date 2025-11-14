"""
Quiz 服务 - 主入口
提供题目生成和答案评估功能
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
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
from generator import QuizGenerator

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
    material_ids: List[str] = Field(min_items=1)
    user_id: str
    question_type: str  # 'multiple_choice', 'true_false', 'short_answer'
    difficulty: str  # 'easy', 'medium', 'hard'
    count: int = Field(default=5, ge=1, le=10)


class Question(BaseModel):
    """题目"""
    question: str
    question_type: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    difficulty: str
    tags: Optional[List[str]] = None
    source_summary: Optional[str] = None


class GenerateQuizResponse(BaseModel):
    """生成题目响应"""
    questions: List[Question]
    material_summary: Optional[str] = None


class EvaluateAnswerRequest(BaseModel):
    """评估答案请求"""
    question: str
    question_type: str
    user_answer: str
    correct_answer: str
    explanation: Optional[str] = None
    material_summary: Optional[str] = None


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


generator = QuizGenerator()


@app.post("/generate", response_model=GenerateQuizResponse)
async def generate_quiz(request: GenerateQuizRequest):
    """
    生成练习题
    - 基于学习材料
    - 指定题型和难度
    - 返回题目列表
    """
    try:
        result = await generator.generate_questions(
            material_ids=request.material_ids,
            user_id=request.user_id,
            question_type=request.question_type,
            difficulty=request.difficulty,
            count=request.count,
        )
        questions = [Question(**item) for item in result.get("questions", [])]
        return GenerateQuizResponse(
            questions=questions,
            material_summary=result.get("material_summary"),
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
        result = await generator.evaluate_answer(
            question=request.question,
            correct_answer=request.correct_answer,
            user_answer=request.user_answer,
            question_type=request.question_type,
            explanation=request.explanation,
            context_summary=request.material_summary,
        )
        return EvaluateAnswerResponse(**result)
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
