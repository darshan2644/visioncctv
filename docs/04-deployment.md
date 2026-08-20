# 🚀 Deployment Guide

## 🐳 Docker Deployment

### Prerequisites

- Docker 20.10+ installed
- Docker Compose 1.29+
- NVIDIA Container Toolkit (for GPU support)
- Minimum 8GB RAM (16GB recommended for GPU)
- 20GB free disk space

### Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/your-org/visioncctv.git
cd visioncctv
```

#### 2. Build Docker Image

```bash
docker-compose build
```

#### 3. Start Services

```bash
docker-compose up -d
```

#### 4. Verify Deployment

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Test API
curl http://localhost:8000/health
```

### Configuration

#### Environment Variables

Create a `.env` file:

```env
# Backend Configuration
PORT=8000
DEBUG=False
MAX_UPLOAD_SIZE=500MB

# AI Configuration  
SAMPLE_FPS=1.0
CONFIDENCE_THRESHOLD=0.65
SIMILARITY_THRESHOLD=0.70

# Storage
STORAGE_DIR=/app/backend/storage
```

#### GPU Acceleration

For NVIDIA GPU support, modify `docker-compose.yml`:

```yaml
services:
  visioncctv:
    # ... existing config ...
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### Volume Management

```bash
# View storage volumes
docker volume ls

# Inspect volume
docker volume inspect visioncctv_storage

# Backup volume data
docker run --rm -v visioncctv_storage:/volume -v $(pwd):/backup alpine tar cvf /backup/visioncctv_backup.tar /volume

