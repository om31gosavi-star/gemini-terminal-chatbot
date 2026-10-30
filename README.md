# Google Gemini Dual-Engine Studio & C++20 Core

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fom31gosavi-star%2Fgemini-terminal-chatbot&env=GEMINI_API_KEY&envDescription=Google%20Gemini%20API%20Key%20from%20Google%20AI%20Studio&envLink=https%3A%2F%2Faistudio.google.com%2Fapp%2Fapikey)

A full-stack intelligent conversational AI platform powered by **Google Gemini API** (`v1beta`). Features a modern **Next.js 15 Web Studio** designed for production deployment on **Vercel**, backed by a strict **Object-Oriented C++20 terminal engine** with RAII `libcurl` transports.

---

## Live Web Application Pages

The full-stack web studio features four pages built with Next.js 15 App Router:

1. **Home / Showcase (`/`)**
   - High-impact glassmorphic dark design with dual-engine highlights.
   - Quick prompt starter chips that jump directly into the chat session.
   - Core architectural feature breakdowns.

2. **Interactive Chat Studio (`/chat`)**
   - **Model Selector**: Switch on-the-fly between `Gemini 2.5 Flash`, `Gemini 1.5 Pro`, and `Gemini 1.5 Flash`.
   - **System Persona Customization**: Preset personas (Helpful Assistant, Senior C++ Architect, Concise Terminal Bot, Creative Brainstormer) or custom prompts.
   - **Controls & Memory**: Fine-grained temperature slider, real-time roundtrip latency (ms), token metrics, and export chat to JSON.
   - **Fault-Tolerant Feedback**: Friendly diagnostic alerts and automatic message rollbacks for invalid keys, rate limits, or timeouts.
   - **Client-Side Key Management**: Securely input your own Gemini API key saved to browser `localStorage` only.

3. **OOP Architecture Explorer (`/architecture`)**
   - Interactive class explorer detailing `gemini::APIClient`, `gemini::ChatContext`, `gemini::ChatEngine`, and `gemini::Exceptions`.
   - Design patterns breakdown (RAII, Singleton, Move Semantics, Windows Native CA Store, Granular Exception Tree).
   - Embedded C++ header and interface snippets with one-click copy.

4. **Model Telemetry & Benchmarks (`/benchmarks`)**
   - Comparative model performance matrix (latency, context window, throughput, pricing tiers).
   - **Live Latency Ping Test**: Real-time roundtrip measurement testing browser to Vercel to Gemini API connectivity.

---

## 1-Click Hosting on Vercel

### Option 1: Direct Vercel Import (Recommended)

1. Open **[vercel.com/new](https://vercel.com/new)**.
2. Under **"Import Git Repository"**, select **`om31gosavi-star/gemini-terminal-chatbot`**.
3. Under **"Environment Variables"**, add:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
4. Click **Deploy**. Vercel will automatically detect Next.js 15, build the application, and assign a live production URL (e.g. `https://gemini-terminal-chatbot.vercel.app`).

### Option 2: 1-Click Deploy Button

Click the badge below to clone and deploy automatically:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fom31gosavi-star%2Fgemini-terminal-chatbot&env=GEMINI_API_KEY&envDescription=Google%20Gemini%20API%20Key%20from%20Google%20AI%20Studio&envLink=https%3A%2F%2Faistudio.google.com%2Fapp%2Fapikey)

---

## Local Web Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open in browser
# Navigate to http://localhost:3000
```

---

## C++20 Native Engine

Alongside the web application, the repository houses the high-performance native C++20 terminal engine:

### C++ Modular Class Structure

- **`APIClient`** ([`include/APIClient.h`](include/APIClient.h), [`src/APIClient.cpp`](src/APIClient.cpp)): Manages libcurl HTTP POST requests with Windows Native CA Store (`CURLSSLOPT_NATIVE_CA`) and JSON parsing via `nlohmann/json`.
- **`ChatContext`** ([`include/ChatContext.h`](include/ChatContext.h), [`src/ChatContext.cpp`](src/ChatContext.cpp)): Thread-safe conversation history with sliding-window turn pruning.
- **`ChatEngine`** ([`include/ChatEngine.h`](include/ChatEngine.h), [`src/ChatEngine.cpp`](src/ChatEngine.cpp)): Terminal I/O loop, slash commands (`/help`, `/clear`, `/history`, `/model`, `/stats`, `/save`), and exception recovery.
- **`Exceptions`** ([`include/Exceptions.h`](include/Exceptions.h)): Custom polymorphic exception hierarchy (`NetworkException`, `ApiException`, `JsonParseException`, `ConfigurationException`).

### Building and Running the C++ Binary

```powershell
# Configure and build
cmake -B build -G "Ninja"
cmake --build build

# Set API key and execute
$env:GEMINI_API_KEY = "your-api-key"
.\build\bin\gemini_chat.exe --model gemini-2.5-flash
```

---

## License

MIT License. Open-source and free to use.
