"""
共享配置文件 - 加载环境变量
所有 Python 服务共用此配置
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载项目根目录的 .env 文件
project_root = Path(__file__).parent.parent.parent.parent
env_path = project_root / '.env'
load_dotenv(env_path)


class Settings:
    """应用配置"""
    
    # MongoDB
    MONGODB_URI: str = os.getenv('MONGODB_URI', '')
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv('OPENAI_API_KEY', '')
    OPENAI_EMBEDDING_MODEL: str = os.getenv('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-large')
    OPENAI_COMPLETION_MODEL: str = os.getenv('OPENAI_COMPLETION_MODEL', 'gpt-4o-mini')
    
    # Brave Search
    BRAVE_SEARCH_API_KEY: str = os.getenv('BRAVE_SEARCH_API_KEY', '')
    
    # Python 服务 URL（用于服务间调用）
    RAG_SERVICE_URL: str = os.getenv('RAG_SERVICE_URL', 'http://localhost:8001')
    AGENT_SERVICE_URL: str = os.getenv('AGENT_SERVICE_URL', 'http://localhost:8002')
    QUIZ_SERVICE_URL: str = os.getenv('QUIZ_SERVICE_URL', 'http://localhost:8003')
    
    # Cloudflare R2（如果 Python 服务需要直接访问）
    R2_ACCOUNT_ID: str = os.getenv('R2_ACCOUNT_ID', '')
    R2_ACCESS_KEY_ID: str = os.getenv('R2_ACCESS_KEY_ID', '')
    R2_SECRET_ACCESS_KEY: str = os.getenv('R2_SECRET_ACCESS_KEY', '')
    R2_BUCKET_NAME: str = os.getenv('R2_BUCKET_NAME', '')
    R2_PUBLIC_BASE_URL: str = os.getenv('R2_PUBLIC_BASE_URL', '')

    # MongoDB 向量存储配置
    MONGODB_VECTOR_DB: str = os.getenv('MONGODB_VECTOR_DB', 'AIAssistant')
    MONGODB_VECTOR_COLLECTION: str = os.getenv('MONGODB_VECTOR_COLLECTION', 'rag_vectors')
    MONGODB_VECTOR_INDEX: str = os.getenv('MONGODB_VECTOR_INDEX', 'vector_index')
    
    @classmethod
    def validate(cls):
        """验证必要的环境变量是否已设置"""
        errors = []
        
        if not cls.MONGODB_URI:
            errors.append('MONGODB_URI is not set')
        if not cls.OPENAI_API_KEY:
            errors.append('OPENAI_API_KEY is not set')
        
        if errors:
            raise ValueError(f"Missing required environment variables: {', '.join(errors)}")
        
        return True


# 创建全局配置实例
settings = Settings()
