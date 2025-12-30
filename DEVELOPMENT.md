# VEST - Visual Embedding Space Traveling - Project Configuration

## Development Environment

### Dependencies
- Python 3.8+
- Flask 2.0+
- pandas 1.0+

### Development Dependencies
- pytest
- black
- flake8

## Project Structure

```
vest/
├── vest/                        # Main package
│   ├── __init__.py               # Package initialization
│   ├── app.py                    # Flask application
│   ├── cli.py                    # Command-line interface
│   ├── data_loader.py            # Data validation
│   ├── templates/
│   │   └── viewer.html           # Main HTML template
│   └── static/
│       └── viewer.js             # Three.js viewer
├── tests/                        # Test suite
├── examples.py                   # Usage examples
├── setup.py                      # Package configuration
├── README.md                     # Documentation
└── LICENSE                       # MIT License
```

## Installation for Development

```bash
# Clone or navigate to project directory
cd vest

# Install in editable mode with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/
```

## Building and Distribution

```bash
# Build distribution packages
python setup.py sdist bdist_wheel

# Upload to PyPI (requires credentials)
twine upload dist/*
```

## Key Features

- **3D Visualization**: Browser-based using Three.js
- **Interactive Navigation**: WASD + Mouse controls
- **Image Display**: Click to view full-size
- **DataFrame Support**: Works with pandas DataFrames
- **CSV Support**: Load data from CSV files
- **Pip-Installable**: Easy distribution

## API Overview

### Main Classes

#### `create_app(config_name='development')`
Create a Flask application instance.

#### `DataLoader.load_csv(filepath, image_base_path=None)`
Load data from CSV file with validation.

#### `DataLoader.load_dataframe(df, image_base_path)`
Validate and load from pandas DataFrame.

### Flask Routes

- `GET /` - Main viewer page
- `GET/POST /api/data` - Get/set scene data
- `GET /api/image/<filename>` - Serve image files
- `GET /api/stats` - Get scene statistics

## Browser Requirements

- WebGL 2.0 support
- ES6 JavaScript support
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

## Performance Tips

1. Use reasonable dataset sizes (1000-10000 points)
2. Ensure images are optimized (compressed)
3. Run on hardware with GPU acceleration
4. Close unnecessary browser tabs

## Troubleshooting

### Port Already in Use
```bash
vest data.csv --port 8080
```

### Images Not Loading
- Check `image_base_path` is correct
- Verify filenames match exactly
- Ensure images are accessible

### Slow Performance
- Reduce number of points
- Optimize image sizes
- Enable GPU acceleration in browser settings
