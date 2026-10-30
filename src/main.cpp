#include "APIClient.h"
#include "ChatContext.h"
#include "ChatEngine.h"
#include <iostream>
#include <cstdlib>
#include <string>
#include <vector>

void printUsage(const char* progName) {
    std::cout << "Usage: " << progName << " [OPTIONS]\n\n"
              << "Options:\n"
              << "  -k, --key <api_key>      Google Gemini API Key (or set GEMINI_API_KEY env var)\n"
              << "  -m, --model <name>       Gemini model name (default: gemini-2.5-flash)\n"
              << "  -s, --system <prompt>    System instruction / persona prompt\n"
              << "  -t, --timeout <seconds>  Network request timeout in seconds (default: 30)\n"
              << "  --max-turns <count>      Maximum conversation turns kept in memory (default: 50)\n"
              << "  -h, --help               Display this help message\n\n"
              << "Example:\n"
              << "  export GEMINI_API_KEY=\"AIzaSy...\"\n"
              << "  " << progName << " --model gemini-2.5-flash\n\n";
}

int main(int argc, char* argv[]) {
    try {
        std::string apiKey;
        std::string model = "gemini-2.5-flash";
        std::string systemPrompt;
        long timeout = 30;
        size_t maxTurns = 50;

        // 1. Check environment variable first
        if (const char* envKey = std::getenv("GEMINI_API_KEY")) {
            apiKey = envKey;
        }

        // 2. Parse command line arguments
        for (int i = 1; i < argc; ++i) {
            std::string arg = argv[i];

            if (arg == "-h" || arg == "--help") {
                printUsage(argv[0]);
                return 0;
            } else if ((arg == "-k" || arg == "--key") && i + 1 < argc) {
                apiKey = argv[++i];
            } else if ((arg == "-m" || arg == "--model") && i + 1 < argc) {
                model = argv[++i];
            } else if ((arg == "-s" || arg == "--system") && i + 1 < argc) {
                systemPrompt = argv[++i];
            } else if ((arg == "-t" || arg == "--timeout") && i + 1 < argc) {
                timeout = std::stol(argv[++i]);
            } else if (arg == "--max-turns" && i + 1 < argc) {
                maxTurns = std::stoul(argv[++i]);
            } else {
                std::cerr << "Unknown or incomplete option: " << arg << "\n";
                printUsage(argv[0]);
                return 1;
            }
        }

        // 3. Prompt user for API key if still missing
        if (apiKey.empty()) {
            std::cout << gemini::style::Yellow
                      << "Notice: GEMINI_API_KEY environment variable not set.\n"
                      << "Please enter your Google Gemini API key: "
                      << gemini::style::Reset;
            std::getline(std::cin, apiKey);

            // Trim whitespace
            size_t first = apiKey.find_first_not_of(" \t\r\n");
            if (first != std::string::npos) {
                size_t last = apiKey.find_last_not_of(" \t\r\n");
                apiKey = apiKey.substr(first, (last - first + 1));
            }
        }

        // 4. Construct components with dependency injection
        auto apiClient = std::make_shared<gemini::APIClient>(apiKey, model, timeout);
        auto context = std::make_shared<gemini::ChatContext>(maxTurns);

        if (!systemPrompt.empty()) {
            context->setSystemInstruction(systemPrompt);
        }

        // 5. Run the chatbot engine
        gemini::ChatEngine engine(apiClient, context);
        engine.run();

        return 0;
    } catch (const std::exception& e) {
        std::cerr << "\nFatal Exception: " << e.what() << std::endl;
        return 1;
    }
}
