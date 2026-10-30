#include "ChatEngine.h"
#include <iostream>
#include <iomanip>
#include <sstream>
#include <algorithm>

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#endif

namespace gemini {

ChatEngine::ChatEngine(std::shared_ptr<APIClient> apiClient,
                       std::shared_ptr<ChatContext> context)
    : apiClient_(std::move(apiClient)),
      context_(std::move(context)),
      sessionStartTime_(std::chrono::steady_clock::now()) {
    if (!apiClient_) {
        throw ConfigurationException("ChatEngine requires a valid APIClient instance.");
    }
    if (!context_) {
        throw ConfigurationException("ChatEngine requires a valid ChatContext instance.");
    }
}

void ChatEngine::setupConsole() const {
#ifdef _WIN32
    // Enable ANSI escape sequence processing on Windows consoles
    HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
    if (hOut != INVALID_HANDLE_VALUE) {
        DWORD dwMode = 0;
        if (GetConsoleMode(hOut, &dwMode)) {
            dwMode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
            SetConsoleMode(hOut, dwMode);
        }
    }
    // Set console output code page to UTF-8
    SetConsoleOutputCP(CP_UTF8);
    SetConsoleCP(CP_UTF8);
#endif
}

void ChatEngine::printBanner() const {
    std::cout << style::Cyan << style::Bold
              << "╔════════════════════════════════════════════════════════════════╗\n"
              << "║                   GOOGLE GEMINI TERMINAL CHATBOT               ║\n"
              << "╚════════════════════════════════════════════════════════════════╝\n"
              << style::Reset;
    std::cout << style::Gray << " Active Model: " << style::White << style::Bold
              << apiClient_->getModel() << style::Reset
              << style::Gray << " | Timeout: " << style::White << apiClient_->getTimeout() << "s"
              << style::Gray << " | C++ Standard: C++20\n"
              << " Type " << style::Yellow << "/help" << style::Gray
              << " for commands or " << style::Yellow << "/exit" << style::Gray
              << " to quit.\n"
              << "──────────────────────────────────────────────────────────────────\n"
              << style::Reset << std::endl;
}

void ChatEngine::printHelp() const {
    std::cout << "\n" << style::Bold << style::Yellow << "Available Commands:\n" << style::Reset
              << style::Green << "  /help            " << style::Reset << "Display this help menu\n"
              << style::Green << "  /clear, /reset   " << style::Reset << "Clear current conversation memory\n"
              << style::Green << "  /history         " << style::Reset << "View conversation history\n"
              << style::Green << "  /model <name>    " << style::Reset << "View or change current Gemini model\n"
              << style::Green << "  /system <prompt> " << style::Reset << "Set or view system persona / guidelines\n"
              << style::Green << "  /key <api_key>   " << style::Reset << "Update Gemini API key\n"
              << style::Green << "  /temp <0.0-2.0>  " << style::Reset << "Set generation temperature\n"
              << style::Green << "  /stats           " << style::Reset << "Display session duration and turn statistics\n"
              << style::Green << "  /save <file>     " << style::Reset << "Save conversation transcript to a JSON file\n"
              << style::Green << "  /retry           " << style::Reset << "Resend the last prompt\n"
              << style::Green << "  /exit, /quit     " << style::Reset << "Exit chatbot session\n\n";
}

void ChatEngine::printStats() const {
    auto now = std::chrono::steady_clock::now();
    auto elapsedSec = std::chrono::duration_cast<std::chrono::seconds>(now - sessionStartTime_).count();
    auto minutes = elapsedSec / 60;
    auto seconds = elapsedSec % 60;

    std::cout << "\n" << style::Bold << style::Cyan << "Session Statistics:\n" << style::Reset
              << "  - Elapsed Time: " << minutes << "m " << seconds << "s\n"
              << "  - Total Turns:  " << context_->getTurnCount() << "\n"
              << "  - Total Msgs:   " << context_->getMessageCount() << "\n"
              << "  - Memory Limit: " << context_->getMaxTurns() << " turns\n"
              << "  - Active Model: " << apiClient_->getModel() << "\n\n";
}

void ChatEngine::printHistory() const {
    auto history = context_->getHistory();
    if (history.empty()) {
        std::cout << style::Gray << "\n[No conversation history recorded yet]\n\n" << style::Reset;
        return;
    }

    std::cout << "\n" << style::Bold << style::Yellow << "=== Conversation History ("
              << history.size() << " messages) ===\n" << style::Reset;

    for (size_t i = 0; i < history.size(); ++i) {
        const auto& msg = history[i];
        if (msg.role == Role::User) {
            std::cout << style::Cyan << style::Bold << "User: " << style::Reset << msg.content << "\n";
        } else if (msg.role == Role::Model) {
            std::cout << style::Magenta << style::Bold << "Gemini: " << style::Reset << msg.content << "\n";
        }
    }
    std::cout << style::Yellow << "====================================================\n\n" << style::Reset;
}

bool ChatEngine::handleCommand(std::string_view commandLine) {
    if (commandLine.empty() || commandLine[0] != '/') {
        return false;
    }

    std::istringstream iss{std::string(commandLine)};
    std::string cmd;
    iss >> cmd;

    // Convert command to lowercase
    std::transform(cmd.begin(), cmd.end(), cmd.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });

