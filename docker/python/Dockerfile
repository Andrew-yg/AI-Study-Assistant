# syntax=docker/dockerfile:1.7
ARG PYTHON_VERSION=3.10-slim

FROM python:${PYTHON_VERSION}

ARG SERVICE=rag-service
ARG PORT=8001
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    SERVICE=${SERVICE} \
    PORT=${PORT}

WORKDIR /app

COPY server/python-services/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared utils + specific service
COPY server/python-services/shared ./shared
COPY server/python-services/${SERVICE} ./service

WORKDIR /app/service

EXPOSE ${PORT}
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
