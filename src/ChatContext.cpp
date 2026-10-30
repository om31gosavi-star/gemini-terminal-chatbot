#include "ChatContext.h"
#include <fstream>
#include <sstream>

namespace gemini {

std::string roleToString(Role role) {
    switch (role) {
        case Role::User:
            return "user";
        case Role::Model:
            return "model";
        case Role::System:
            return "system";
    }
    return "user";
}

Role roleFromString(std::string_view str) {
    if (str == "model" || str == "assistant") {
        return Role::Model;
    }
    if (str == "system") {
        return Role::System;
    }
    return Role::User;
}

nlohmann::json ChatMessage::toGeminiContent() const {
    nlohmann::json contentJson;
    contentJson["role"] = roleToString(role);
    contentJson["parts"] = nlohmann::json::array({
        {{"text", content}}
    });
    return contentJson;
}

nlohmann::json ChatMessage::toJson() const {
    auto epochMs = std::chrono::duration_cast<std::chrono::milliseconds>(
        timestamp.time_since_epoch()).count();

    return nlohmann::json{
        {"role", roleToString(role)},
        {"content", content},
        {"timestamp_ms", epochMs}
    };
}

ChatMessage ChatMessage::fromJson(const nlohmann::json& j) {
    Role r = roleFromString(j.value("role", "user"));
    std::string text = j.value("content", "");
    auto epochMs = j.value("timestamp_ms", int64_t{0});
    auto tp = std::chrono::system_clock::time_point(
        std::chrono::milliseconds(epochMs));

    return ChatMessage(r, std::move(text), tp);
}

ChatContext::ChatContext(size_t maxTurns)
    : maxTurns_(maxTurns) {}

ChatContext::ChatContext(const ChatContext& other) {
    std::scoped_lock lock(other.mutex_);
    history_ = other.history_;
    systemInstruction_ = other.systemInstruction_;
    maxTurns_ = other.maxTurns_;
}

ChatContext& ChatContext::operator=(const ChatContext& other) {
    if (this == &other) {
        return *this;
    }
    std::scoped_lock lock(mutex_, other.mutex_);
    history_ = other.history_;
    systemInstruction_ = other.systemInstruction_;
    maxTurns_ = other.maxTurns_;
    return *this;
}

ChatContext::ChatContext(ChatContext&& other) noexcept {
    std::scoped_lock lock(other.mutex_);
    history_ = std::move(other.history_);
    systemInstruction_ = std::move(other.systemInstruction_);
    maxTurns_ = other.maxTurns_;
}

ChatContext& ChatContext::operator=(ChatContext&& other) noexcept {
    if (this == &other) {
        return *this;
    }
    std::scoped_lock lock(mutex_, other.mutex_);
    history_ = std::move(other.history_);
    systemInstruction_ = std::move(other.systemInstruction_);
    maxTurns_ = other.maxTurns_;
    return *this;
}

void ChatContext::addUserMessage(std::string_view text) {
    addMessage(Role::User, text);
}

void ChatContext::addModelMessage(std::string_view text) {
    addMessage(Role::Model, text);
}

void ChatContext::addMessage(Role role, std::string_view text) {
    std::lock_guard<std::mutex> lock(mutex_);
    history_.emplace_back(role, std::string(text));
    pruneHistoryIfNeeded();
}

bool ChatContext::popLastMessage() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (history_.empty()) {
        return false;
    }
    history_.pop_back();
    return true;
}

void ChatContext::setSystemInstruction(std::string_view instruction) {
    std::lock_guard<std::mutex> lock(mutex_);
    systemInstruction_ = std::string(instruction);
}

std::string ChatContext::getSystemInstruction() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return systemInstruction_;
}

bool ChatContext::hasSystemInstruction() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return !systemInstruction_.empty();
}

void ChatContext::clear() {
    std::lock_guard<std::mutex> lock(mutex_);
    history_.clear();
}

void ChatContext::resetAll() {
    std::lock_guard<std::mutex> lock(mutex_);
    history_.clear();
    systemInstruction_.clear();
}

std::vector<ChatMessage> ChatContext::getHistory() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return history_;
}

size_t ChatContext::getMessageCount() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return history_.size();
}

size_t ChatContext::getTurnCount() const {
    std::lock_guard<std::mutex> lock(mutex_);
    size_t userCount = 0;
    for (const auto& msg : history_) {
        if (msg.role == Role::User) {
            ++userCount;
        }
    }
    return userCount;
}

bool ChatContext::empty() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return history_.empty();
}

void ChatContext::setMaxTurns(size_t maxTurns) {
    std::lock_guard<std::mutex> lock(mutex_);
    maxTurns_ = maxTurns;
    pruneHistoryIfNeeded();
}

size_t ChatContext::getMaxTurns() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return maxTurns_;
}

void ChatContext::pruneHistoryIfNeeded() {
    if (maxTurns_ == 0) {
        return;
    }

    // A turn consists of a user message and a model response (approx 2 messages per turn)
    const size_t maxMessages = maxTurns_ * 2;
    if (history_.size() > maxMessages) {
        size_t excess = history_.size() - maxMessages;
        history_.erase(history_.begin(), history_.begin() + static_cast<std::ptrdiff_t>(excess));
        // Ensure conversation starts with a user message for Gemini API compliance
        while (!history_.empty() && history_.front().role != Role::User) {
            history_.erase(history_.begin());
        }
    }
}

nlohmann::json ChatContext::toGeminiPayload() const {
    std::lock_guard<std::mutex> lock(mutex_);

    nlohmann::json payload;

    // 1. System instruction (if present)
    if (!systemInstruction_.empty()) {
        payload["system_instruction"] = {
            {"parts", nlohmann::json::array({
                {{"text", systemInstruction_}}
            })}
        };
    }

    // 2. Multi-turn conversation contents
    auto contents = nlohmann::json::array();
    for (const auto& msg : history_) {
        // System messages are handled via system_instruction field
        if (msg.role == Role::System) {
            continue;
        }
        contents.push_back(msg.toGeminiContent());
    }

    payload["contents"] = std::move(contents);
    return payload;
}

bool ChatContext::saveToFile(const std::string& filePath) const {
    std::lock_guard<std::mutex> lock(mutex_);
    try {
        nlohmann::json doc;
        doc["system_instruction"] = systemInstruction_;
        doc["max_turns"] = maxTurns_;

        auto messagesJson = nlohmann::json::array();
        for (const auto& msg : history_) {
            messagesJson.push_back(msg.toJson());
        }
        doc["messages"] = std::move(messagesJson);

        std::ofstream file(filePath);
        if (!file.is_open()) {
            return false;
        }
        file << doc.dump(4);
        return true;
    } catch (...) {
        return false;
    }
}

bool ChatContext::loadFromFile(const std::string& filePath) {
    std::lock_guard<std::mutex> lock(mutex_);
    try {
        std::ifstream file(filePath);
        if (!file.is_open()) {
            return false;
        }
        nlohmann::json doc;
        file >> doc;

        systemInstruction_ = doc.value("system_instruction", "");
        maxTurns_ = doc.value("max_turns", size_t{50});

        history_.clear();
        if (doc.contains("messages") && doc["messages"].is_array()) {
            for (const auto& item : doc["messages"]) {
                history_.push_back(ChatMessage::fromJson(item));
            }
        }
        return true;
    } catch (...) {
        return false;
    }
}

} // namespace gemini
