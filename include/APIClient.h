#pragma once

#include "Exceptions.h"
#include <string>
#include <string_view>
#include <optional>
#include <memory>
#include <curl/curl.h>
#include <nlohmann/json.hpp>

namespace gemini {

/**
 * @brief Configuration parameters for Gemini text generation.
 */
struct GenerationConfig {
    std::optional<float> temperature;
    std::optional<float> topP;
    std::optional<int> topK;
    std::optional<int> maxOutputTokens;

    [[nodiscard]] nlohmann::json toJson() const;
};

/**
 * @brief RAII Manager for curl global initialization.
 */
class CurlGlobalInit {
public:
    static CurlGlobalInit& instance();

    CurlGlobalInit(const CurlGlobalInit&) = delete;
    CurlGlobalInit& operator=(const CurlGlobalInit&) = delete;

private:
    CurlGlobalInit();
    ~CurlGlobalInit();
};

/**
 * @brief Manages HTTP communication with the Google Gemini API via libcurl.
 */
class APIClient {
public:
    /**
     * @brief Constructs an APIClient instance.
     * @param apiKey The Google Gemini API key.
     * @param modelName Model identifier (e.g. "gemini-2.5-flash", "gemini-1.5-pro").
     * @param timeoutSeconds Request timeout in seconds (default 30).
     */
    explicit APIClient(std::string apiKey,
                       std::string modelName = "gemini-2.5-flash",
                       long timeoutSeconds = 30);

    ~APIClient();

    APIClient(const APIClient&) = delete;
    APIClient& operator=(const APIClient&) = delete;
    APIClient(APIClient&&) noexcept;
    APIClient& operator=(APIClient&&) noexcept;

    /**
     * @brief Sends a chat completion request to the Gemini API and returns the generated text.
     * @param payload JSON containing "contents", and optional "system_instruction".
     * @return The extracted text response from the model.
     * @throws NetworkException on timeout, DNS failure, or connection error.
     * @throws ApiException on non-200 HTTP responses (e.g. 400 Invalid Key, 429 Quota).
     * @throws JsonParseException on invalid JSON or unexpected response structure.
     * @throws ConfigurationException if API key is missing.
     */
    [[nodiscard]] std::string sendChatRequest(const nlohmann::json& payload);

    // Getters and Setters
    void setApiKey(std::string_view apiKey);
    [[nodiscard]] const std::string& getApiKey() const noexcept;
    [[nodiscard]] bool isApiKeyConfigured() const noexcept;

    void setModel(std::string_view modelName);
    [[nodiscard]] const std::string& getModel() const noexcept;

    void setTimeout(long timeoutSeconds) noexcept;
    [[nodiscard]] long getTimeout() const noexcept;

    void setBaseUrl(std::string_view url);
    [[nodiscard]] const std::string& getBaseUrl() const noexcept;

    void setGenerationConfig(GenerationConfig config);
    [[nodiscard]] const GenerationConfig& getGenerationConfig() const noexcept;

private:
    [[nodiscard]] std::string buildRequestUrl() const;
    [[nodiscard]] std::string executeHttpPost(const std::string& url, const std::string& postBody);
    [[nodiscard]] std::string parseModelResponse(const std::string& responseBody) const;
    void handleHttpError(long httpCode, const std::string& responseBody) const;

    static size_t writeCallback(char* ptr, size_t size, size_t nmemb, void* userdata);

    std::string apiKey_;
    std::string modelName_;
    std::string baseUrl_{"https://generativelanguage.googleapis.com/v1beta/models/"};
    long timeoutSeconds_{30};
    GenerationConfig genConfig_{};
    CURL* curlHandle_{nullptr};
};

} // namespace gemini
