# TravelMate Python Service

A local FastAPI service for the TravelMate tourism assistant. The basic chatbot works without a cloud AI key. Optional offline translation uses AI4Bharat IndicTrans2.

## Requirements

- Windows 10/11
- Python 3.10 or 3.11 recommended
- Internet for initial package/model downloads
- 8 GB RAM: start with the chatbot only; the translation model can be memory-intensive

## Run the chatbot (lightweight, no model download)

From the repository root:

```powershell
cd python-service
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8001
```

Open http://127.0.0.1:8001/docs. Test `POST /chat` with:

```json
{"message":"What tourist places should I visit?","location":"Mysuru"}
```

## Optional: enable offline IndicTrans2

The default model is `ai4bharat/indictrans2-en-indic-dist-200M` (English-to-Indic). It does not handle every language direction in one model. For Kannada output use `kan_Knda`; for Hindi output use `hin_Deva`.

1. Install CPU-only PyTorch using the instructions at https://pytorch.org/get-started/locally/ .
2. Activate the same virtual environment and install:
   ```powershell
   pip install -r requirements-translation.txt
   ```
3. Review the model card and its access/licensing terms: https://huggingface.co/ai4bharat/indictrans2-en-indic-dist-200M
4. Start the service as above. The model is loaded only on the first call to `POST /translate`, so the basic chatbot does not consume model memory.
5. Test:
   ```json
   {"text":"Welcome to Mysuru","source":"eng_Latn","target":"kan_Knda"}
   ```

The first translation request downloads model files and needs internet. Once all required files are cached, local inference can run without a cloud translation API. Do not promise all 22 languages or all language directions from this one model; check the selected model's supported directions and available memory.

## API endpoints

- `GET /` and `GET /health`
- `POST /chat` — body: `{"message":"...","location":"Mysuru"}`
- `POST /translate` — body: `{"text":"...","source":"eng_Latn","target":"kan_Knda"}`

Keep this local service bound to `127.0.0.1` during development. Do not expose it directly to the public internet.
