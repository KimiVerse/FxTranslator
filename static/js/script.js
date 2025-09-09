document.addEventListener('DOMContentLoaded', function() {
    const API_KEYS_STORAGE_KEY = 'geminiApiKeys';
    const API_KEY_INDEX_KEY = 'apiKeyIndex';
    const DICTIONARY_STORAGE_KEY = 'forexDictionary';
    const CUSTOM_PROMPT_KEY = 'customPrompt';
    const DEFAULT_PROMPT = `**ROLE:** You are a hyper-professional translator specializing in financial and forex trading content.\n\n**TASK:** Translate the provided English SRT subtitle chunk into flawless, professional Persian.\n\n**CRITICAL RULES:**\n1.  **PERSIAN ONLY:** The final output MUST be exclusively in Persian. Do not include any English words or phrases unless they are part of the specialized dictionary.\n2.  **TRANSLITERATE ABBREVIATIONS:** For English abbreviations and acronyms (like FVG, BOS, POI), you MUST transliterate them by spelling them out phonetically in Persian. For example:\n    - "FVG" becomes "اف‌وی‌جی"\n    - "BOS" becomes "بی‌او‌اس"\n    - "SMT" becomes "اس‌ام‌تی"\n    - "M1" becomes "ام یک"\n3.  **NATURAL TONE:** The translation must sound natural and fluid to a professional Persian-speaking trader.\n4.  **DICTIONARY IS KING:** Adhere strictly to the provided specialized dictionary for key terms.\n5.  **NO EXTRA TEXT:** Output ONLY the translated text. Do not add any introductions, explanations, or apologies.\n\n**CONTENT TO TRANSLATE:**\n{chunk}`;
    let translationController;
    const showAlert = (message, type = 'info', areaId = 'status-area') => {
        const statusArea = document.getElementById(areaId);
        if (statusArea) statusArea.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
    };
    const apiKeyList = document.getElementById('api-key-list');
    const newApiKeyInput = document.getElementById('new-api-key-input');
    const addApiKeyBtn = document.getElementById('add-api-key-btn');
    const getApiKeys = () => JSON.parse(localStorage.getItem(API_KEYS_STORAGE_KEY)) || [];
    const saveApiKeys = (keys) => localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
    const renderApiKeys = () => {
        if (!apiKeyList) return;
        apiKeyList.innerHTML = '';
        const keys = getApiKeys();
        if (keys.length === 0) {
            apiKeyList.innerHTML = '<li class="list-group-item text-muted small">No API keys added.</li>';
        } else {
            keys.forEach((key, index) => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                const obfuscatedKey = key.substring(0, 4) + '...' + key.substring(key.length - 4);
                li.innerHTML = `<span class="api-key-item-text">${obfuscatedKey}</span><button class="btn-icon delete-api-key-btn" data-index="${index}" title="Delete Key"><i class="bi bi-trash3-fill"></i></button>`;
                apiKeyList.appendChild(li);
            });
        }
    };
    const addApiKey = () => {
        const newKey = newApiKeyInput.value.trim();
        if (newKey) {
            const keys = getApiKeys();
            if (!keys.includes(newKey)) {
                keys.push(newKey);
                saveApiKeys(keys);
                renderApiKeys();
            }
            newApiKeyInput.value = '';
        }
    };
    const deleteApiKey = (index) => {
        let keys = getApiKeys();
        keys.splice(index, 1);
        saveApiKeys(keys);
        renderApiKeys();
    };
    const getNextApiKey = () => {
        const keys = getApiKeys();
        if (keys.length === 0) return null;
        let currentIndex = parseInt(localStorage.getItem(API_KEY_INDEX_KEY)) || 0;
        if (currentIndex >= keys.length) currentIndex = 0;
        const keyToUse = keys[currentIndex];
        localStorage.setItem(API_KEY_INDEX_KEY, (currentIndex + 1) % keys.length);
        console.log(`Using API Key index: ${currentIndex}`);
        return keyToUse;
    };
    if (addApiKeyBtn) {
        addApiKeyBtn.addEventListener('click', addApiKey);
        newApiKeyInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addApiKey(); });
        apiKeyList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-api-key-btn');
            if (deleteBtn) deleteApiKey(deleteBtn.dataset.index);
        });
        renderApiKeys();
    }
    if (document.getElementById('settings-form')) {
        const settingsForm = document.getElementById('settings-form');
        const promptTextarea = document.getElementById('custom-prompt');
        const loadSettings = () => {
            const savedPrompt = localStorage.getItem(CUSTOM_PROMPT_KEY);
            promptTextarea.value = savedPrompt || DEFAULT_PROMPT;
        };
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            localStorage.setItem(CUSTOM_PROMPT_KEY, promptTextarea.value);
            showAlert('Settings saved successfully to your browser!', 'success');
        });
        loadSettings();
    }
    if (document.getElementById('upload-form')) {
        const uploadForm = document.getElementById('upload-form'), srtFileInput = document.getElementById('srt-file'), fileNameDisplay = document.getElementById('file-name-display'), translationLog = document.getElementById('translation-log'), logSection = document.getElementById('translation-log-section'), forceStopBtn = document.getElementById('force-stop-btn'), finalResultSection = document.getElementById('final-result-section');
        let fullOriginalText = '', fullTranslatedText = '';
        srtFileInput.addEventListener('change', () => { fileNameDisplay.textContent = srtFileInput.files.length > 0 ? srtFileInput.files[0].name : 'No file chosen'; });
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (getApiKeys().length === 0) { showAlert('Please add at least one Gemini API Key in the sidebar.', 'danger'); return; }
            translationController = new AbortController();
            forceStopBtn.style.display = 'block'; logSection.style.display = 'block'; finalResultSection.style.display = 'none';
            translationLog.innerHTML = ''; fullOriginalText = ''; fullTranslatedText = '';
            showAlert('Connecting to stream...', 'info');
            const formData = new FormData(uploadForm);
            formData.append('api_key', getNextApiKey());
            formData.append('custom_prompt', localStorage.getItem(CUSTOM_PROMPT_KEY) || DEFAULT_PROMPT);
            fetch('/api/translate', { method: 'POST', body: formData, signal: translationController.signal })
                .then(response => {
                    if (!response.ok) return response.json().then(err => { throw new Error(err.message); });
                    showAlert('Connection successful. Receiving translation data...', 'success');
                    const reader = response.body.getReader(), decoder = new TextDecoder();
                    const processStream = () => {
                        reader.read().then(({ done, value }) => {
                            if (done) return;
                            const chunk = decoder.decode(value, { stream: true });
                            chunk.split('\n\n').forEach(event => {
                                if (event.startsWith('data: ')) {
                                    const jsonData = event.substring(6);
                                    if (jsonData) try { handleStreamUpdate(JSON.parse(jsonData)); } catch (err) {}
                                }
                            });
                            processStream();
                        }).catch(err => { if (err.name !== 'AbortError') showAlert(`Stream error: ${err.message}`, 'danger'); });
                    };
                    processStream();
                })
                .catch(err => { if (err.name === 'AbortError') showAlert('Translation stopped by user.', 'warning'); else showAlert(`Failed to start translation: ${err.message}`, 'danger'); })
                .finally(() => forceStopBtn.style.display = 'none');
        });
        forceStopBtn.addEventListener('click', () => { if (translationController) translationController.abort(); });
        const handleStreamUpdate = (data) => {
            if (data.type === 'progress') {
                const logEntryHtml = `<div class="log-entry" id="log-entry-${data.number}"><div class="log-header"><span>${data.number} | ${data.timestamp}</span><div class="log-actions btn-group"><button class="btn btn-sm btn-outline-warning retry-btn" data-number="${data.number}"><i class="bi bi-arrow-clockwise"></i> Retry</button><button class="btn btn-sm btn-outline-primary edit-btn" data-number="${data.number}"><i class="bi bi-pencil-fill"></i> Edit</button></div></div><div class="log-content"><div class="log-original" data-original-text="${data.original_text.replace(/"/g, '&quot;')}"><p>${data.original_text}</p></div><div class="log-translated persian" id="translated-content-${data.number}"><p class="view-mode">${data.translated_text}</p><div class="edit-mode" style="display: none;"><textarea class="form-control form-control-sm">${data.translated_text}</textarea><div class="mt-2 text-end"><button class="btn btn-sm btn-secondary cancel-edit-btn">Cancel</button><button class="btn btn-sm btn-success save-edit-btn">Save</button></div></div></div></div></div>`;
                translationLog.insertAdjacentHTML('beforeend', logEntryHtml);
                translationLog.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else if (data.type === 'done') {
                // ... (This logic will be filled after the translation log is built)
            } else if (data.type === 'error') {
                let friendlyMessage = data.message;
                if (data.message.includes('429') || data.message.toLowerCase().includes('quota')) friendlyMessage = 'API Key has exceeded its usage quota. Translation stopped. Please try another key.';
                showAlert(`❌ Stream Error: ${friendlyMessage}`, 'danger');
                if (translationController) translationController.abort();
            }
        };
        translationLog.addEventListener('click', async (e) => {
            const target = e.target, logContent = target.closest('.log-translated');
            if (!logContent && !target.closest('.retry-btn')) return;
            if (target.closest('.edit-btn')) { logContent.querySelector('.view-mode').style.display = 'none'; logContent.querySelector('.edit-mode').style.display = 'block'; }
            else if (target.closest('.cancel-edit-btn')) { logContent.querySelector('.view-mode').style.display = 'block'; logContent.querySelector('.edit-mode').style.display = 'none'; }
            else if (target.closest('.save-edit-btn')) { logContent.querySelector('.view-mode').textContent = logContent.querySelector('textarea').value; logContent.querySelector('.view-mode').style.display = 'block'; logContent.querySelector('.edit-mode').style.display = 'none'; }
            else if (target.closest('.retry-btn')) {
                const btn = target.closest('.retry-btn'), number = btn.dataset.number, logEntry = document.getElementById(`log-entry-${number}`), originalText = logEntry.querySelector('.log-original').dataset.originalText, modelToUse = document.getElementById('model-name').value, apiKeyToUse = getNextApiKey();
                if (!apiKeyToUse) { showAlert('No API Key available for retry.', 'danger'); return; }
                btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'; btn.disabled = true;
                try {
                    const response = await fetch('/api/retry-chunk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: apiKeyToUse, model_name: modelToUse, original_text: originalText, custom_prompt: localStorage.getItem(CUSTOM_PROMPT_KEY) || DEFAULT_PROMPT }) });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message || 'Retry request failed');
                    const translatedContent = document.getElementById(`translated-content-${number}`);
                    translatedContent.querySelector('.view-mode').textContent = result.translated_text;
                    translatedContent.querySelector('textarea').value = result.translated_text;
                } catch (err) { showAlert(`Retry failed: ${err.message}`, 'danger'); }
                finally { btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Retry'; btn.disabled = false; }
            }
        });
    }
    if (document.getElementById('dictionary-table')) {
        const dictionaryTableBody = document.querySelector('#dictionary-table tbody');
        const toggleEditMode = (row, isEditing) => { row.querySelectorAll('.view-mode').forEach(el => el.style.display = isEditing ? 'none' : ''); row.querySelectorAll('.edit-mode').forEach(el => el.style.display = isEditing ? '' : 'none'); };
        const createRow = (key = '', value = '') => {
            const row = document.createElement('tr');
            row.innerHTML = `<td><span class="view-mode">${key}</span><input type="text" class="form-control form-control-sm edit-mode" value="${key}" style="display:none;"></td><td><span class="view-mode">${value}</span><input type="text" class="form-control form-control-sm edit-mode" value="${value}" style="display:none;"></td><td class="actions-cell"><div class="view-mode"><button class="action-btn edit-btn" title="Edit"><i class="bi bi-pencil-square"></i></button><button class="action-btn remove-btn" title="Delete"><i class="bi bi-trash3-fill"></i></button></div><div class="edit-mode" style="display:none;"><button class="action-btn save-btn" title="Save"><i class="bi bi-check-lg"></i></button><button class="action-btn cancel-btn" title="Cancel"><i class="bi bi-x-lg"></i></button></div></td>`;
            dictionaryTableBody.prepend(row);
        };
        dictionaryTableBody.addEventListener('click', (e) => {
            const row = e.target.closest('tr'); if (!row) return;
            if (e.target.closest('.edit-btn')) toggleEditMode(row, true);
            else if (e.target.closest('.cancel-btn')) { const keySpan = row.querySelector('td:first-child .view-mode'); if (keySpan.textContent === '') row.remove(); else toggleEditMode(row, false); }
            else if (e.target.closest('.save-btn')) { const inputs = row.querySelectorAll('input'), spans = row.querySelectorAll('span'); spans[0].textContent = inputs[0].value; spans[1].textContent = inputs[1].value; toggleEditMode(row, false); }
            else if (e.target.closest('.remove-btn')) row.remove();
        });
        document.getElementById('add-row').addEventListener('click', () => { createRow('', ''); toggleEditMode(dictionaryTableBody.firstElementChild, true); });
        document.getElementById('save-all-changes').addEventListener('click', () => {
            const dictionary = {};
            dictionaryTableBody.querySelectorAll('tr').forEach(row => { const key = row.querySelector('td:nth-child(1) span').textContent.trim(), value = row.querySelector('td:nth-child(2) span').textContent.trim(); if (key) dictionary[key] = value; });
            localStorage.setItem(DICTIONARY_STORAGE_KEY, JSON.stringify(dictionary));
            fetch('/api/dictionary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dictionary) }).then(res => res.json()).then(data => showAlert("Dictionary saved to browser and server!", 'success')).catch(err => showAlert(`Error: ${err.message}`, 'danger'));
        });
        const loadDictionary = async () => {
            let dataToLoad = JSON.parse(localStorage.getItem(DICTIONARY_STORAGE_KEY));
            if (!dataToLoad) {
                try {
                    const response = await fetch('/api/dictionary');
                    dataToLoad = await response.json();
                    localStorage.setItem(DICTIONARY_STORAGE_KEY, JSON.stringify(dataToLoad));
                } catch (err) { showAlert('Could not load default dictionary.', 'danger'); return; }
            }
            dictionaryTableBody.innerHTML = '';
            const entries = Object.entries(dataToLoad).reverse();
            for (const [key, value] of entries) createRow(key, value);
        };
        loadDictionary();
    }
});