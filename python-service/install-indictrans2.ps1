# Run from the python-service directory in PowerShell.
# This creates a local virtual environment and installs CPU-only IndicTrans2 dependencies.
$ErrorActionPreference = "Stop"

if (-not (Test-Path ".venv")) {
    py -3.11 -m venv .venv
}
. .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip

# CPU-only PyTorch: no CUDA/GPU is required.
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu

# Install FastAPI plus IndicTrans2 dependencies.
python -m pip install -r requirements.txt

Write-Host ""
Write-Host "Installation complete. The IndicTrans2 model downloads on its first translation request."
Write-Host "Start the service with: python -m uvicorn app:app --host 127.0.0.1 --port 8001"
