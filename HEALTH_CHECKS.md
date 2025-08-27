# Health Checks Documentation

Этот проект включает в себя полноценную систему health checks с HTTP endpoints, логированием и метриками.

## Запуск

### Вариант 1: Только health server
```bash
pnpm run health-server
```

### Вариант 2: Vite dev server + health server
```bash
pnpm run dev:health
```

## Доступные Endpoints

### 1. Liveness Probe
```bash
GET /healthz
```

**Описание**: Проверяет, что приложение живо и работает.

**Ответ**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "app": {
      "status": "healthy",
      "duration": 5
    },
    "memory": {
      "status": "healthy", 
      "duration": 2
    }
  }
}
```

**HTTP статусы**:
- `200` - приложение здорово
- `503` - приложение нездорово
- `500` - внутренняя ошибка

### 2. Readiness Probe
```bash
GET /readyz
```

**Описание**: Проверяет, что приложение готово принимать трафик (все зависимости работают).

**Ответ**: Аналогичен liveness probe, но проверяет readiness checks.

### 3. Metrics (Prometheus)
```bash
GET /metrics
```

**Описание**: Возвращает метрики в формате Prometheus.

**Ответ**:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/healthz",status="200"} 42

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_sum 12.5
http_request_duration_seconds_count 80
```

### 4. Status
```bash
GET /status
```

**Описание**: Информация о сервере и доступных endpoints.

## Тестирование

### Проверка health checks
```bash
# Liveness check
curl http://localhost:3001/healthz

# Readiness check  
curl http://localhost:3001/readyz

# Metrics
curl http://localhost:3001/metrics

# Через Vite proxy
curl http://localhost:5173/healthz
```

### Симуляция нездорового состояния
```bash
# Симулировать нездоровый liveness
curl -X POST http://localhost:3001/simulate-unhealthy \
  -H "Content-Type: application/json" \
  -d '{"type": "liveness"}'

# Симулировать нездоровый readiness
curl -X POST http://localhost:3001/simulate-unhealthy \
  -H "Content-Type: application/json" \
  -d '{"type": "readiness"}'
```

### Восстановление здорового состояния
```bash
curl -X POST http://localhost:3001/restore-healthy
```

## Зарегистрированные Health Checks

### Liveness Checks
- **app**: Базовая проверка приложения
- **memory**: Проверка использования памяти

### Readiness Checks  
- **database**: Проверка подключения к базе данных
- **redis**: Проверка подключения к Redis
- **external-api**: Проверка внешнего API

## Логирование

Все health checks логируются в JSON формате:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "shadcn-admin",
  "message": "Healthz check completed",
  "context": {
    "status": "healthy",
    "checkCount": 2
  },
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Kubernetes Integration

Для использования в Kubernetes добавьте в deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shadcn-admin
spec:
  template:
    spec:
      containers:
      - name: app
        image: shadcn-admin:latest
        ports:
        - containerPort: 5173
        livenessProbe:
          httpGet:
            path: /healthz
            port: 5173
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /readyz
            port: 5173
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Мониторинг

### Prometheus
Добавьте в `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'shadcn-admin'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: /metrics
```

### Grafana Dashboard
Создайте dashboard с метриками:
- `http_requests_total`
- `http_request_duration_seconds`
- `http_errors_total`

## Troubleshooting

### Health checks возвращают пустые checks
Убедитесь, что health checks зарегистрированы в `src/main.tsx`.

### Endpoint недоступен
1. Проверьте, что health server запущен: `pnpm run health-server`
2. Проверьте порт: `netstat -an | grep 3001`
3. Проверьте логи сервера

### Метрики пустые
Метрики накапливаются со временем. Попробуйте сделать несколько запросов к приложению.

## Конфигурация

### Переменные окружения
```bash
PORT=3001  # Порт health server
```

### Настройка таймаутов
В коде health checks можно настроить таймауты:

```typescript
health.registerReadiness('database', async () => {
  // Ваша проверка
}, 5000) // 5 секунд таймаут
```