# Restore from backup
docker run --rm -v visioncctv_storage:/volume -v $(pwd):/backup alpine sh -c "rm -rf /volume/* /volume/..?* && tar xvf /backup/visioncctv_backup.tar -C /"
```

## 🌐 Production Deployment

### Reverse Proxy Configuration (Nginx)

```nginx
server {
    listen 80;
    server_name visioncctv.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Large file uploads
        client_max_body_size 500M;
    }
    
    # Static files caching
    location /storage/ {
        proxy_pass http://localhost:8000;
        proxy_cache valid 200 1h;
        expires 1h;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

### SSL Configuration

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d visioncctv.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Load Balancing

```nginx
upstream visioncctv_backend {
    server 192.168.1.10:8000;
    server 192.168.1.11:8000;
    server 192.168.1.12:8000;
    
    # Health checks
    check interval=5000 rise=2 fall=3 timeout=1000;
}

server {
    listen 443 ssl;
    server_name visioncctv.yourdomain.com;
    
    location / {
        proxy_pass http://visioncctv_backend;
        # ... other proxy settings ...
    }
}
```

## 📦 Kubernetes Deployment

### Helm Chart Structure

```
visioncctv/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── pvc.yaml
│   └── hpa.yaml
└── charts/
```

### Sample Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: visioncctv
spec:
  replicas: 2
  selector:
    matchLabels:
      app: visioncctv
  template:
    metadata:
      labels:
        app: visioncctv
    spec:
      containers:
      - name: visioncctv
        image: your-registry/visioncctv:latest
        ports:
        - containerPort: 8000
        env:
        - name: PORT
          value: "8000"
        - name: DEBUG
          value: "False"
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
            nvidia.com/gpu: 1
          requests:
            cpu: "1"
            memory: "2Gi"
        volumeMounts:
        - name: storage
          mountPath: /app/backend/storage
      volumes:
      - name: storage
        persistentVolumeClaim:
          claimName: visioncctv-storage
```

### Persistent Volume Claim

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: visioncctv-storage
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 50Gi
  storageClassName: "fast"
```

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: visioncctv-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: visioncctv
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 🔧 Configuration Management

### Environment-Specific Configurations

```yaml
# values-dev.yaml
env:
  DEBUG: "True"
  SAMPLE_FPS: "0.5"
replicaCount: 1
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"

# values-prod.yaml  
env:
  DEBUG: "False"
  SAMPLE_FPS: "1.0"
replicaCount: 3
resources:
  requests:
    cpu: "2"
    memory: "4Gi"
```

### Secrets Management

```bash
# Create Kubernetes secret
kubectl create secret generic visioncctv-secrets \
  --from-literal=JWT_SECRET=your-secret-key \
  --from-literal=DB_PASSWORD=your-db-password

# Use in deployment
env:
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: visioncctv-secrets
      key: JWT_SECRET
```

## 📈 Monitoring & Logging

### Prometheus Monitoring

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'visioncctv'
    scrape_interval: 15s
    static_configs:
      - targets: ['visioncctv:8000']
```

### Grafana Dashboard

Key metrics to monitor:
- Request rate and latency
- AI processing time
- GPU utilization
- Memory and CPU usage
- Error rates
- Queue lengths

### Centralized Logging

```yaml
# fluentd-config.yaml
<source>
  @type tail
  path /var/log/visioncctv/*.log
  pos_file /var/log/visioncctv.log.pos
  tag visioncctv
  format json
</source>

<match visioncctv>
  @type elasticsearch
  host elasticsearch
  port 9200
  logstash_format true
</match>
```

## 🔒 Security Hardening

### Container Security

```dockerfile
# Use minimal base image
FROM python:3.11-slim

# Run as non-root user
RUN useradd -m visioncctv
USER visioncctv
WORKDIR /home/visioncctv/app

# Install only necessary packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Read-only filesystem
VOLUME ["/app/backend/storage"]
```

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: visioncctv-network-policy
spec:
  podSelector:
    matchLabels:
      app: visioncctv
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - ipBlock:
        cidr: 10.0.0.0/16
    ports:
    - protocol: TCP
      port: 8000
  egress:
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
    ports:
    - protocol: TCP
      port: 53  # DNS
    - protocol: TCP
      port: 443  # HTTPS
```

### Pod Security Policies

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: visioncctv-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'secret'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  supplementalGroups:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  fsGroup:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: VisionCCTV CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r backend/requirements.txt
    
    - name: Run backend tests
      run: |
        cd backend
        python -m pytest
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '20'
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm install
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm run lint
        npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v1
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v2
      with:
        context: .
        push: true
        tags: your-org/visioncctv:latest,your-org/visioncctv:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Install kubectl
      uses: azure/setup-kubectl@v1
    
    - name: Configure kubeconfig
      run: |
        mkdir -p ~/.kube
        echo "${{ secrets.KUBE_CONFIG }}" > ~/.kube/config
    
    - name: Deploy to Kubernetes
      run: |
        kubectl apply -f kubernetes/
        kubectl rollout status deployment/visioncctv --timeout=60s
```

## 📊 Performance Optimization

### Database Optimization

```python
# Use connection pooling
from sqlalchemy.pool import QueuePool

engine = create_engine(
    'postgresql://user:password@db:5432/visioncctv',
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30
)
```

### Caching Strategies

```python
# Redis caching for reference embeddings
import redis

cache = redis.Redis(host='redis', port=6379, db=0)

def get_cached_embedding(reference_id):
    cached = cache.get(f"embedding:{reference_id}")
    if cached:
        return pickle.loads(cached)
    
    # Compute embedding
    embedding = compute_embedding(reference_id)
    
    # Cache for 1 hour
    cache.setex(f"embedding:{reference_id}", 3600, pickle.dumps(embedding))
    
    return embedding
```

### Batch Processing

```python
# Process videos in parallel
from concurrent.futures import ThreadPoolExecutor

def process_videos(video_ids):
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(process_video, vid) for vid in video_ids]
        results = [future.result() for future in futures]
    
    return results
```

## 🆘 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Container fails to start** | Check logs: `docker-compose logs` |
| **GPU not detected** | Install NVIDIA Container Toolkit |
| **Out of memory** | Increase Docker memory limit or reduce batch size |
| **Slow processing** | Check GPU utilization, adjust sample FPS |
| **File upload failures** | Check storage permissions and disk space |
| **CORS errors** | Configure allowed origins in FastAPI middleware |

### Debugging Commands

```bash
# Check container resources
docker stats visioncctv

# Enter container shell
docker exec -it visioncctv sh

# Test GPU availability
nvidia-smi

# Check Python dependencies
pip list

# Test AI models
python -c "import torch; print(torch.cuda.is_available())"
```

### Performance Tuning

```bash
# Monitor system resources
top
htop
nvidia-smi -l 1

# Profile Python application
python -m cProfile -o profile.out backend/main.py
snakeviz profile.out

# Analyze memory usage
python -m memory_profiler backend/main.py
```

## 🔄 Upgrade Guide

### Version Compatibility

| Version | Python | FastAPI | Next.js | Notes |
|---------|--------|---------|---------|-------|
| 1.0.x | 3.10+ | 0.104+ | 14.x | Initial release |
| 1.1.x | 3.11+ | 0.109+ | 14.x | Performance improvements |

### Upgrade Steps

```bash
# Pull latest code
git pull origin main

# Update dependencies
pip install --upgrade -r backend/requirements.txt
cd frontend && npm update

# Rebuild Docker image
docker-compose build --no-cache

# Restart services
docker-compose down && docker-compose up -d

# Run database migrations (if any)
# python backend/manage.py migrate
```

### Rollback Procedure

```bash
# Rollback to previous version
git checkout v1.0.0

# Rebuild with specific tag
docker-compose build --no-cache

# Restart
docker-compose down && docker-compose up -d

# Restore from backup
docker run --rm -v visioncctv_storage:/volume -v $(pwd)/backups:/backup \
  alpine sh -c "rm -rf /volume/* && tar xvf /backup/visioncctv_backup.tar -C /"
```

## 📚 Maintenance

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups/visioncctv

# Backup storage volume
docker run --rm -v visioncctv_storage:/volume -v $BACKUP_DIR:/backup \
  alpine tar cvf /backup/visioncctv_storage_$TIMESTAMP.tar /volume

# Backup database (if used)
# pg_dump -U visioncctv -d visioncctv > $BACKUP_DIR/visioncctv_db_$TIMESTAMP.sql

# Clean up old backups (keep 7 days)
find $BACKUP_DIR -name "*.tar" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

### Monitoring Script

```bash
#!/bin/bash
# Health check script
HEALTH_CHECK=$(curl -s http://localhost:8000/health)

if [[ $HEALTH_CHECK == *"status":"ok"* ]]; then
    echo "✅ VisionCCTV is healthy"
    exit 0
else
    echo "❌ VisionCCTV health check failed"
    # Restart container
    docker-compose restart visioncctv
    exit 1
fi
```

### Log Rotation

```bash
# Log rotation configuration
cat > /etc/logrotate.d/visioncctv << EOF
/var/log/visioncctv/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose restart visioncctv
    endscript
}
EOF
```

## 🎯 Best Practices

### Security

1. **Regular Updates**: Keep dependencies updated
2. **Secret Management**: Use Kubernetes secrets or vault
3. **Network Isolation**: Restrict container networking
4. **Audit Logging**: Enable comprehensive logging
5. **Regular Backups**: Automated backup schedule

### Performance

1. **Resource Limits**: Set appropriate CPU/memory limits
2. **Load Testing**: Test with realistic workloads
3. **Monitoring**: Implement comprehensive monitoring
4. **Caching**: Cache frequent queries and embeddings
5. **Batch Processing**: Optimize batch sizes

### Scalability

1. **Horizontal Scaling**: Add more replicas under load
2. **Auto-scaling**: Configure HPA for Kubernetes
3. **Stateless Design**: Ensure stateless backend
4. **Shared Storage**: Use network-attached storage
5. **Load Balancing**: Distribute traffic evenly

This deployment guide provides comprehensive instructions for deploying VisionCCTV in various environments, from local development to production Kubernetes clusters. The modular approach ensures flexibility while maintaining security and performance.