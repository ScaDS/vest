# VEST - Vision Embedding Space Traveling

Browser-based exploration of vision embeddings in 3D space. Navigate using your mouse, touchscreen and keyboard, save keypoints along your trajectory and allow others to follow your path.

![teaser](docs/images/vest-teaser-chammi-75.gif)

This example was generated using the [CHAMMI-75](https://morgridge.org/research/labs/caicedo/chammi-75/) microscopy images dataset, which is licensed [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.en). See how to [download this dataset programmatically](examples/chammi-75/download1000.ipynb) and [generate vest-compatible embeddings / data files](examples/chammi-75/vision_embeddings_umap.ipynb).

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

![teaser](docs/images/vest-teaser.gif)

<small>Visualization uses a subsample of the [MNist dataset](https://huggingface.co/datasets/ylecun/mnist) embedded using [nomic-ai/nomic-embed-vision-v1.5](https://huggingface.co/nomic-ai/nomic-embed-vision-v1.5) reduced to 3 dimensions using [UMAP](https://umap-learn.readthedocs.io/en/latest/). See [this data generation notebook](https://github.com/ScaDS/vest/blob/main/examples/mnist/vision_embeddings_umap.ipynb).</small>


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
- **Touch control**
  * 1 finger: Rotate view
  * 2 fingers: Zoom
  * 3 fingers: Pan view

## Troubleshooting

### Images not loading
- Check that `image-path` points to the correct directory
- Ensure image filenames match exactly (case-sensitive on Linux/Mac)
- Supported formats: PNG, JPG

## Development

### Setup development environment
```bash
pip install -e .
```


## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
Note: Most of the code in this repository was vibe-coded using Github copilot integration in Visual Studio Code. When modifying code here, consider using a similar tool.

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
