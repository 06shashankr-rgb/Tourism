# IndicTransToolkit is documented as Linux/macOS-only and is not tested on Windows.
# Use this script only as a Windows-side warning; install IndicTrans2 inside WSL2 Ubuntu.
$ErrorActionPreference = "Stop"
Write-Error @"
IndicTransToolkit does not officially support Windows native installation.
The install failed because the toolkit build process uses platform features that Windows may not provide.
Recommended: install and run the IndicTrans2 Python service inside WSL2 Ubuntu.
See the TravelMate README section 'IndicTrans2 on Windows using WSL2'.
"@
