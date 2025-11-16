#!/bin/bash
# Python 服务管理脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_DIR="$SCRIPT_DIR/server/python-services"
VENV_PYTHON="$PYTHON_DIR/venv/bin/python"

case "$1" in
  start)
    echo "🚀 启动所有 Python 服务..."
    cd "$PYTHON_DIR"
    nohup $VENV_PYTHON rag-service/main.py > rag.log 2>&1 &
    echo "✅ RAG Service 启动: http://localhost:8001"
    
    nohup $VENV_PYTHON agent-service/main.py > agent.log 2>&1 &
    echo "✅ Agent Service 启动: http://localhost:8002"
    
    nohup $VENV_PYTHON quiz-service/main.py > quiz.log 2>&1 &
    echo "✅ Quiz Service 启动: http://localhost:8003"
    
    sleep 2
    echo ""
    echo "📚 查看 API 文档："
    echo "  - RAG:   http://localhost:8001/docs"
    echo "  - Agent: http://localhost:8002/docs"
    echo "  - Quiz:  http://localhost:8003/docs"
    ;;
    
  stop)
    echo "🛑 停止所有 Python 服务..."
    pkill -f "python.*main.py"
    echo "✅ 所有服务已停止"
    ;;
    
  status)
    echo "📊 Python 服务状态："
    echo ""
    ps aux | grep "python.*main.py" | grep -v grep || echo "❌ 没有运行的服务"
    echo ""
    echo "🔍 健康检查："
    curl -s http://localhost:8001/health && echo "" || echo "❌ RAG Service 未响应"
    curl -s http://localhost:8002/health && echo "" || echo "❌ Agent Service 未响应"
    curl -s http://localhost:8003/health && echo "" || echo "❌ Quiz Service 未响应"
    ;;
    
  restart)
    echo "🔄 重启所有服务..."
    $0 stop
    sleep 2
    $0 start
    ;;
    
  logs)
    echo "📄 查看服务日志..."
    case "$2" in
      rag)
        tail -f "$PYTHON_DIR/rag.log"
        ;;
      agent)
        tail -f "$PYTHON_DIR/agent.log"
        ;;
      quiz)
        tail -f "$PYTHON_DIR/quiz.log"
        ;;
      *)
        echo "使用方法: $0 logs [rag|agent|quiz]"
        ;;
    esac
    ;;
    
  *)
    echo "Python 服务管理脚本"
    echo ""
    echo "使用方法: $0 {start|stop|status|restart|logs}"
    echo ""
    echo "命令："
    echo "  start   - 启动所有 Python 服务"
    echo "  stop    - 停止所有 Python 服务"
    echo "  status  - 查看服务状态"
    echo "  restart - 重启所有服务"
    echo "  logs    - 查看日志 (需指定: rag|agent|quiz)"
    echo ""
    echo "示例："
    echo "  $0 start"
    echo "  $0 status"
    echo "  $0 logs rag"
    exit 1
    ;;
esac
