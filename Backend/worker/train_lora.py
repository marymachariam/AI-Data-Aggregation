"""Aggre8 LoRA training worker.

Polls the Aggre8 API for queued training runs, fine-tunes a LoRA adapter on the
company's dataset, and reports the result. Needs a CUDA GPU with bfloat16.

    pip install torch transformers peft accelerate requests
    export AGGRE8_API_URL=https://your-api-host
    export TRAINING_WORKER_KEY=same-value-as-the-server
    python train_lora.py          # keep polling
    python train_lora.py --once   # take one job, then exit
"""
import argparse
import json
import os
import sys
import time

import requests

API_URL = os.environ.get("AGGRE8_API_URL", "http://127.0.0.1:8000").rstrip("/")
WORKER_KEY = os.environ.get("TRAINING_WORKER_KEY", "")
MAX_LENGTH = int(os.environ.get("TRAIN_MAX_LENGTH", "1024"))
EPOCHS = float(os.environ.get("TRAIN_EPOCHS", "3"))
OUTPUT_ROOT = os.environ.get("TRAIN_OUTPUT_DIR", "adapters")
HEADERS = {"X-Worker-Key": WORKER_KEY}


def fetch_job():
    response = requests.get(f"{API_URL}/training/worker/next", headers=HEADERS, timeout=120)
    response.raise_for_status()
    return response.json().get("run")


def report(run_id, status, adapter_path=None, message=None):
    requests.post(
        f"{API_URL}/training/worker/{run_id}/complete",
        headers=HEADERS,
        json={"status": status, "adapter_path": adapter_path, "message": message},
        timeout=60,
    ).raise_for_status()


def train(job):
    import torch
    from peft import LoraConfig, get_peft_model
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        DataCollatorForSeq2Seq,
        Trainer,
        TrainingArguments,
    )

    if not torch.cuda.is_available():
        raise RuntimeError("No CUDA GPU found. Run this worker on a machine with a GPU.")
    if not torch.cuda.is_bf16_supported():
        raise RuntimeError("This GPU has no bfloat16 support. Use an Ampere-or-newer GPU.")

    base_model = job["base_model"]
    tokenizer = AutoTokenizer.from_pretrained(base_model)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    def encode(row):
        messages = row["messages"]
        prompt_text = tokenizer.apply_chat_template(messages[:-1], add_generation_prompt=True, tokenize=False)
        prompt_ids = tokenizer(prompt_text, add_special_tokens=False)["input_ids"]
        answer_ids = tokenizer(messages[-1]["content"] + (tokenizer.eos_token or ""), add_special_tokens=False)["input_ids"]
        input_ids = (prompt_ids + answer_ids)[:MAX_LENGTH]
        labels = ([-100] * len(prompt_ids) + answer_ids)[:MAX_LENGTH]
        return {"input_ids": input_ids, "attention_mask": [1] * len(input_ids), "labels": labels}

    rows = [json.loads(line) for line in job["dataset"].splitlines() if line.strip()]
    dataset = [encode(r) for r in rows]
    dataset = [d for d in dataset if any(label != -100 for label in d["labels"])]
    if len(dataset) < 10:
        raise RuntimeError("Too few usable training examples.")

    model = AutoModelForCausalLM.from_pretrained(base_model, torch_dtype=torch.bfloat16, device_map="auto")
    model = get_peft_model(
        model,
        LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, target_modules="all-linear", task_type="CAUSAL_LM"),
    )

    output_dir = os.path.join(OUTPUT_ROOT, job["id"])
    args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=8,
        learning_rate=2e-4,
        logging_steps=10,
        save_strategy="no",
        report_to="none",
        bf16=True,
        remove_unused_columns=False,
    )
    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=dataset,
        data_collator=DataCollatorForSeq2Seq(tokenizer, padding=True, label_pad_token_id=-100),
    )
    trainer.train()

    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    return os.path.abspath(output_dir)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()

    if not WORKER_KEY:
        sys.exit("Set TRAINING_WORKER_KEY first.")

    while True:
        job = fetch_job()
        if job is None:
            if args.once:
                print("No queued runs.")
                return
            time.sleep(60)
            continue

        print(f"Training run {job['id']} on {job['example_count']} examples…")
        try:
            path = train(job)
            report(job["id"], "completed", adapter_path=path, message=f"Trained on {job['example_count']} examples.")
            print(f"Done. Adapter saved to {path}")
        except Exception as exc:
            report(job["id"], "failed", message=str(exc)[:500])
            print("Failed:", exc)

        if args.once:
            return


if __name__ == "__main__":
    main()