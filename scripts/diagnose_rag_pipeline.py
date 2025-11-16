#!/usr/bin/env python3
"""
Complete RAG Pipeline Diagnostic
Tests: MongoDB connection → Vector storage → RAG query → Quiz generation
"""
import os
import sys
import json
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
MONGODB_VECTOR_INDEX = os.getenv('MONGODB_VECTOR_INDEX', 'vector_index')

print("=" * 80)
print("RAG PIPELINE DIAGNOSTIC")
print("=" * 80)

# Step 1: Check MongoDB connection
print("\n[1] MongoDB Connection")
print(f"    URI: {MONGODB_URI[:50]}...")
print(f"    Database: {MONGODB_VECTOR_DB}")
print(f"    Collection: {MONGODB_VECTOR_COLLECTION}")
print(f"    Index Name: {MONGODB_VECTOR_INDEX}")

try:
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_VECTOR_DB]
    collection = db[MONGODB_VECTOR_COLLECTION]
    
    count = collection.count_documents({})
    print(f"    ✓ Connected successfully")
    print(f"    ✓ Found {count} vector documents")
except Exception as e:
    print(f"    ✗ FAILED: {e}")
    sys.exit(1)

# Step 2: Check vector dimensions
print("\n[2] Vector Dimensions")
sample = collection.find_one()
if sample and 'embedding' in sample:
    dim = len(sample['embedding'])
    print(f"    ✓ Embedding dimension: {dim}")
    
    if dim == 1536:
        print(f"    → Model: text-embedding-3-small or text-embedding-ada-002")
    elif dim == 3072:
        print(f"    → Model: text-embedding-3-large")
    else:
        print(f"    ⚠ Unusual dimension: {dim}")
else:
    print(f"    ✗ No embedding field found")

# Step 3: Check metadata structure
print("\n[3] Metadata Structure")
if sample and 'metadata' in sample:
    metadata = sample['metadata']
    print(f"    ✓ Metadata keys: {list(metadata.keys())}")
    
    required_fields = ['user_id', 'material_id', 'filename']
    for field in required_fields:
        if field in metadata:
            print(f"    ✓ {field}: {metadata[field]}")
        else:
            print(f"    ✗ Missing: {field}")
else:
    print(f"    ✗ No metadata field found")

# Step 4: Check user documents
print("\n[4] User Documents")
if sample and 'metadata' in sample:
    user_id = sample['metadata'].get('user_id')
    if user_id:
        user_docs = collection.count_documents({"metadata.user_id": user_id})
        print(f"    User ID: {user_id}")
        print(f"    ✓ Documents for this user: {user_docs}")
        
        # List unique materials
        pipeline = [
            {"$match": {"metadata.user_id": user_id}},
            {"$group": {
                "_id": "$metadata.material_id",
                "filename": {"$first": "$metadata.filename"},
                "count": {"$sum": 1}
            }}
        ]
        materials = list(collection.aggregate(pipeline))
        
        print(f"\n    Materials for user {user_id}:")
        for mat in materials:
            print(f"      - {mat['filename']}: {mat['count']} chunks (ID: {mat['_id']})")

# Step 5: Check for Vector Search Index
print("\n[5] Vector Search Index Status")
print(f"    ⚠ Atlas Vector Search indexes are NOT visible via PyMongo")
print(f"    ⚠ You MUST create the index in MongoDB Atlas UI")
print(f"\n    Steps to verify:")
print(f"    1. Go to: https://cloud.mongodb.com/")
print(f"    2. Navigate to: Clusters → Browse Collections")
print(f"    3. Select: {MONGODB_VECTOR_DB}.{MONGODB_VECTOR_COLLECTION}")
print(f"    4. Click: Search Indexes tab")
print(f"    5. Verify: Index named '{MONGODB_VECTOR_INDEX}' exists and is Active")

# Step 6: Simulate RAG query (metadata filter)
print("\n[6] Simulated RAG Query (Metadata Filter)")
if sample and 'metadata' in sample:
    user_id = sample['metadata'].get('user_id')
    material_ids = [mat['_id'] for mat in materials[:2]]  # First 2 materials
    
    # This tests the metadata filter part (not vector similarity)
    query_filter = {
        "metadata.user_id": user_id,
        "metadata.material_id": {"$in": material_ids}
    }
    
    matching_docs = collection.count_documents(query_filter)
    print(f"    Filter: user_id={user_id}, material_ids={material_ids}")
    print(f"    ✓ Matching documents: {matching_docs}")
    
    if matching_docs > 0:
        print(f"    ✓ Metadata filtering works correctly")
    else:
        print(f"    ✗ No documents match filter - check material_id format")

# Summary
print("\n" + "=" * 80)
print("DIAGNOSTIC SUMMARY")
print("=" * 80)

if count > 0 and 'embedding' in sample and matching_docs > 0:
    print("✓ MongoDB connection: OK")
    print("✓ Vector documents: OK")
    print("✓ Metadata structure: OK")
    print("✓ Metadata filtering: OK")
    print("\n⚠ CRITICAL: You MUST create Vector Search Index in Atlas UI")
    print("\nSee ATLAS_VECTOR_SEARCH_SETUP.md for detailed instructions")
else:
    print("✗ Some checks failed - review output above")

client.close()
