#include "APIClient.h"
#include <iostream>
#include <sstream>

namespace gemini {

// GenerationConfig JSON serialization
nlohmann::json GenerationConfig::toJson() const {
    nlohmann::json j;
    if (temperature.has_value()) {
        j["temperature"] = *temperature;
    }
    if (topP.has_value()) {
        j["topP"] = *topP;
    }
    if (topK.has_value()) {
        j["topK"] = *topK;
    }
    if (maxOutputTokens.has_value()) {
        j["maxOutputTokens"] = *maxOutputTokens;
    }
    return j;
}

// CurlGlobalInit RAII singleton
CurlGlobalInit& CurlGlobalInit::instance() {
    static CurlGlobalInit instance;
    return instance;
}

CurlGlobalInit::CurlGlobalInit() {
    curl_global_init(CURL_GLOBAL_DEFAULT);
}

CurlGlobalInit::~CurlGlobalInit() {
    curl_global_cleanup();
}

// APIClient Implementation
APIClient::APIClient(std::string apiKey, std::string modelName, long timeoutSeconds)
    : apiKey_(std::move(apiKey)),
      modelName_(std::move(modelName)),
      timeoutSeconds_(timeoutSeconds) {
    CurlGlobalInit::instance();
    curlHandle_ = curl_easy_init();
    if (!curlHandle_) {
        throw GeminiException("Failed to initialize libcurl handle.");
    }
}

APIClient::~APIClient() {
    if (curlHandle_) {
        curl_easy_cleanup(curlHandle_);
        curlHandle_ = nullptr;
    }
}

APIClient::APIClient(APIClient&& other) noexcept
    : apiKey_(std::move(other.apiKey_)),
      modelName_(std::move(other.modelName_)),
      baseUrl_(std::move(other.baseUrl_)),
      timeoutSeconds_(other.timeoutSeconds_),
      genConfig_(other.genConfig_),
      curlHandle_(other.curlHandle_) {
    other.curlHandle_ = nullptr;
}

APIClient& APIClient::operator=(APIClient&& other) noexcept {
    if (this != &other) {
        if (curlHandle_) {
            curl_easy_cleanup(curlHandle_);
        }
        apiKey_ = std::move(other.apiKey_);
        modelName_ = std::move(other.modelName_);
        baseUrl_ = std::move(other.baseUrl_);
        timeoutSeconds_ = other.timeoutSeconds_;
        genConfig_ = other.genConfig_;
        curlHandle_ = other.curlHandle_;
        other.curlHandle_ = nullptr;
    }
    return *this;
}

void APIClient::setApiKey(std::string_view apiKey) {
    apiKey_ = std::string(apiKey);
}

const std::string& APIClient::getApiKey() const noexcept {
    return apiKey_;
}

bool APIClient::isApiKeyConfigured() const noexcept {
    return !apiKey_.empty();
}

void APIClient::setModel(std::string_view modelName) {
    modelName_ = std::string(modelName);
}

const std::string& APIClient::getModel() const noexcept {
    return modelName_;
}

void APIClient::setTimeout(long timeoutSeconds) noexcept {
    timeoutSeconds_ = timeoutSeconds;
}

long APIClient::getTimeout() const noexcept {
    return timeoutSeconds_;
}

void APIClient::setBaseUrl(std::string_view url) {
    baseUrl_ = std::string(url);
    if (!baseUrl_.empty() && baseUrl_.back() != '/') {
        baseUrl_ += '/';
    }
}

const std::string& APIClient::getBaseUrl() const noexcept {
    return baseUrl_;
}

void APIClient::setGenerationConfig(GenerationConfig config) {
    genConfig_ = config;
}

const GenerationConfig& APIClient::getGenerationConfig() const noexcept {
    return genConfig_;
}

std::string APIClient::buildRequestUrl() const {
    // Standard Gemini v1beta endpoint: {baseUrl}{model}:generateContent?key={apiKey}
    return baseUrl_ + modelName_ + ":generateContent?key=" + apiKey_;
}

size_t APIClient::writeCallback(char* ptr, size_t size, size_t nmemb, void* userdata) {
    size_t totalBytes = size * nmemb;
    auto* buffer = static_cast<std::string*>(userdata);
    buffer->append(ptr, totalBytes);
    return totalBytes;
}

std::string APIClient::executeHttpPost(const std::string& url, const std::string& postBody) {
    if (!curlHandle_) {
        throw GeminiException("Invalid libcurl handle.");
    }

    // Reset curl handle options between requests
    curl_easy_reset(curlHandle_);

    std::string responseBody;
    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Content-Type: application/json; charset=utf-8");
    headers = curl_slist_append(headers, "User-Agent: GeminiTerminalChatbot/1.0 (C++20)");

    // Pass API key in header as well for security/redundancy
    std::string authHeader = "x-goog-api-key: " + apiKey_;
    headers = curl_slist_append(headers, authHeader.c_str());

    curl_easy_setopt(curlHandle_, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curlHandle_, CURLOPT_POST, 1L);
    curl_easy_setopt(curlHandle_, CURLOPT_POSTFIELDS, postBody.c_str());
    curl_easy_setopt(curlHandle_, CURLOPT_POSTFIELDSIZE, static_cast<long>(postBody.size()));
    curl_easy_setopt(curlHandle_, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curlHandle_, CURLOPT_WRITEFUNCTION, writeCallback);
    curl_easy_setopt(curlHandle_, CURLOPT_WRITEDATA, &responseBody);
    curl_easy_setopt(curlHandle_, CURLOPT_TIMEOUT, timeoutSeconds_);
    curl_easy_setopt(curlHandle_, CURLOPT_CONNECTTIMEOUT, 10L);
    curl_easy_setopt(curlHandle_, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(curlHandle_, CURLOPT_SSL_VERIFYPEER, 1L);
    curl_easy_setopt(curlHandle_, CURLOPT_SSL_VERIFYHOST, 2L);
#ifdef _WIN32
    // Use the native Windows certificate store for SSL/TLS verification
    curl_easy_setopt(curlHandle_, CURLOPT_SSL_OPTIONS, CURLSSLOPT_NATIVE_CA);
#endif
    curl_easy_setopt(curlHandle_, CURLOPT_NOSIGNAL, 1L);

    CURLcode res = curl_easy_perform(curlHandle_);
    curl_slist_free_all(headers);

    if (res != CURLE_OK) {
        if (res == CURLE_OPERATION_TIMEDOUT) {
            throw NetworkException(
                "Request timed out after " + std::to_string(timeoutSeconds_) + " seconds.",
                res,
                true,
                url
            );
        }
        throw NetworkException(
            std::string("Network transfer error: ") + curl_easy_strerror(res),
            res,
            false,
            url
        );
    }

    long httpCode = 0;
    curl_easy_getinfo(curlHandle_, CURLINFO_RESPONSE_CODE, &httpCode);

    if (httpCode != 200) {
        handleHttpError(httpCode, responseBody);
    }

    return responseBody;
}

void APIClient::handleHttpError(long httpCode, const std::string& responseBody) const {
    std::string apiStatus = "HTTP_" + std::to_string(httpCode);
    std::string errorMessage;

    try {
        nlohmann::json errJson = nlohmann::json::parse(responseBody);
        if (errJson.contains("error") && errJson["error"].is_object()) {
            const auto& errObj = errJson["error"];
            if (errObj.contains("status") && errObj["status"].is_string()) {
                apiStatus = errObj["status"].get<std::string>();
            }
            if (errObj.contains("message") && errObj["message"].is_string()) {
                errorMessage = errObj["message"].get<std::string>();
            }
        }
    } catch (...) {
        // If error response is not JSON, use the raw response preview
        errorMessage = responseBody.substr(0, 512);
    }

    if (errorMessage.empty()) {
        errorMessage = "Unknown HTTP Error returned by Gemini API.";
    }

    throw ApiException(static_cast<int>(httpCode), apiStatus, errorMessage, responseBody);
}

std::string APIClient::parseModelResponse(const std::string& responseBody) const {
    nlohmann::json j;
    try {
        j = nlohmann::json::parse(responseBody);
    } catch (const nlohmann::json::parse_error& e) {
        throw JsonParseException(
            std::string("Failed to parse Gemini API JSON response: ") + e.what(),
            responseBody,
            e.byte
        );
    }

    // Check for prompt-level block
    if (j.contains("promptFeedback") && j["promptFeedback"].is_object()) {
        const auto& feedback = j["promptFeedback"];
        if (feedback.contains("blockReason") && feedback["blockReason"].is_string()) {
            std::string reason = feedback["blockReason"].get<std::string>();
            throw ApiException(400, "PROMPT_BLOCKED",
                               "Prompt was blocked by Gemini safety filters (Reason: " + reason + ")",
                               responseBody);
        }
    }

    // Inspect candidates
    if (!j.contains("candidates") || !j["candidates"].is_array() || j["candidates"].empty()) {
        throw JsonParseException(
            "Gemini API returned response without 'candidates' array or candidates is empty.",
            responseBody
        );
    }

    const auto& candidate = j["candidates"][0];

    // Check candidate finishReason for issues
    std::string finishReason;
    if (candidate.contains("finishReason") && candidate["finishReason"].is_string()) {
        finishReason = candidate["finishReason"].get<std::string>();
    }

    if (finishReason == "SAFETY") {
        throw ApiException(400, "CONTENT_FILTERED",
                           "Model response was blocked due to safety policies.",
                           responseBody);
    }

    // Extract text from parts
    if (!candidate.contains("content") ||
        !candidate["content"].is_object() ||
        !candidate["content"].contains("parts") ||
        !candidate["content"]["parts"].is_array()) {
        throw JsonParseException(
            "Candidate object missing expected 'content.parts' structure.",
            responseBody
        );
    }

    std::ostringstream resultText;
    for (const auto& part : candidate["content"]["parts"]) {
        if (part.contains("text") && part["text"].is_string()) {
            resultText << part["text"].get<std::string>();
        }
    }

    std::string output = resultText.str();
    if (output.empty() && !finishReason.empty()) {
        output = "[Model completed with status: " + finishReason + "]";
    }

    return output;
}

std::string APIClient::sendChatRequest(const nlohmann::json& payload) {
    if (!isApiKeyConfigured()) {
        throw ConfigurationException(
            "Google Gemini API key is missing. Please set the GEMINI_API_KEY environment variable "
            "or use the /key command."
        );
    }

    nlohmann::json finalPayload = payload;

    // Attach generationConfig if any parameter is configured
    nlohmann::json cfgJson = genConfig_.toJson();
    if (!cfgJson.empty()) {
        finalPayload["generationConfig"] = std::move(cfgJson);
    }

    std::string requestBody = finalPayload.dump();
    std::string url = buildRequestUrl();

    std::string responseBody = executeHttpPost(url, requestBody);
    return parseModelResponse(responseBody);
}

} // namespace gemini
