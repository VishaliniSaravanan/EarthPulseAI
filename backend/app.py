import os
import re
import traceback

import fitz
from flask import Flask, jsonify, request
from flask_cors import CORS

from discourse_graph import build_discourse_graph, get_discourse_export
from esg_metrics import extract_all

app = Flask(__name__)
CORS(app)

MAX_FILE_SIZE_MB = 50
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE_MB * 1024 * 1024

ESG_KEYWORDS = (
    "scope", "emissions", "carbon", "ghg", "greenhouse", "sustainability",
    "esg", "environmental", "social", "governance", "climate", "renewable",
    "energy", "waste", "water", "biodiversity", "net zero", "disclosure",
    "diversity", "safety", "co2", "pollution",
)


def extract_pdf_text(file_bytes):
    document = fitz.open(stream=file_bytes, filetype="pdf")
    try:
        pages = [page.get_text("text") for page in document]
        return "\n".join(pages), len(pages)
    finally:
        document.close()


def friendly_name(filename):
    name = os.path.splitext(filename)[0]
    return re.sub(r"\s+", " ", re.sub(r"[_-]+", " ", name)).strip() or "Uploaded report"


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/analyze")
def analyze():
    uploaded_file = request.files.get("file")
    if uploaded_file is None or not uploaded_file.filename:
        return jsonify({"error": "Choose a PDF report to upload."}), 400
    if not uploaded_file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF reports are supported."}), 415

    file_bytes = uploaded_file.read()
    if not file_bytes:
        return jsonify({"error": "The uploaded PDF is empty."}), 400
    if len(file_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        return jsonify({"error": f"PDF is larger than the {MAX_FILE_SIZE_MB} MB limit."}), 413
    if b"%PDF-" not in file_bytes[:1024]:
        return jsonify({"error": "This file is not a valid PDF."}), 400

    try:
        text, page_count = extract_pdf_text(file_bytes)
        if not text.strip():
            return jsonify({
                "error": "No selectable text was found. Please use a text-based PDF.",
            }), 422

        matched_keywords = [word for word in ESG_KEYWORDS if word in text.lower()]
        if len(matched_keywords) < 3:
            return jsonify({
                "error": "This PDF does not appear to contain an ESG or sustainability report.",
            }), 422

        company = request.form.get("company", "").strip() or friendly_name(uploaded_file.filename)
        metrics = extract_all(text)
        greenwashing = build_discourse_graph(text, company)
        result = {
            "success": True,
            "company": company,
            "file_name": uploaded_file.filename,
            "page_count": page_count,
            "metrics": metrics,
            "greenwashing": greenwashing,
            "graph": get_discourse_export(company),
            "_fullText": text[:500000],
        }
        return jsonify(result)
    except Exception as error:
        traceback.print_exc()
        message = str(error)
        if "password" in message.lower() or "encrypted" in message.lower():
            message = "This PDF is password-protected. Upload an unlocked copy."
        elif "cannot open broken document" in message.lower() or "filedata" in message.lower():
            message = "This PDF is damaged or invalid. Try another file."
        return jsonify({"error": message or "PDF analysis failed."}), 500


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify({"error": f"PDF is larger than the {MAX_FILE_SIZE_MB} MB limit."}), 413


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)), debug=False)
