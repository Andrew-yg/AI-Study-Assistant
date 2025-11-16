#!/usr/bin/env python3
"""
Test script to verify MongoDB Atlas Vector Search setup
"""
import os
import sys
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
project_root = Path(__file__).parent
env_path = project_root / '.env'
load_dotenv(env_path)

MONGODB_URI = os.getenv('MONGODB_URI')
MONGODB_VECTOR_DB = os.getenv('MONGODB_VECTOR_DB', 'AIAssistant')
MONGODB_VECTOR_COLLECTION = os.getenv('MONGODB_VECTOR_COLLECTION', 'rag_vectors')

print(f"MongoDB URI: {MONGODB_URI[:50]}...")
print(f"Database: {MONGODB_VECTOR_DB}")
print(f"Collection: {MONGODB_VECTOR_COLLECTION}")
print()

try:
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_VECTOR_DB]
    collection = db[MONGODB_VECTOR_COLLECTION]
    
    # Check collection stats
    count = collection.count_documents({})
    print(f"✓ Connected to MongoDB")
    print(f"✓ Collection '{MONGODB_VECTOR_COLLECTION}' has {count} documents")
    
    if count > 0:
        # Sample document
        sample = collection.find_one()
        print(f"\nSample document keys: {list(sample.keys())}")
        
        if 'metadata' in sample:
            print(f"Sample metadata: {sample['metadata']}")
        
        # Check for embedding field
        if 'embedding' in sample:
            print(f"✓ Embedding field exists (dimension: {len(sample['embedding'])})")
        else:
            print("✗ WARNING: No 'embedding' field found!")
    
    # List indexes
    print(f"\nIndexes on collection:")
    for index in collection.list_indexes():
        print(f"  - {index['name']}: {index.get('key', {})}")
    
    # Check for vector search index (Atlas Search indexes are not listed via list_indexes)
    print(f"\nNote: Atlas Vector Search indexes must be created in MongoDB Atlas UI")
    print(f"Go to: Database → Browse Collections → {MONGODB_VECTOR_DB}.{MONGODB_VECTOR_COLLECTION} → Search Indexes")
    
    client.close()
    
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