    if (cmd == "/exit" || cmd == "/quit") {
        std::cout << style::Yellow << "\nThank you for chatting! Goodbye.\n" << style::Reset;
        stop();
        return true;
    }

    if (cmd == "/help") {
        printHelp();
        return true;
    }

    if (cmd == "/clear" || cmd == "/reset") {
        context_->clear();
        std::cout << style::Green << "✓ Conversation memory cleared successfully.\n" << style::Reset;
        return true;
    }

    if (cmd == "/history") {
        printHistory();
        return true;
    }

    if (cmd == "/stats") {
        printStats();
        return true;
    }

    if (cmd == "/retry") {
        if (lastUserInput_.empty()) {
            std::cout << style::Yellow << "No previous input to retry.\n" << style::Reset;
            return true;
        }
        std::cout << style::Gray << "Retrying prompt: \"" << lastUserInput_ << "\"...\n" << style::Reset;
        processInput(lastUserInput_);
        return true;
    }

    if (cmd == "/model") {
        std::string newModel;
        iss >> newModel;
        if (newModel.empty()) {
            std::cout << style::Cyan << "Current model: " << style::Bold
                      << apiClient_->getModel() << style::Reset << "\n";
            std::cout << style::Gray << "Usage: /model <model_name> (e.g., gemini-2.5-flash, gemini-1.5-pro)\n" << style::Reset;
        } else {
            apiClient_->setModel(newModel);
            std::cout << style::Green << "✓ Model changed to: " << style::Bold
                      << newModel << style::Reset << "\n";
        }
        return true;
    }

    if (cmd == "/system") {
        std::string restOfLine;
        std::getline(iss, restOfLine);
        // Trim leading spaces
        size_t first = restOfLine.find_first_not_of(" \t");
        if (first == std::string::npos) {
            std::string currentSys = context_->getSystemInstruction();
            if (currentSys.empty()) {
                std::cout << style::Gray << "No active system instruction.\n" << style::Reset;
            } else {
                std::cout << style::Cyan << "Current system instruction: " << style::Reset
                          << currentSys << "\n";
            }
            std::cout << style::Gray << "Usage: /system <instruction text>\n" << style::Reset;
        } else {
            std::string instruction = restOfLine.substr(first);
            context_->setSystemInstruction(instruction);
            std::cout << style::Green << "✓ System instruction updated.\n" << style::Reset;
        }
        return true;
    }

    if (cmd == "/key") {
        std::string newKey;
        iss >> newKey;
        if (newKey.empty()) {
            std::cout << style::Gray << "Usage: /key <your_gemini_api_key>\n" << style::Reset;
        } else {
            apiClient_->setApiKey(newKey);
            std::cout << style::Green << "✓ API key updated successfully.\n" << style::Reset;
        }
        return true;
    }

    if (cmd == "/temp") {
        float tempVal = 0.0f;
        if (iss >> tempVal) {
            auto cfg = apiClient_->getGenerationConfig();
            cfg.temperature = tempVal;
            apiClient_->setGenerationConfig(cfg);
            std::cout << style::Green << "✓ Temperature set to: " << tempVal << style::Reset << "\n";
        } else {
            std::cout << style::Gray << "Usage: /temp <0.0 - 2.0>\n" << style::Reset;
        }
        return true;
    }

    if (cmd == "/save") {
        std::string filePath;
        iss >> filePath;
        if (filePath.empty()) {
            filePath = "gemini_chat_history.json";
        }
        if (context_->saveToFile(filePath)) {
            std::cout << style::Green << "✓ Chat history saved to: " << filePath << style::Reset << "\n";
        } else {
            std::cout << style::Red << "✗ Failed to write file: " << filePath << style::Reset << "\n";
        }
        return true;
    }

    std::cout << style::Yellow << "Unknown command: '" << cmd
              << "'. Type /help for available commands.\n" << style::Reset;
    return true;
}

void ChatEngine::reportNetworkError(const NetworkException& e) const {
    std::cout << "\n" << style::Bold << style::Red << "[Network Error] " << style::Reset;
    if (e.isTimeout()) {
        std::cout << style::Red << "The request to Gemini API timed out ("
                  << apiClient_->getTimeout() << "s limit reached).\n" << style::Reset
                  << style::Yellow << "Tips:\n"
                  << "  • Check your internet connection.\n"
                  << "  • Increase timeout with APIClient::setTimeout().\n"
                  << "  • Type " << style::Bold << "/retry" << style::Reset << style::Yellow
                  << " to resend your last message.\n\n" << style::Reset;
    } else {
        std::cout << style::Red << e.what() << "\n" << style::Reset
                  << style::Yellow << "Tips: Verify network availability, DNS, or proxy settings.\n\n"
                  << style::Reset;
    }
}

