"""
MongoDB 连接管理
提供同步和异步连接
"""
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from .config import settings


class MongoDBClient:
    """MongoDB 客户端管理器"""
    
    _sync_client: Optional[MongoClient] = None
    _async_client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    def get_sync_client(cls) -> MongoClient:
        """获取同步 MongoDB 客户端"""
        if cls._sync_client is None:
            cls._sync_client = MongoClient(settings.MONGODB_URI)
        return cls._sync_client
    
    @classmethod
    def get_async_client(cls) -> AsyncIOMotorClient:
        """获取异步 MongoDB 客户端"""
        if cls._async_client is None:
            cls._async_client = AsyncIOMotorClient(settings.MONGODB_URI)
        return cls._async_client
    
    @classmethod
    def get_database(cls, db_name: str = "AIAssistant", async_mode: bool = False):
        """
        获取数据库实例
        
        Args:
            db_name: 数据库名称
            async_mode: 是否使用异步客户端
        """
        if async_mode:
            client = cls.get_async_client()
        else:
            client = cls.get_sync_client()
        
        return client[db_name]
    
    @classmethod
    def close_connections(cls):
        """关闭所有连接"""
        if cls._sync_client:
            cls._sync_client.close()
            cls._sync_client = None
        
        if cls._async_client:
            cls._async_client.close()
            cls._async_client = None


# 便捷函数
def get_db(async_mode: bool = False):
    """获取数据库实例的便捷函数"""
    return MongoDBClient.get_database(async_mode=async_mode)
