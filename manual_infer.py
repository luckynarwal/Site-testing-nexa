"""
Manual uncensored LLM router for NexaSocial — explicit backend selection.

No automatic fallback. You choose the backend per request:

    python3 manual_infer.py --backend offline --prompt "..." --model-dir ./models/Dolphin-Qwen-3B --quantize 4bit
    python3 manual_infer.py --backend venice --prompt "..."
    python3 manual_infer.py --backend openrouter --prompt "..."

Cloud endpoints are OpenAI-compatible. Set API keys as environment variables:
    export VENICE_API_KEY="***"
    export OPENROUTER_API_KEY="your_o..._key"
"""

import argparse
import os
import sys


# ─── Configuration ──────────────────────────────────────────────────────────
DEFAULT_OFFLINE_DIR = os.path.join(os.path.dirname(__file__), "models", "Dolphin-Qwen-3B")

VENICE_BASE_URL = "https://api.venice.ai/api/v1"
VENICE_MODEL = "deepseek-v4-1-flash-1017-uncensored"

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL = "cognitivecomputations/dolphin-mistral-24b-venice-edition:free"

MAX_NEW_TOKENS = 150
TEMPERATURE = 0.7
TOP_P = 0.9


# ─── Offline (local RTX 3050) ───────────────────────────────────────────────
def offline_generate(prompt: str, model_dir: str, quantize: str = "4bit") -> str:
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM, GenerationConfig, BitsAndBytesConfig

    if not os.path.isdir(model_dir):
        raise FileNotFoundError(f"Model directory not found: {model_dir}")

    print(f"[OFFLINE] loading {model_dir} (quantize={quantize}) ...")
    tokenizer = AutoTokenizer.from_pretrained(
        model_dir, local_files_only=True, trust_remote_code=False
    )

    bnb_config = None
    if quantize == "4bit":
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )
    elif quantize == "8bit":
        bnb_config = BitsAndBytesConfig(load_in_8bit=True)

    model = AutoModelForCausalLM.from_pretrained(
        model_dir,
        local_files_only=True,
        trust_remote_code=False,
        quantization_config=bnb_config,
        torch_dtype=torch.float16,
        device_map="auto" if quantize in ("4bit", "8bit") else None,
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


# ─── Cloud: Venice ──────────────────────────────────────────────────────────
def venice_generate(prompt: str) -> str:
    from openai import OpenAI

    api_key = os.getenv("VENICE_API_KEY")
    if not api_key:
        raise RuntimeError("VENICE_API_KEY not set — get it from https://venice.ai")

    client = OpenAI(base_url=VENICE_BASE_URL, api_key=api_key)
    resp = client.chat.completions.create(
        model=VENICE_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=TEMPERATURE,
        max_tokens=MAX_NEW_TOKENS,
    )
    return resp.choices[0].message.content


# ─── Cloud: OpenRouter ─────────────────────────────────────────────────────
def openrouter_generate(prompt: str) -> str:
    from openai import OpenAI

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY not set — get it from https://openrouter.ai/keys")

    client = OpenAI(base_url=OPENROUTER_BASE_URL, api_key=api_key)
    resp = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=TEMPERATURE,
        max_tokens=MAX_NEW_TOKENS,
    )
    return resp.choices[0].message.content


# ─── Main ───────────────────────────────────────────────────────────────────
def main():
    global MAX_NEW_TOKENS, TEMPERATURE, TOP_P

    parser = argparse.ArgumentParser(description="Manual uncensored LLM router (no auto fallback)")
    parser.add_argument("--backend", required=True, choices=["offline", "venice", "openrouter"],
                        help="Which backend to use: offline (local GPU), venice (cloud), openrouter (cloud)")
    parser.add_argument("--prompt", required=True, help="Text prompt to generate from")
    parser.add_argument("--model-dir", default=DEFAULT_OFFLINE_DIR,
                        help="Path to local model directory (offline backend only)")
    parser.add_argument("--quantize", default="4bit",
                        choices=["none", "4bit", "8bit"],
                        help="Quantization for offline backend (default: 4bit)")
    parser.add_argument("--max-new-tokens", type=int, default=MAX_NEW_TOKENS)
    parser.add_argument("--temperature", type=float, default=TEMPERATURE)
    parser.add_argument("--top-p", type=float, default=TOP_P)
    args = parser.parse_args()

    MAX_NEW_TOKENS = args.max_new_tokens
    TEMPERATURE = args.temperature
    TOP_P = args.top_p

    backends = {
        "offline": lambda: offline_generate(args.prompt, args.model_dir, args.quantize),
        "venice": lambda: venice_generate(args.prompt),
        "openrouter": lambda: openrouter_generate(args.prompt),
    }

    print(f"[MANUAL] using backend: {args.backend}")
    print(f"[MANUAL] prompt: {args.prompt[:80]}...\n")

    try:
        result = backends[args.backend]()
        print("\n--- Result ---")
        print(result)
    except Exception as e:
        print(f"\nERROR ({args.backend}): {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