void ChatEngine::reportApiError(const ApiException& e) const {
    std::cout << "\n" << style::Bold << style::Red << "[API Error "
              << e.getHttpStatusCode() << " - " << e.getApiStatus() << "]\n" << style::Reset;

    if (e.isInvalidApiKey()) {
        std::cout << style::Red << "Authentication failed: Invalid or missing API Key!\n"
                  << "Details: " << e.getErrorMessage() << "\n" << style::Reset
                  << style::Yellow << "Resolution:\n"
                  << "  • Check your API key at: https://aistudio.google.com/app/apikey\n"
                  << "  • Provide a new key now via: " << style::Bold << "/key <your_api_key>\n\n"
                  << style::Reset;
    } else if (e.isRateLimited()) {
        std::cout << style::Red << "Rate limit reached / Quota exhausted.\n"
                  << "Details: " << e.getErrorMessage() << "\n" << style::Reset
                  << style::Yellow << "Resolution: Please wait a moment before sending another request.\n\n"
                  << style::Reset;
    } else if (e.isServerError()) {
        std::cout << style::Red << "Google Gemini server error (" << e.getHttpStatusCode() << ").\n"
                  << "Details: " << e.getErrorMessage() << "\n" << style::Reset
                  << style::Yellow << "Resolution: Google servers are temporarily overloaded. Please try again shortly.\n\n"
                  << style::Reset;
    } else {
        std::cout << style::Red << e.getErrorMessage() << "\n\n" << style::Reset;
    }
}

void ChatEngine::reportJsonError(const JsonParseException& e) const {
    std::cout << "\n" << style::Bold << style::Red << "[JSON Parse Error]\n" << style::Reset
              << style::Red << e.what() << "\n\n" << style::Reset;
}

void ChatEngine::reportGenericError(const std::exception& e) const {
    std::cout << "\n" << style::Bold << style::Red << "[Error] " << style::Reset
              << style::Red << e.what() << "\n\n" << style::Reset;
}

bool ChatEngine::processInput(const std::string& input) {
    if (input.empty()) {
        return false;
    }

    lastUserInput_ = input;

    // Append user input to conversation context
    context_->addUserMessage(input);

    std::cout << style::Gray << "✦ Gemini is thinking..." << style::Reset << std::flush;

    try {
        nlohmann::json payload = context_->toGeminiPayload();
        std::string reply = apiClient_->sendChatRequest(payload);

        // Clear the "thinking..." indicator line
        std::cout << "\r" << std::string(35, ' ') << "\r";

        // Print model response
        std::cout << style::Magenta << style::Bold << "Gemini ✦ ❯ " << style::Reset
                  << reply << "\n\n";

        // Store model response in context
        context_->addModelMessage(reply);
        return true;
    } catch (const NetworkException& e) {
        std::cout << "\r" << std::string(35, ' ') << "\r";
        reportNetworkError(e);
        // Rollback unresponded user message to keep context synchronous
        context_->popLastMessage();
        return false;
    } catch (const ApiException& e) {
        std::cout << "\r" << std::string(35, ' ') << "\r";
        reportApiError(e);
        context_->popLastMessage();
        return false;
    } catch (const JsonParseException& e) {
        std::cout << "\r" << std::string(35, ' ') << "\r";
        reportJsonError(e);
        context_->popLastMessage();
        return false;
    } catch (const ConfigurationException& e) {
        std::cout << "\r" << std::string(35, ' ') << "\r";
        std::cout << "\n" << style::Bold << style::Red << "[Configuration Error] "
                  << style::Reset << e.what() << "\n\n";
        context_->popLastMessage();
        return false;
    } catch (const std::exception& e) {
        std::cout << "\r" << std::string(35, ' ') << "\r";
        reportGenericError(e);
        context_->popLastMessage();
        return false;
    }
}

void ChatEngine::run() {
    setupConsole();
    printBanner();

    isRunning_ = true;
    std::string line;

    while (isRunning_) {
        std::cout << style::Cyan << style::Bold << "You ❯ " << style::Reset;

        if (!std::getline(std::cin, line)) {
            // EOF (Ctrl+D or Ctrl+Z) encountered
            std::cout << style::Yellow << "\nSession ended.\n" << style::Reset;
            break;
        }

        // Trim leading and trailing whitespace
        size_t first = line.find_first_not_of(" \t\r\n");
        if (first == std::string::npos) {
            continue; // Ignore blank lines
        }
        size_t last = line.find_last_not_of(" \t\r\n");
        std::string trimmed = line.substr(first, (last - first + 1));

        // Handle slash commands
        if (trimmed[0] == '/') {
            handleCommand(trimmed);
            continue;
        }

        processInput(trimmed);
    }
}

void ChatEngine::stop() {
    isRunning_ = false;
}

} // namespace gemini
