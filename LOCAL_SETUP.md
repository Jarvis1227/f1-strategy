# Opening this project on your PC

**Play in your browser:** run the following in the VS Code terminal, keep it
open, then visit http://127.0.0.1:8000. Full guide: [WEB_UI.md](WEB_UI.md).

```powershell
& .\.venv\Scripts\python.exe -m f1_strategy.webserver --open
```

You can also double-click **Start UI.cmd**, use **F1: Open browser game** in
Terminal → Run Task, or choose **Play in browser (React + FastAPI)** under F5.

Double-click **Open in VS Code.cmd** in this folder. It uses your existing VS
Code installation with the dedicated F1 profile and Python extensions prepared
under this chat's `work` directory. Keep this launcher in its current location;
its profile paths are relative to this local project layout.

If VS Code asks whether you trust the folder, this is the simulator source we
created in this chat. Review the folder and trust it to enable its run/debug
configuration.

Verification completed: all 39 Python tests and 7 progression tests passed, including API/Gymnasium checks;
`pip check` found no broken requirements; a 50-lap/10-car race ran successfully;
FastF1, Gymnasium, NumPy, SciPy and Matplotlib imported successfully. An advisory
Gymnasium warning about infinite observation-space maxima does not fail tests.

The project interpreter is `.venv\Scripts\python.exe` (Python 3.12), created
from the working bundled runtime. It includes the project in editable mode and
the Gymnasium/calibration extras. Keep the base runtime installed: this virtual
environment depends on it. No global Python/PATH changes were made.

## Run and test

- To play, use **Terminal → Run Task → F1: Play race**, or select
  **Play F1 Strategy (you drive car_01)** in Run and Debug and press F5.
  Pick starting tyres, then Enter stays out and S/M/H pits. Q saves and quits.
  Each lap explains every car's result and a stated one-lap alternative.
  The post-race `.comparison.md` report shows changes against the baseline bot.

- **Ctrl+Shift+B** runs a sample race and writes `examples/my_race.csv` plus
  `examples/my_race.results.json`.
- **F5** starts the configured race debugger. Choose **Run F1 race (seed 42)**
  if prompted. You can place breakpoints in `simulator.py`.
- To run tests, choose **Terminal → Run Task → F1: Run tests**, or select
  **Run all tests** in the Run and Debug panel and press F5.
- The Testing sidebar can also discover the unittest suite.

If prompted for a Python interpreter, choose **Enter interpreter path** and
select `.venv\Scripts\python.exe` inside this folder.

PowerShell commands from this folder, without environment activation:

```powershell
& .\.venv\Scripts\python.exe -m f1_strategy --play --seed 42 --output examples/player_race.csv
& .\.venv\Scripts\python.exe -m unittest discover -s tests -v
& .\.venv\Scripts\python.exe -m f1_strategy --seed 42 --output examples/my_race.csv
```

The source archive excludes the local virtual environment, installed extensions
and editor profile. On another computer, install Python and VS Code, then use
the README's environment setup instructions. The simulation parameters are
still illustrative; installing FastF1 does not download or fit race data.
