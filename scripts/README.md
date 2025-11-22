# 🔧 Scripts

This folder contains utility scripts for development, testing, and service management.

## 📜 Available Scripts

### Service Management

- **[manage-services.sh](./manage-services.sh)** - Manage startup, shutdown, and restart of all Python microservices
  ```bash
  # Start all services
  ./scripts/manage-services.sh start
  
  # Stop all services
  ./scripts/manage-services.sh stop
  
  # Restart all services
  ./scripts/manage-services.sh restart
  ```

### Development & Testing

- **[diagnose_rag_pipeline.py](./diagnose_rag_pipeline.py)** - RAG pipeline diagnostic tool
  ```bash
  python scripts/diagnose_rag_pipeline.py
  ```

- **[test_vector_search.py](./test_vector_search.py)** - MongoDB Vector Search test script
  ```bash
  python scripts/test_vector_search.py
  ```

## 💡 Usage Tips

1. Make scripts executable before running:
   ```bash
   chmod +x scripts/*.sh
   ```

2. Run Python scripts from project root:
   ```bash
   python scripts/script-name.py
   ```

3. Check script requirements in the main project's `requirements.txt`

## 📂 Navigation

- [← Back to Main README](../README.md)
- [Documentation](../docs/README.md)
