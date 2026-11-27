"""
Offline Hugging Face model inference script for NexaSocial.
Supports 4-bit / 8-bit quantization for low-VRAM GPUs (RTX 3050 4GB).

Usage:
    python3 hf_offline_infer.py --model-dir ./models/Dolphin-Qwen-3B --prompt "Hello" --quantize 4bit

Prerequisites:
    pip install torch transformers accelerate sentencepiece
    # optional for 4-bit/8-bit:
    pip install bitsandbytes

Offline mode:
    export HF_HUB_OFFLINE=1
    export TRANSFORMERS_OFFLINE=1
"""

import argparse
import os
import sys
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, GenerationConfig, BitsAndBytesConfig


def load_model(model_dir: str, quantize: str = "none", device: str = "auto"):
    """Load tokenizer and model from a local directory (offline)."""
    if not os.path.isdir(model_dir):
        print(f"ERROR: model directory not found: {model_dir}")
        sys.exit(1)

    print(f"Loading tokenizer from {model_dir} ...")
    tokenizer = AutoTokenizer.from_pretrained(
        model_dir,
        local_files_only=True,
        trust_remote_code=False,
    )

    # Determine device
    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device} (CUDA available: {torch.cuda.is_available()})")

    # Quantization config
    bnb_config = None
    if quantize == "4bit" and device == "cuda":
        try:
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
            )
            print("Using 4-bit quantization (NF4) — fits in ~2GB VRAM")
        except Exception as e:
            print(f"4-bit quantization unavailable ({e}), falling back to float16")
            quantize = "none"
    elif quantize == "8bit" and device == "cuda":
        try:
            bnb_config = BitsAndBytesConfig(
                load_in_8bit=True,
            )
            print("Using 8-bit quantization — fits in ~3.5GB VRAM")
        except Exception as e:
            print(f"8-bit quantization unavailable ({e}), falling back to float16")
            quantize = "none"

    dtype = torch.float16 if device == "cuda" else torch.float32

    print(f"Loading model from {model_dir} ...")
    model = AutoModelForCausalLM.from_pretrained(
        model_dir,
        local_files_only=True,
        trust_remote_code=False,
        quantization_config=bnb_config,
        torch_dtype=dtype,
        device_map="auto" if (device == "cuda" and quantize in ("4bit", "8bit")) else None,
    )

    if device == "cpu" or quantize == "none":
        model.to(device)

    model.eval()
    return tokenizer, model


def generate(tokenizer, model, prompt: str, max_new_tokens: int = 100,
             temperature: float = 0.7, top_p: float = 0.9):
    """Generate text from a prompt."""
    inputs = tokenizer(prompt, return_tensors="pt")
    if torch.cuda.is_available():
        inputs = {k: v.to("cuda") for k, v in inputs.items()}

    gen_config = GenerationConfig(
        max_new_tokens=max_new_tokens,
        temperature=temperature,
        top_p=top_p,
        do_sample=True,
        pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
        eos_token_id=tokenizer.eos_token_id,
    )

    with torch.no_grad():
        outputs = model.generate(**inputs, generation_config=gen_config)

    # Decode only the new tokens (skip the prompt)
    input_length = inputs["input_ids"].shape[1]
    new_tokens = outputs[0][input_length:]
    return tokenizer.decode(new_tokens, skip_special_tokens=True)


def main():
    parser = argparse.ArgumentParser(description="Offline HF causal LM inference")
    parser.add_argument("--model-dir", required=True, help="Path to local model directory")
    parser.add_argument("--prompt", required=True, help="Text prompt to generate from")
    parser.add_argument("--max-new-tokens", type=int, default=100)
    parser.add_argument("--temperature", type=float, default=0.7)
    parser.add_argument("--top-p", type=float, default=0.9)
    parser.add_argument("--device", default="auto", choices=["auto", "cpu", "cuda"])
    parser.add_argument("--quantize", default="4bit",
                        choices=["none", "4bit", "8bit"],
                        help="Quantization: none, 4bit (NF4, ~2GB VRAM), 8bit (~3.5GB VRAM)")
    args = parser.parse_args()

    # Force offline mode
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

    tokenizer, model = load_model(args.model_dir, quantize=args.quantize, device=args.device)
    result = generate(
        tokenizer, model, args.prompt,
        max_new_tokens=args.max_new_tokens,
        temperature=args.temperature,
        top_p=args.top_p,
    )
    print("\n--- Generated output ---")
    print(result)


if __name__ == "__main__":
    main()
