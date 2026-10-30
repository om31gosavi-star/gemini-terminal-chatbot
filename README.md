# Google Gemini C++ Terminal Chatbot

A high-performance, object-oriented modern C++ (C++20) terminal chatbot that interfaces with the **Google Gemini API** (`v1beta`). Built with **libcurl** for HTTP communication, **nlohmann/json** for JSON parsing, and a modular architecture adhering to modern C++ best practices.

---

## Architecture Overview

The system is designed with strict separation of concerns, RAII resource management, const-correctness, thread safety, and an extensible exception hierarchy.

```
                  ┌────────────────────────┐
                  │      Terminal UI       │
                  │       (std::cin)       │
                  └───────────┬────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │       ChatEngine       │ ◄── Orchestrates I/O, slash commands,
                  │   (Controller/Loop)    │     and exception recovery
                  └──────┬──────────┬──────┘
                         │          │
        Updates/Queries  │          │  Dispatches Prompts
                         ▼          ▼
            ┌──────────────┐     ┌──────────────┐
            │ ChatContext  │     │  APIClient   │
            │  (Memory)    │     │  (libcurl)   │
            └──────────────┘     └──────┬───────┘
                                        │ HTTP POST (SSL/TLS)
                                        ▼
                                ┌───────────────┐
                                │ Gemini API    │
                                │ (v1beta REST) │
                                └───────────────┘
```

### Modular Components

1. **`APIClient`** (`include/APIClient.h`, `src/APIClient.cpp`)
   - Manages HTTP POST network requests to Google Gemini REST endpoints using `libcurl`.
   - Utilizes RAII for libcurl session handles and global state initialization (`CurlGlobalInit`).
   - Automatically utilizes the native OS certificate store on Windows (`CURLSSLOPT_NATIVE_CA`) for SSL/TLS verification.
   - Parses incoming JSON using `nlohmann/json` and extracts candidate content or safety feedback.
   - Supports configurable generation settings (temperature, top-p, top-k, max tokens) and custom timeout limits.

2. **`ChatContext`** (`include/ChatContext.h`, `src/ChatContext.cpp`)
   - Provides multi-turn conversational memory formatted for the Gemini API schema (`contents` array of role/part pairs).
   - Thread-safe access protected by `std::mutex` and `std::scoped_lock`.
   - Sliding-window history pruning (`maxTurns`) to prevent unbounded memory growth while keeping conversation flow intact.
   - History export and import to JSON (`saveToFile`, `loadFromFile`).

3. **`ChatEngine`** (`include/ChatEngine.h`, `src/ChatEngine.cpp`)
   - The central terminal controller managing the user interaction loop.
   - Native Windows Virtual Terminal sequence processing (`ENABLE_VIRTUAL_TERMINAL_PROCESSING`) and ANSI escape styling.
   - Rich interactive commands: `/help`, `/clear`, `/history`, `/model`, `/system`, `/key`, `/temp`, `/stats`, `/save`, `/retry`, `/exit`.
   - Rolls back unresponded user turns upon network/API failures to keep chat context synchronized.

4. **`Exceptions`** (`include/Exceptions.h`)
   - Polymorphic exception hierarchy rooted at `GeminiException` (`std::runtime_error`):
     - `NetworkException`: Network connectivity failures, DNS resolution errors, and request timeouts.
     - `ApiException`: HTTP error status codes (400, 401, 403, 429, 500), API key validation, and rate limit detection.
     - `JsonParseException`: Malformed JSON or schema mismatches.
     - `ConfigurationException`: Missing or invalid setup options.

---

## Directory Structure

```
c:/omchatbot/
├── CMakeLists.txt              # Modern CMake build configuration (C++20)
├── README.md                   # Documentation and usage guide
├── include/
│   ├── Exceptions.h            # Custom exception hierarchy
│   ├── APIClient.h             # Gemini API communication interface
│   ├── ChatContext.h           # Conversation history and memory manager
│   └── ChatEngine.h            # Interactive terminal controller
└── src/
    ├── APIClient.cpp           # libcurl HTTP client implementation
    ├── ChatContext.cpp         # Conversation history management
    ├── ChatEngine.cpp          # CLI loop, commands, and error handling
    └── main.cpp                # CLI entry point and environment loader
```

---

## Prerequisites & Dependencies

- **C++ Compiler**: GCC 11+, Clang 13+, or MSVC 2019+ (with C++20 support).
- **CMake**: Version 3.20 or newer.
- **libcurl**: HTTP library with SSL/TLS support.
- **nlohmann/json**: (Automatically downloaded via CMake `FetchContent` if not installed locally).

---

## Building the Project

### Windows (MSYS2 / UCRT64 or MinGW)

```powershell
# 1. Configure CMake with Ninja
cmake -B build -G "Ninja"

# 2. Compile the executable
cmake --build build
```

### Linux (Ubuntu/Debian)

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y build-essential cmake libcurl4-openssl-dev nlohmann-json3-dev

# Build
cmake -B build
cmake --build build -j$(nproc)
```

### macOS (Homebrew)

```bash
brew install cmake curl nlohmann-json
cmake -B build
cmake --build build
```

The resulting binary will be located in `build/bin/gemini_chat` (or `build/bin/gemini_chat.exe` on Windows).

---

## Running the Chatbot

### 1. Set your Gemini API Key

You can obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

Set it as an environment variable:
```powershell
# Windows PowerShell
$env:GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# Linux / macOS
export GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
```

Or pass it via the command-line flag `--key`:
```powershell
.\build\bin\gemini_chat.exe --key "AIzaSyYourGeminiApiKeyHere"
```

If neither is provided, the chatbot will interactively prompt you for the key at startup.

### 2. Command-Line Options

```
Options:
  -k, --key <api_key>      Google Gemini API Key (or set GEMINI_API_KEY env var)
  -m, --model <name>       Gemini model name (default: gemini-2.5-flash)
  -s, --system <prompt>    System instruction / persona prompt
  -t, --timeout <seconds>  Network request timeout in seconds (default: 30)
  --max-turns <count>      Maximum conversation turns kept in memory (default: 50)
  -h, --help               Display help message
```

### 3. Interactive Terminal Commands

While inside the chat session, you can use the following commands:

| Command | Description |
|---|---|
| `/help` | Display list of commands |
| `/clear` or `/reset` | Clear conversation memory |
| `/history` | Print the full conversation history |
| `/model <name>` | Display or switch active model (e.g. `gemini-1.5-pro`) |
| `/system <prompt>` | View or update system guidelines / persona |
| `/key <api_key>` | Update the Gemini API key at runtime |
| `/temp <0.0 - 2.0>` | Adjust generation temperature |
| `/stats` | View session uptime and turn counts |
| `/save <file.json>` | Export conversation history to disk |
| `/retry` | Resend the last prompt |
| `/exit` or `/quit` | Exit the application |
