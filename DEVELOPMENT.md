# Разработка Autoscan

## Требования

- Node.js (для Next.js frontend)
- Python 3.11+ и виртуальное окружение (для backend auto_ai_auth)

## Запуск

Приложение состоит из двух частей:

1. **Frontend (autoscan)** — Next.js на порту 3000
2. **Backend (auto_ai_auth)** — Django API на порту 8000

### 1. Запуск backend

```bash
cd /Users/valenchits-pc/PycharmProjects/auto_ai_auth

# Активируйте виртуальное окружение (если есть)
# source venv/bin/activate   # или: poetry shell

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend будет доступен на `http://localhost:8000`. API: `http://localhost:8000/api/v1/`.

### 2. Запуск frontend

```bash
cd /Users/valenchits-pc/aiAgents/autoscan

cp .env.example .env   # если ещё не создан
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:3000`.

### Важно

Ошибка `net::ERR_CONNECTION_REFUSED` означает, что backend не запущен. Сначала запустите backend (шаг 1), затем frontend (шаг 2).
