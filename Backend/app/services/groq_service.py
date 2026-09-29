import os

import requests

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.3-70b-versatile"


class GroqError(Exception):
    pass


def chat_completion(
    messages: list[dict],
    temperature: float = 0.2,
    max_tokens: int = 800,
    *,
    base_url: str | None = None,
    model: str | None = None,
    api_key: str | None = None,
) -> str:
    """Calls Groq by default. With base_url set, calls that OpenAI-compatible
    server instead (for example a vLLM host serving a company's adapter)."""
    if base_url:
        url = f"{base_url.rstrip('/')}/chat/completions"
        key = api_key
    else:
        url = GROQ_URL
        key = os.getenv("GROQ_API_KEY")
        if not key:
            raise GroqError("GROQ_API_KEY is not set on the server.")

    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"

    try:
        response = requests.post(
            url,
            headers=headers,
            json={
                "model": model or os.getenv("GROQ_MODEL", DEFAULT_MODEL),
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=60,
        )
    except requests.RequestException as exc:
        raise GroqError("Could not reach the language model server.") from exc

    if response.status_code != 200:
        raise GroqError(f"Model server returned {response.status_code}: {response.text[:200]}")

    return response.json()["choices"][0]["message"]["content"]