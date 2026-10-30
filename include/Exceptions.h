#pragma once

#include <stdexcept>
#include <string>
#include <utility>

namespace gemini {

/**
 * @brief Base class for all Gemini chatbot exceptions.
 */
class GeminiException : public std::runtime_error {
public:
    explicit GeminiException(const std::string& message)
        : std::runtime_error(message) {}

    explicit GeminiException(const char* message)
        : std::runtime_error(message) {}

    ~GeminiException() override = default;
};

/**
 * @brief Exception thrown for network-level failures (e.g. libcurl errors, timeouts, connection refused).
 */
class NetworkException : public GeminiException {
public:
    NetworkException(std::string message, long curlCode, bool isTimeout, std::string endpoint = "")
        : GeminiException(std::move(message)),
          curlCode_(curlCode),
          isTimeout_(isTimeout),
          endpoint_(std::move(endpoint)) {}

    [[nodiscard]] long getCurlCode() const noexcept { return curlCode_; }
    [[nodiscard]] bool isTimeout() const noexcept { return isTimeout_; }
    [[nodiscard]] const std::string& getEndpoint() const noexcept { return endpoint_; }

private:
    long curlCode_{0};
    bool isTimeout_{false};
    std::string endpoint_;
};

/**
 * @brief Exception thrown when the Gemini API returns a non-200 HTTP response.
 */
class ApiException : public GeminiException {
public:
    ApiException(int httpStatusCode,
                 std::string apiStatus,
                 std::string message,
                 std::string rawResponseBody = "")
        : GeminiException(buildMessage(httpStatusCode, apiStatus, message)),
          httpStatusCode_(httpStatusCode),
          apiStatus_(std::move(apiStatus)),
          errorMessage_(std::move(message)),
          rawResponseBody_(std::move(rawResponseBody)) {}

    [[nodiscard]] int getHttpStatusCode() const noexcept { return httpStatusCode_; }
    [[nodiscard]] const std::string& getApiStatus() const noexcept { return apiStatus_; }
    [[nodiscard]] const std::string& getErrorMessage() const noexcept { return errorMessage_; }
    [[nodiscard]] const std::string& getRawResponseBody() const noexcept { return rawResponseBody_; }

    /**
     * @brief Checks if the error was caused by an invalid or unauthorized API key.
     */
    [[nodiscard]] bool isInvalidApiKey() const noexcept {
        if (httpStatusCode_ == 400 && apiStatus_ == "INVALID_ARGUMENT") {
            return errorMessage_.find("API key") != std::string::npos ||
                   errorMessage_.find("API_KEY_INVALID") != std::string::npos;
        }
        if (httpStatusCode_ == 401 || httpStatusCode_ == 403) {
            return true;
        }
        return false;
    }

    /**
     * @brief Checks if the error was due to rate limiting (HTTP 429).
     */
    [[nodiscard]] bool isRateLimited() const noexcept {
        return httpStatusCode_ == 429 || apiStatus_ == "RESOURCE_EXHAUSTED";
    }

    /**
     * @brief Checks if the error is a Google server-side error (HTTP 500, 503).
     */
    [[nodiscard]] bool isServerError() const noexcept {
        return httpStatusCode_ >= 500 && httpStatusCode_ < 600;
    }

private:
    static std::string buildMessage(int code, const std::string& status, const std::string& msg) {
        std::string res = "Gemini API Error (HTTP " + std::to_string(code);
        if (!status.empty()) {
            res += " " + status;
        }
        res += "): " + msg;
        return res;
    }

    int httpStatusCode_{0};
    std::string apiStatus_;
    std::string errorMessage_;
    std::string rawResponseBody_;
};

/**
 * @brief Exception thrown when JSON parsing fails or expected JSON schema is violated.
 */
class JsonParseException : public GeminiException {
public:
    JsonParseException(std::string message, std::string rawPayload = "", size_t offset = 0)
        : GeminiException(std::move(message)),
          rawPayload_(std::move(rawPayload)),
          offset_(offset) {}

    [[nodiscard]] const std::string& getRawPayload() const noexcept { return rawPayload_; }
    [[nodiscard]] size_t getOffset() const noexcept { return offset_; }

private:
    std::string rawPayload_;
    size_t offset_{0};
};

/**
 * @brief Exception thrown when application configuration is invalid (e.g. missing API key).
 */
class ConfigurationException : public GeminiException {
public:
    explicit ConfigurationException(const std::string& message)
        : GeminiException(message) {}
};

} // namespace gemini
