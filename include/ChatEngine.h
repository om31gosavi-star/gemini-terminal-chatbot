#pragma once

#include "APIClient.h"
#include "ChatContext.h"
#include <memory>
#include <string>
#include <string_view>
#include <atomic>

namespace gemini {

/**
 * @brief Terminal user interface styling helpers.
 */
namespace style {
    inline constexpr std::string_view Reset   = "\033[0m";
    inline constexpr std::string_view Bold    = "\033[1m";
    inline constexpr std::string_view Dim     = "\033[2m";
    inline constexpr std::string_view Red     = "\033[31m";
    inline constexpr std::string_view Green   = "\033[32m";
    inline constexpr std::string_view Yellow  = "\033[33m";
    inline constexpr std::string_view Blue    = "\033[34m";
    inline constexpr std::string_view Magenta = "\033[35m";
    inline constexpr std::string_view Cyan    = "\033[36m";
    inline constexpr std::string_view White   = "\033[37m";
    inline constexpr std::string_view Gray    = "\033[90m";
}

/**
 * @brief Core orchestrator for the terminal chatbot session.
 * Manages the I/O loop, command execution, and exception handling.
 */
class ChatEngine {
public:
    /**
     * @brief Constructs a ChatEngine with injected client and context dependencies.
     */
    ChatEngine(std::shared_ptr<APIClient> apiClient,
               std::shared_ptr<ChatContext> context);

    ~ChatEngine() = default;

    ChatEngine(const ChatEngine&) = delete;
    ChatEngine& operator=(const ChatEngine&) = delete;
    ChatEngine(ChatEngine&&) noexcept = default;
    ChatEngine& operator=(ChatEngine&&) noexcept = default;

    /**
     * @brief Starts the interactive terminal chat loop.
     */
    void run();

    /**
     * @brief Stops the running loop.
     */
    void stop();

    /**
     * @brief Sends a single prompt programmatically and processes the response.
     * @return true if successful, false if an error occurred.
     */
    bool processInput(const std::string& input);

private:
    void printBanner() const;
    void printHelp() const;
    void printHistory() const;
    void printStats() const;
    bool handleCommand(std::string_view commandLine);
    void setupConsole() const;

    // Exception presentation helpers
    void reportNetworkError(const NetworkException& e) const;
    void reportApiError(const ApiException& e) const;
    void reportJsonError(const JsonParseException& e) const;
    void reportGenericError(const std::exception& e) const;

    std::shared_ptr<APIClient> apiClient_;
    std::shared_ptr<ChatContext> context_;
    std::atomic<bool> isRunning_{false};
    std::chrono::steady_clock::time_point sessionStartTime_;
    std::string lastUserInput_;
};

} // namespace gemini
