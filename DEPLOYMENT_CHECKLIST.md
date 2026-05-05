# 🏠 Home Setup & Deployment Checklist

Follow these steps when you get home to make your AI Chatbot live:

### 1. Create the Backend `.env` File
Create a file named `.env` in the **root** folder (`AIchatbot/.env`) and paste this:
```text
GEMINI_API_KEY=your_google_ai_studio_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=chatbot-memory-index
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

### 2. Create the Frontend `.env` File
Create a file named `.env` in the **frontend** folder (`AIchatbot/frontend/.env`) and paste this:
```text
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=
```

### 3. Reset Pinecone (Important!)
1. Go to your **Pinecone Dashboard**.
2. **Delete** the old `chatbot-memory-index`.
3. **Create** a new one with the same name.
4. Set **Dimensions: 768** and **Metric: Cosine**.

### 4. Feed the AI
Open your terminal in the `AIchatbot` folder and run:
```powershell
python ingest_data.py
```
*(Wait for it to say "Successfully ingested all data")*

### 5. Push to GitHub
Open **GitHub Desktop** and push all changes to your repository.

### 6. Go Live on Vercel
1. Go to [Vercel.com](https://vercel.com) and import your repo.
2. Add all the keys from Step 1 & 2 into the **Environment Variables** section in Vercel.
3. Click **Deploy**.

**You're done! Your professional AI Chatbot will be live on the internet.** 🚀
