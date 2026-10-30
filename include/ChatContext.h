#pragma once

#include <chrono>
#include <string>
#include <string_view>
#include <vector>
#include <mutex>
#include <nlohmann/json.hpp>

namespace gemini {

/**
 * @brief Represents the author role in a conversation turn.
 */
enum class Role {
    User,
    Model,
    System
};

/**
 * @brief Converts a Role enum value to its Gemini API string representation.
 */
[[nodiscard]] std::string roleToString(Role role);

/**
 * @brief Parses a string into a Role enum.
 */
[[nodiscard]] Role roleFromString(std::string_view str);

/**
 * @brief Represents a single message in the conversation.
 */
struct ChatMessage {
    Role role;
    std::string content;
    std::chrono::system_clock::time_point timestamp;

    ChatMessage(Role r, std::string text)
        : role(r),
          content(std::move(text)),
          timestamp(std::chrono::system_clock::now()) {}

    ChatMessage(Role r, std::string text, std::chrono::system_clock::time_point time)
        : role(r),
          content(std::move(text)),
          timestamp(time) {}

    /**
     * @brief Formats this message into Gemini API content item:
     * {"role": "user"|"model", "parts": [{"text": "..."}]}
     */
    [[nodiscard]] nlohmann::json toGeminiContent() const;

    /**
     * @brief Serializes message to JSON for persistence.
     */
    [[nodiscard]] nlohmann::json toJson() const;

    /**
     * @brief Deserializes message from stored JSON.
     */
    [[nodiscard]] static ChatMessage fromJson(const nlohmann::json& j);
};

/**
 * @brief Thread-safe manager for conversation history and prompt structuring.
 */
class ChatContext {
public:
    /**
     * @param maxTurns Maximum number of turns (user+model pairs) to retain before pruning older turns.
     *                 0 means unlimited.
     */
    explicit ChatContext(size_t maxTurns = 50);

    // Rule of 5: Default copy and move operations are deleted due to mutex,
    // custom thread-safe copy/move can be provided or disabled.
    ChatContext(const ChatContext& other);
    ChatContext& operator=(const ChatContext& other);
    ChatContext(ChatContext&& other) noexcept;
    ChatContext& operator=(ChatContext&& other) noexcept;
    ~ChatContext() = default;

    /**
     * @brief Adds a user query to the history.
     */
    void addUserMessage(std::string_view text);

    /**
     * @brief Adds a model response to the history.
     */
    void addModelMessage(std::string_view text);

    /**
     * @brief Adds a generic message with specified role.
     */
    void addMessage(Role role, std::string_view text);

    /**
     * @brief Removes the most recent message (e.g. on failed generation retry).
     * @return true if a message was removed, false if history was empty.
     */
    bool popLastMessage();

    /**
     * @brief Sets or updates the global system instruction (persona/guidelines).
     */
    void setSystemInstruction(std::string_view instruction);

    /**
     * @brief Retrieves the active system instruction.
     */
    [[nodiscard]] std::string getSystemInstruction() const;

    /**
     * @brief Checks if a system instruction is active.
     */
    [[nodiscard]] bool hasSystemInstruction() const;

    /**
     * @brief Clears all conversation history, keeping the system instruction.
     */
    void clear();

    /**
     * @brief Clears everything including system instruction.
     */
    void resetAll();

    /**
     * @brief Returns a copy of the current message history.
     */
    [[nodiscard]] std::vector<ChatMessage> getHistory() const;

    /**
     * @brief Returns total number of messages stored.
     */
    [[nodiscard]] size_t getMessageCount() const;

    /**
     * @brief Returns total number of user-model roundtrips.
     */
    [[nodiscard]] size_t getTurnCount() const;

    /**
     * @brief Checks if history is empty.
     */
    [[nodiscard]] bool empty() const;

    /**
     * @brief Sets max turns allowed in memory.
     */
    void setMaxTurns(size_t maxTurns);

    /**
     * @brief Returns current max turns limit.
     */
    [[nodiscard]] size_t getMaxTurns() const;

    /**
     * @brief Constructs the full JSON payload accepted by Gemini v1beta `generateContent`.
     * Formats contents array and optional system_instruction.
     */
    [[nodiscard]] nlohmann::json toGeminiPayload() const;

    /**
     * @brief Saves conversation history to a JSON file on disk.
     */
    bool saveToFile(const std::string& filePath) const;

    /**
     * @brief Loads conversation history from a JSON file.
     */
    bool loadFromFile(const std::string& filePath);

private:
    void pruneHistoryIfNeeded();

    mutable std::mutex mutex_;
    std::vector<ChatMessage> history_;
    std::string systemInstruction_;
    size_t maxTurns_{50};
};

} // namespace gemini
