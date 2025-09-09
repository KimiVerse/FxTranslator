# FxTranslator 

![Translator UI](https://i.imgur.com/gK90cGr.png)

A professional, web-based tool for translating forex-related SRT subtitle files using the Google Gemini API. This application is built with a real-time streaming interface, an interactive and editable dictionary, multi-API key support to handle rate limits, and a fully customizable AI prompt system.

---

## ✨ Key Features

-   **Real-time Translation Stream:** Watch subtitles get translated one-by-one in a clean, interactive log.
-   **Interactive UI:** Edit translations directly in the log or re-translate a single subtitle with the "Retry" button if you're not satisfied.
-   **Multi-API Key Pool:** Add multiple Gemini API keys. The application automatically rotates through them to avoid rate-limit errors during large translations.
-   **Customizable AI Prompt:** A dedicated settings page allows you to fine-tune the master prompt sent to the AI, giving you ultimate control over the translation style and rules.
-   **Fully Editable Dictionary:** Manage a specialized dictionary of terms. Add, edit, and delete entries through a clean and modern interface.
-   **User-Centric Design:** All settings (API keys, custom prompt, dictionary changes) are saved in your browser's local storage for convenience.
-   **Modern & Professional UI:** A polished, dark-themed interface built for a great user experience.
-   **Force Stop:** Immediately interrupt a translation in progress with a prominent "Force Stop" button.

---

## 🛠️ Tech Stack

-   **Backend:** Flask, Gunicorn
-   **Frontend:** HTML5, CSS3, JavaScript, Bootstrap 5
-   **AI Engine:** Google Gemini API
-   **Deployment:** Nginx, Ubuntu 22.04, systemd, Certbot (Let's Encrypt)

---

## 🚀 Getting Started (Local Setup)

To run FxTranslator on your own machine, follow these steps.

### Prerequisites

-   Python 3.8+
-   Git

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YourUsername/FxTranslator.git
    cd FxTranslator
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    .\venv\Scripts\Activate
    ```

3.  **Install the required dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Flask application:**
    ```bash
    python app.py
    ```

5.  **Access the application:**
    Open your web browser and navigate to `http://127.0.0.1:5000`.

### Configuration

-   **Gemini API Keys:** Add your API keys via the UI in the sidebar. They will be saved securely in your browser.
-   **Custom Prompt:** Navigate to the "Settings" page to view and modify the AI prompt. Your changes are saved automatically.

---

##  memorials

RIP Mahdi 🖤

## 📧 Contact

-   **Telegram:** [@amirmasoud_rsli](https://t.me/amirmasoud_rsli)
-   **GitHub:** [@KimiVerse](https://github.com/KimiVerse)
-   **YouTube:** [@CyberSeismic](https://www.youtube.com/@CyberSeismic)