## 🧠 Fashion Icon Assistant — Setup Guide

Welcome to the **Fashion Icon Assistant** setup guide!
This document walks you through everything you need to install, configure, and run the project locally.
If this does not work, we do have proof of our AI working.
---

### ⚙️ Prerequisites

Make sure you have the following installed on your system:

* 🐍 **Python 3.9+**
* 🧰 **pip** (Python package manager)
* 💻 **Node.js & npm** *(only if you’re running a frontend later)*
* 🌐 **Git**
* 🧠 (Optional) **MemMachine account or workspace access**

---

### 📦 1. Clone the Repository

Open your terminal or PowerShell and run:

```bash
git clone https://github.com/yourusername/FashionIcon-Assistant.git
cd FashionIcon-Assistant/Backend-FashionIcon
```

---

### 🧩 2. Set Up a Virtual Environment

Create and activate a virtual environment (recommended for Python projects):

**Windows (PowerShell):**

```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

---

### 📚 3. Install Dependencies

Make sure you have a `requirements.txt` file in your backend directory.
Then install everything with:

```bash
pip install -r requirements.txt
```

If you don’t have one yet, create it with:

```bash
fastapi
uvicorn
pydantic
python-dotenv
```

Then install:

```bash
pip install fastapi uvicorn pydantic python-dotenv
```

---

### 🔑 4. Set Up Your OpenAI API Key

You’ll need an OpenAI API key for AI responses.

**Windows (PowerShell):**

```bash
setx OPENAI_API_KEY "your_api_key_here"
```

**macOS/Linux (bash/zsh):**

```bash
export OPENAI_API_KEY="your_api_key_here"
```

---

### 🚀 5. Run the Backend Server

Make sure you’re in the backend directory (where `app.py` is), then run:

```bash
uvicorn app:app --reload
```

You should see something like:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Now open your browser and visit:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

### 🧭 6. Test the API

Go to your browser and visit:
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

You’ll see the **interactive FastAPI Swagger UI**, where you can:

* Test the `/generate-outfit` POST request
* Input `event`, `weather`, and `mood`
* See the outfit response instantly 🎀

---

### 🧠 7. (Optional) Integrate with MemMachine

If you’re using **MemMachine**:

* Upload this backend into your MemMachine workspace
* Link your **profile memory** or **REST API** to enable personalized recommendations
* You can modify your query constructors (like `fashion_query_constructor.py`) to connect with user memory

---

### 🎉 You’re Done!

You now have the **Fashion Icon Assistant** running locally!
Try sending different inputs and see how your AI fashion stylist responds 💅

---

### 🧰 Troubleshooting

| Issue                                            | Solution                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| `ModuleNotFoundError: No module named 'fastapi'` | Run `pip install fastapi uvicorn pydantic`                           |
| `uvicorn not recognized`                         | Run `pip install uvicorn` or activate your venv                      |
| API key not found                                | Ensure your environment variable is correctly set                    |
| Wrong directory                                  | `cd` into the folder that contains `app.py` before running `uvicorn` |

