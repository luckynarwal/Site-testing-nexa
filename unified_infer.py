"""
Unified uncensored LLM router for NexaSocial.

Tries sources in order:
    1. OFFLINE — Dolphin3.0-Qwen2.5-3B on local RTX 3050 (no cost, no limits, private)
    2. VENICE — deepseek-v4-1-flash-1017-uncensored via Venice.ai API (free tier, no card)
    3. OPENROUTER — cognitivecomputations/dolphin-mistral-24b-venice-edition:free (free tier, no card)

All cloud endpoints are OpenAI-compatible, so they share the same call shape.

Setup:
    export VENICE_API_KEY="your_venice_key"      # from https://venice.ai
    export OPENROUTER_API_KEY="your_openrouter_key"  # from https://openrouter.ai/keys

    # Offline model must already be downloaded:
    # huggingface-cli download cognitivecomputations/Dolphin3.0-Qwen2.5-3b \
    #   --local-dir ./models/Dolphin-Qwen-3B --local-dir-use-symlinks False
"""

import os
import sys
from openai import OpenAI


# ─── Configuration ──────────────────────────────────────────────────────────
OFFLINE_MODEL_DIR = os.path.join(os.path.dirname(__file__), "models", "Dolphin-Qwen-3B")

VENICE_BASE_URL = "https://api.venice.ai/api/v1"
VENICE_MODEL = "deepseek-v4-1-flash-1017-uncensored"

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL = "cognitivecomputations/dolphin-mistral-24b-venice-edition:free"

MAX_NEW_TOKENS = 150
TEMPERATURE = 0.7
TOP_P = 0.9


# ─── Offline (local RTX 3050) ───────────────────────────────────────────────
def offline_generate(prompt: str) -> str | None:
    """Run the local Dolphin model via transformers. Returns text or None if unavailable."""
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM, GenerationConfig, BitsAndBytesConfig
    except ImportError:
        print("[OFFLINE] transformers/torch not installed — skipping offline source")
        return None

    if not os.path.isdir(OFFLINE_MODEL_DIR):
        print(f"[OFFLINE] model directory not found: {OFFLINE_MODEL_DIR}")
        return None

    try:
        print("[OFFLINE] loading Dolphin3.0-Qwen2.5-3B (4-bit, local GPU) ...")
        tokenizer = AutoTokenizer.from_pretrained(
            OFFLINE_MODEL_DIR, local_files_only=True, trust_remote_code=False
        )
        bnb = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )
        model = AutoModelForCausalLM.from_pretrained(
            OFFLINE_MODEL_DIR,
            local_files_only=True,
            trust_remote_code=False,
            quantization_config=bnb,
            device_map="auto",
            torch_dtype=torch.float16,
        )
        model.eval()

        inputs = tokenizer(prompt, return_tensors="pt")
        if torch.cuda.is_available():
            inputs = {k: v.to("cuda") for k, v in inputs.items()}

        gen_cfg = GenerationConfig(
            max_new_tokens=MAX_NEW_TOKENS,
            temperature=TEMPERATURE,
            top_p=TOP_P,
            do_sample=True,
            pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )

        with torch.no_grad():
            outputs = model.generate(**inputs, generation_config=gen_cfg)

        input_length = inputs["input_ids"].shape[1]
        new_tokens = outputs[0][input_length:]
        return tokenizer.decode(new_tokens, skip_special_tokens=True)

    except Exception as e:
        print(f"[OFFLINE] failed: {e}")
        return None


# ─── Cloud: Venice ──────────────────────────────────────────────────────────
def venice_generate(prompt: str) -> str | None:
    api_key = os.getenv("VENICE_API_KEY")
    if not api_key:
        print("[VENICE] VENICE_API_KEY not set — skipping")
        return None

    try:
        client = OpenAI(base_url=VENICE_BASE_URL, api_key=api_key)
        resp = client.chat.completions.create(
            model=VENICE_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=TEMPERATURE,
            max_tokens=MAX_NEW_TOKENS,
        )
        return resp.choices[0].message.content
    except Exception as e:
        print(f"[VENICE] failed: {e}")
        return None


# ─── Cloud: OpenRouter ─────────────────────────────────────────────────────
def openrouter_generate(prompt: str) -> str | None:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("[OPENROUTER] OPENROUTER_API_KEY not set — skipping")
        return None

    try:
        client = OpenAI(base_url=OPENROUTER_BASE_URL, api_key=api_key)
        resp = client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=TEMPERATURE,
            max_tokens=MAX_NEW_TOKENS,
        )
        return resp.choices[0].message.content
    except Exception as e:
        print(f"[OPENROUTER] failed: {e}")
        return None


# ─── Router ─────────────────────────────────────────────────────────────────
def generate_uncensored(prompt: str) -> str:
    """Try offline first, then Venice, then OpenRouter. Returns first success."""
    sources = [
        ("OFFLINE", offline_generate),
        ("VENICE", venice_generate),
        ("OPENROUTER", openrouter_generate),
    ]

    for name, fn in sources:
        print(f"[ROUTER] trying {name} ...")
        result = fn(prompt)
        if result:
            print(f"[ROUTER] success via {name}")
            return result
        print(f"[ROUTER] {name} unavailable, falling back...")

    raise RuntimeError("All uncensored sources are unavailable")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 unified_infer.py \"Your prompt here\"")
        sys.exit(1)

    prompt = sys.argv[1]
    print("\n=== Uncensored Router ===\n")
    try:
        output = generate_uncensored(prompt)
        print("\n--- Result ---")
        print(output)
    except RuntimeError as e:
        print(f"\nERROR: {e}")
        sys.exit(1)
