FROM python:3.11-slim

# Install system dependencies for Ghostscript and C++ compilation (for some python libs)
RUN apt-get update && apt-get install -y \
    ghostscript \
    docker.io \
    build-essential \
    cmake \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip and install build tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install ML stack in a single layer to reduce image bloat
COPY requirements.txt .
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir \
    transformers[torch] \
    sentencepiece \
    sacremoses \
    huggingface_hub \
    hf_transfer \
    sentence-transformers \
    -r requirements.txt

# Pre-download ML models to the cache directory
ENV HF_HUB_ENABLE_HF_TRANSFER=1

RUN python3 -c "from huggingface_hub import snapshot_download; c = '/app/model_cache'; \
    print('Downloading Summarization (sshleifer/distilbart-cnn-6-6)...'); \
    snapshot_download('sshleifer/distilbart-cnn-6-6', cache_dir=c);" \
    && echo "Summarization model downloaded."

RUN python3 -c "from huggingface_hub import snapshot_download; c = '/app/model_cache'; \
    print('Downloading QA (distilbert-base-uncased-distilled-squad)...'); \
    snapshot_download('distilbert-base-uncased-distilled-squad', cache_dir=c);" \
    && echo "QA model downloaded."

RUN python3 -c "from sentence_transformers import SentenceTransformer; c = '/app/model_cache'; \
    print('Downloading Sentence-Transformer for ATS Scoring...'); \
    SentenceTransformer('all-MiniLM-L6-v2', cache_folder=c);" \
    && echo "Sentence-Transformer model downloaded."

RUN echo "All models pre-downloaded successfully."

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]