from flask import Flask, render_template, request, jsonify, Response, send_from_directory
import os
import json
from werkzeug.utils import secure_filename
from translator import perform_translation_stream, translate_single_chunk

app = Flask(__name__)

# --- Configuration ---
UPLOAD_DIR = "uploads"
TRANSLATION_DIR = "translations"
DICTIONARY_FILE = "dictionary.json"
app.config['UPLOAD_FOLDER'] = UPLOAD_DIR
app.config['TRANSLATION_FOLDER'] = TRANSLATION_DIR

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(TRANSLATION_DIR, exist_ok=True)


# --- Page Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dictionary')
def dictionary_page():
    return render_template('dictionary.html')

@app.route('/settings')
def settings_page():
    return render_template('settings.html')


# --- API Routes ---
@app.route('/api/dictionary', methods=['GET', 'POST'])
def handle_dictionary():
    if request.method == 'GET':
        with open(DICTIONARY_FILE, 'r', encoding='utf-8') as f:
            return jsonify(json.load(f))
    if request.method == 'POST':
        data = request.json
        with open(DICTIONARY_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        return jsonify(success=True, message="Dictionary saved to server!")

@app.route('/api/translate', methods=['POST'])
def translate_file():
    api_key = request.form.get('api_key')
    model_name = request.form.get('model_name')
    custom_prompt = request.form.get('custom_prompt')
    file = request.files.get('file')

    if not api_key or not model_name or not custom_prompt or not file:
        error_event = json.dumps({"type": "error", "message": "Missing required data in request."})
        return Response(f"data: {error_event}\n\n", status=400, mimetype='text/event-stream')

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    def generate_stream():
        for update in perform_translation_stream(filepath, DICTIONARY_FILE, api_key, model_name, custom_prompt):
            yield f"data: {update}\n\n"

    return Response(generate_stream(), mimetype='text/event-stream')

@app.route('/api/retry-chunk', methods=['POST'])
def retry_chunk():
    data = request.json
    api_key = data.get('api_key')
    model_name = data.get('model_name')
    original_text = data.get('original_text')
    custom_prompt = data.get('custom_prompt')

    try:
        with open(DICTIONARY_FILE, 'r', encoding='utf-8') as f:
            dictionary = json.load(f)
        
        translated_text = translate_single_chunk(original_text, api_key, model_name, custom_prompt, dictionary)
        return jsonify(success=True, translated_text=translated_text)
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@app.route('/download/<filename>')
def download(filename):
    return send_from_directory(app.config['TRANSLATION_FOLDER'], filename, as_attachment=True)


if __name__ == '__main__':
    app.run(debug=True)