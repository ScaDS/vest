# VEST - Visual Embedding Space Traveling

A browser-based visualization engine for exploring vision embeddings in 3D space. Navigate using your mouse, touchscreen and keyboard, save keypoints along your trajectory and allow others to follow your path.

![teaser](docs/images/vest-teaser.gif)

## Features

- **Interactive 3D Visualization**: Explore images placed at 3D coordinates
- **Browser-Based**: Runs entirely in your web browser using [Three.js](http://threejs.org/)
- **Pip-Installable**: Easy installation as a Python package
- **Flexible Data Input**: Works with CSV files containing `filename`, `x`, `y` and `z` columns.
- **Fast Navigation**: Smooth WASD movement, mouse and touchscreen controls

## Installation

### From source
```bash
git clone https://github.com/scads/vest.git
cd vest
pip install -e .
```

## Quick Start

Navigate to a folder containing a `data.csv` file and an `images` subfolder with content as explaned below. E.g.:
```bash
cd examples/mnist
```

Run `vest` like this:
```bash
vest data.csv --image-path ./images
```

## Data Format

Your data must have the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `x` | float | X coordinate in 3D space |
| `y` | float | Y coordinate in 3D space |
| `z` | float | Z coordinate in 3D space |
| `filename` | string | Relative path to image file (.png, .jpg, etc.) |

## Controls

### Camera Movement
- **W / A / S / D** - Move forward, left, backward, right
- **E** - Move up
- **Y** - Move down
- **Mouse** - Look around (click to enable pointer lock)

### Interaction
- **Click Image** - View full-size image in popup
- **Esc** - Close image popup

## Advanced Usage

### Jupyter Notebook Integration

```python
import pandas as pd
from vest.app import create_app
from vest.data_loader import DataLoader

# Load data
df, image_path = DataLoader.load_csv('embeddings.csv')

# Create app with data
app = create_app()
app.data_df = df
app.image_base_path = image_path

# Run in background (optional)
# app.run(debug=False)
```


## Advanced Configuration

### Server Options
```bash
vest data.csv \
    --host 0.0.0.0 \
    --port 8080 \
    --no-debug
```

## Architecture

```
vest/
├── app.py              # Flask application
├── cli.py              # Command-line interface
├── data_loader.py      # Data validation and loading
├── __init__.py         # Package initialization
├── templates/
│   └── viewer.html     # Main 3D viewer HTML
└── static/
    └── viewer.js       # Three.js-based viewer logic
```

## Troubleshooting

### Images not loading
- Check that `image_base_path` points to the correct directory
- Ensure image filenames match exactly (case-sensitive on Linux/Mac)
- Supported formats: PNG, JPG, WebP

## Development

### Setup development environment
```bash
pip install -e ".[dev]"
```

### Run tests
```bash
pytest tests/
```

### Code formatting
```bash
black vest/
flake8 vest/
```

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Citation

If you use VEST (Visual Embedding Space Traveling) in your research, please cite:

```bibtex
@software{vest,
  title={VEST: Visual Embedding Space Traveling - 3D Browser-Based Visualization for Image Data},
  author={Robert Haase},
  year={2025},
  url={https://github.com/scads/vest}
}
```
