# World of Embeddings

A 3D browser-based visualization engine for exploring image data in three-dimensional space. Navigate using your mouse and keyboard to explore images placed at x, y, z coordinates.

## Features

- **Interactive 3D Visualization**: Explore images in 3D space with smooth camera controls
- **Browser-Based**: Runs entirely in your web browser using Three.js
- **Pip-Installable**: Easy installation as a Python package
- **Flexible Data Input**: Works with pandas DataFrames or CSV files
- **Fast Navigation**: Smooth WASD movement and mouse look controls
- **Image Popup**: Click on any image to view it in full size

## Installation

### From PyPI (when published)
```bash
pip install world-of-embeddings
```

### From source
```bash
git clone https://github.com/yourusername/world-of-embeddings.git
cd world-of-embeddings
pip install -e .
```

## Quick Start

### Using CSV file

Create a CSV file with columns: `x`, `y`, `z`, `filename`

```csv
x,y,z,filename
0,0,0,image1.png
10,5,-5,image2.png
-10,0,10,image3.png
```

Then run:
```bash
world-of-embeddings data.csv --image-path ./images
```

### Using Python API

```python
import pandas as pd
from world_of_embeddings import create_app

# Create your data
df = pd.DataFrame({
    'x': [0, 10, -10],
    'y': [0, 5, 0],
    'z': [0, -5, 10],
    'filename': ['image1.png', 'image2.png', 'image3.png']
})

# Create app and run
app = create_app()
app.data_df = df
app.image_base_path = './images'

# Run the app
app.run(host='127.0.0.1', port=5000, debug=True)
```

Or use the convenience function:

```python
import pandas as pd
from world_of_embeddings import create_app
from world_of_embeddings.app import run_app

df = pd.DataFrame({
    'x': [0, 10, -10],
    'y': [0, 5, 0],
    'z': [0, -5, 10],
    'filename': ['image1.png', 'image2.png', 'image3.png']
})

run_app(df, image_base_path='./images', host='127.0.0.1', port=5000)
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
- **Space** - Move up
- **Ctrl** - Move down
- **Mouse** - Look around (click to enable pointer lock)

### Interaction
- **Click Image** - View full-size image in popup
- **Esc** - Close image popup

## Advanced Usage

### Jupyter Notebook Integration

```python
import pandas as pd
from world_of_embeddings.app import create_app
from world_of_embeddings.data_loader import DataLoader

# Load data
df, image_path = DataLoader.load_csv('embeddings.csv')

# Create app with data
app = create_app()
app.data_df = df
app.image_base_path = image_path

# Run in background (optional)
# app.run(debug=False)
```

### Custom Data Processing

```python
import pandas as pd
from world_of_embeddings import DataLoader

# Load and validate
try:
    df, image_base_path = DataLoader.load_dataframe(my_df, './images')
except ValueError as e:
    print(f"Invalid data: {e}")
```

## Configuration

### Server Options
```bash
world-of-embeddings data.csv \
    --host 0.0.0.0 \
    --port 8080 \
    --no-debug
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Architecture

```
world_of_embeddings/
├── app.py              # Flask application
├── cli.py              # Command-line interface
├── data_loader.py      # Data validation and loading
├── __init__.py         # Package initialization
├── templates/
│   └── viewer.html     # Main 3D viewer HTML
└── static/
    └── viewer.js       # Three.js-based viewer logic
```

## Performance

- Handles 1000+ points smoothly on modern hardware
- Adaptive rendering with fog effect for distant objects
- Efficient image loading and caching

## Troubleshooting

### Images not loading
- Check that `image_base_path` points to the correct directory
- Ensure image filenames match exactly (case-sensitive on Linux/Mac)
- Supported formats: PNG, JPG, WebP

### Slow performance
- Reduce the number of points displayed
- Enable hardware acceleration in your browser
- Close other applications consuming GPU resources

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
black world_of_embeddings/
flake8 world_of_embeddings/
```

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Citation

If you use World of Embeddings in your research, please cite:

```bibtex
@software{world_of_embeddings,
  title={World of Embeddings: 3D Browser-Based Visualization for Image Data},
  author={Your Name},
  year={2024},
  url={https://github.com/yourusername/world-of-embeddings}
}
```

## Future Roadmap

- [ ] Point cloud coloring based on custom attributes
- [ ] Data filtering and search
- [ ] Export/screenshot functionality
- [ ] Animation timeline for temporal data
- [ ] VR support (WebXR)
- [ ] Real-time data updates via WebSocket
- [ ] Label and annotation tools

---

**Questions?** Open an issue on GitHub or check the documentation.
