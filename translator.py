import google.generativeai as genai
import os
import time
import json
import re
import google.api_core.exceptions

def split_srt_into_chunks(srt_content):
    return srt_content.strip().split('\n\n')

def parse_srt_block(block):
    pattern = re.compile(r'(\d+)\n([\d:,]+ --> [\d:,]+)\n(.*)', re.DOTALL)
    match = pattern.match(block)
    if match:
        return {"number": match.group(1), "timestamp": match.group(2), "text": match.group(3).strip()}
    return None

def translate_single_chunk(original_text, api_key, model_name, custom_prompt, dictionary):
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    generation_config = {"temperature": 0.2}
    dictionary_prompt_part = f"\n\nCRITICAL: Use this specialized dictionary:\n{json.dumps(dictionary, ensure_ascii=False)}"
    final_prompt = custom_prompt.replace("{chunk}", original_text) + dictionary_prompt_part
    response = model.generate_content(final_prompt, generation_config=generation_config, request_options={'timeout': 300})
    return response.text.strip()

def perform_translation_stream(file_path, dictionary_path, api_key, model_name, custom_prompt):
    try:
        with open(dictionary_path, 'r', encoding='utf-8') as f:
            forex_dictionary = json.load(f)
        with open(file_path, 'r', encoding='utf-8') as f:
            english_srt_content = f.read()

        source_chunks = split_srt_into_chunks(english_srt_content)
        all_translated_blocks = []

        for block in source_chunks:
            parsed_block = parse_srt_block(block)
            if not parsed_block: continue

            original_text = parsed_block["text"]
            translated_text = translate_single_chunk(original_text, api_key, model_name, custom_prompt, forex_dictionary)
            
            translated_block_content = f"{parsed_block['number']}\n{parsed_block['timestamp']}\n{translated_text}"
            all_translated_blocks.append(translated_block_content)
            
            yield json.dumps({
                "type": "progress", "number": parsed_block['number'], "timestamp": parsed_block['timestamp'],
                "original_text": original_text, "translated_text": translated_text
            })
            time.sleep(2)

        base_name = os.path.splitext(os.path.basename(file_path))[0]
        output_path = os.path.join("translations", f"{base_name}_fa.srt")
        full_persian_srt = '\n\n'.join(all_translated_blocks)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(full_persian_srt)

        yield json.dumps({"type": "done", "filename": os.path.basename(output_path)})

    except google.api_core.exceptions.PermissionDenied:
        yield json.dumps({"type": "error", "message": "Invalid API Key. Please verify your key and permissions."})
    except Exception as e:
        yield json.dumps({"type": "error", "message": f"An unexpected error occurred: {e}"})