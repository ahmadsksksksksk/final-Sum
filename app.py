import os
from flask import Flask, request, jsonify
from transformers import PegasusTokenizer, PegasusForConditionalGeneration
from rouge_score import rouge_scorer
import torch
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://yourautosummarize.web.app", "https://yourautosummarize.firebaseapp.com"])

# Load model dengan error handling
try:
    tokenizer = PegasusTokenizer.from_pretrained("google/pegasus-cnn_dailymail")
    model = PegasusForConditionalGeneration.from_pretrained("google/pegasus-cnn_dailymail")
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    tokenizer = None
    model = None

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Backend is running!", "model_loaded": model is not None})

@app.route("/summarize", methods=["POST"])
def summarize():
    if not model or not tokenizer:
        return jsonify({"summary": "❌ Model tidak tersedia. Coba lagi nanti."})
    
    data = request.get_json()
    text = data.get("text", "")
    reference = data.get("reference", "")
    min_length = int(data.get("min_length", 60))
    max_length = int(data.get("max_length", 120))

    if not text.strip():
        return jsonify({"summary": "⚠️ Teks tidak boleh kosong."})

    if len(text.split()) < 20:
        return jsonify({"summary": "⚠️ Masukkan minimal 20 kata untuk dirangkum."})

    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding="longest", max_length=1024)
        summary_ids = model.generate(
            inputs["input_ids"],
            max_length=max_length,
            min_length=min_length,
            num_beams=5,
            early_stopping=True
        )
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

        # Hitung ROUGE jika referensi tersedia
        if reference.strip():
            scorer = rouge_scorer.RougeScorer(['rouge1', 'rougeL'], use_stemmer=True)
            scores = scorer.score(reference, summary)
            rouge1 = round(scores['rouge1'].fmeasure * 100, 2)
            rougeL = round(scores['rougeL'].fmeasure * 100, 2)
            return jsonify({
                "summary": summary,
                "rouge1": rouge1,
                "rougeL": rougeL
            })

        return jsonify({"summary": summary})
    
    except Exception as e:
        return jsonify({"summary": f"❌ Error: {str(e)}"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)