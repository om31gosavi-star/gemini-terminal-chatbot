cmake_minimum_required(VERSION 3.20)
project(GeminiChatbot VERSION 1.0.0 LANGUAGES CXX)

# Enforce C++20 standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Enable compiler warnings for code quality
if(MSVC)
    add_compile_options(/W4 /EHsc /utf-8)
else()
    add_compile_options(-Wall -Wextra -Wpedantic -Wconversion -Wsign-conversion)
endif()

# Find libcurl (required)
find_package(CURL REQUIRED)

# Find or fetch nlohmann/json
find_package(nlohmann_json 3.10 QUIET)
if(NOT nlohmann_json_FOUND)
    message(STATUS "nlohmann_json not found locally. Fetching via FetchContent...")
    include(FetchContent)
    FetchContent_Declare(
        nlohmann_json
        GIT_REPOSITORY https://github.com/nlohmann/json.git
        GIT_TAG v3.12.0
    )
    FetchContent_MakeAvailable(nlohmann_json)
endif()

# Source files
set(SOURCES
    src/main.cpp
    src/APIClient.cpp
    src/ChatContext.cpp
    src/ChatEngine.cpp
)

set(HEADERS
    include/Exceptions.h
    include/APIClient.h
    include/ChatContext.h
    include/ChatEngine.h
)

# Executable target
add_executable(gemini_chat ${SOURCES} ${HEADERS})

target_include_directories(gemini_chat PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_link_libraries(gemini_chat PRIVATE
    CURL::libcurl
    nlohmann_json::nlohmann_json
)

# Set output directory
set_target_properties(gemini_chat PROPERTIES
    OUTPUT_NAME "gemini_chat"
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
)

# Installation target
install(TARGETS gemini_chat DESTINATION bin)
