# Деплой SkillEng

Архитектура: **бэкенд + PostgreSQL на Render**, **фронтенд на Vercel**. Всё на бесплатных тарифах.

```
[Браузер] → Vercel (React/Vite, статика) → Render (NestJS API) → Render PostgreSQL
```

---

## 0. Подготовка: репозиторий на GitHub

Render и Vercel деплоят из Git. Нужен **один** репозиторий на весь проект (backend + frontend).

1. Создай пустой репозиторий на GitHub (без README), например `skilleng`.
2. В терминале на Mac, в корне проекта, выполни (важно: внутри `backend/` мог остаться старый `.git` — убираем, чтобы был единый репозиторий):

   ```bash
   cd /Users/azamat/Desktop/projects/skilleng
   rm -rf backend/.git frontend/.git .git
   git init
   git add .
   git commit -m "SkillEng: initial commit with deploy config"
   git branch -M main
   git remote add origin https://github.com/<твой-логин>/skilleng.git
   git push -u origin main
   ```

> `.env`, `node_modules` и `dist` уже в `.gitignore` — секреты и сборки в репозиторий не попадут.

---

## 1. Бэкенд + база на Render

1. Зайди на [render.com](https://render.com), войди через GitHub.
2. **New → Blueprint** → выбери репозиторий `skilleng`. Render прочитает `render.yaml` и создаст:
   - PostgreSQL `skilleng-db`;
   - веб-сервис `skilleng-api`.
3. Перед созданием Render попросит заполнить переменные с пометкой «sync: false». Пока можно задать временные значения — позже поправим:
   - `GEMINI_API_KEY` — **твой ключ Google Gemini** (получить: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)). Без него бэкенд не запустится.
   - `CORS_ORIGIN` — пока поставь `https://example.com` (заменим после Vercel).
   - `BACKEND_PUBLIC_URL` — пока пусто/заглушка (заполним, когда узнаем URL сервиса).
4. Нажми **Apply**. Render соберёт и поднимет сервис. Запиши его адрес — он вида `https://skilleng-api.onrender.com`.
5. Вернись в **skilleng-api → Environment** и поправь:
   - `BACKEND_PUBLIC_URL` = `https://skilleng-api.onrender.com` (адрес из шага 4).
   - `CORS_ORIGIN` оставь пока — обновим после деплоя фронта.

> Миграции (`prisma migrate deploy`) применяются автоматически при старте. `JWT_ACCESS_SECRET` Render генерирует сам.

---

## 2. Фронтенд на Vercel

1. Зайди на [vercel.com](https://vercel.com), войди через GitHub.
2. **Add New → Project** → выбери тот же репозиторий.
3. В настройках импорта:
   - **Root Directory** → `frontend`.
   - Framework определится как **Vite** автоматически (есть `vercel.json`).
4. **Environment Variables** добавь:
   - `VITE_API_URL` = `https://skilleng-api.onrender.com/api` (адрес Render + `/api`).
5. **Deploy**. Получишь адрес вида `https://skilleng.vercel.app`.

---

## 3. Связать фронт и бэк (CORS)

1. Скопируй адрес фронта из Vercel (`https://<твой-проект>.vercel.app`).
2. На Render: **skilleng-api → Environment** → `CORS_ORIGIN` = этот адрес (без слэша в конце). Сохрани — сервис перезапустится.

Теперь авторизация работает между доменами: refresh-кука уже настроена на `SameSite=None; Secure` (переменная `REFRESH_COOKIE_SAMESITE=none`).

---

## 4. Демо-данные (один раз)

Чтобы появились курсы, юниты, темы и демо-пользователи:

1. Render: **skilleng-api → Shell**.
2. Выполни:

   ```bash
   npx prisma db seed
   ```

Демо-входы после сидинга:
- преподаватель — `teacher@skilleng.dev`
- студент — `dana@skilleng.dev`
- пароль у обоих — `Password123!`

---

## Проверка

- `https://skilleng-api.onrender.com/api/health` → отвечает (бэкенд жив).
- Открой адрес Vercel → войди демо-аккаунтом → данные грузятся.

## Важно знать

- **Free-план Render «засыпает»** после 15 минут простоя: первый запрос после паузы идёт ~30–50 секунд. Это нормально для демо.
- **Файловое хранилище эфемерное** на free-плане: загруженные аудиозаписи речи сбрасываются при редеплое. Для постоянного хранения — подключить Cloudflare R2 (переменные `R2_*` + `STORAGE_DRIVER=r2`) или платный диск Render.
- **Gemini-ключ обязателен** — без него бэкенд не стартует (ИИ-функции: задания, проверка письма/речи, тьютор).
