# Vision Embedding Space Travelling (VEST)

Browser-based exploration of vision embeddings in 3D space. Navigate using your mouse, touchscreen and keyboard, save keypoints along your trajectory and allow others to follow your path.

![teaser](https://github.com/ScaDS/vest/blob/main/docs/images/vest-butterflies-small.gif?raw=true)

This video shows a VEST through [butterfly images](https://www.kaggle.com/datasets/phucthaiv02/butterfly-image-classification) published on kaggle by DePie. The embedding was generated using [openai/clip-vit-base-patch32](https://huggingface.co/openai/clip-vit-base-patch32) and reduced to 3 dimensions using a [UMAP](https://pypi.org/project/umap-learn/). Read the [full example](https://github.com/ScaDS/vest/tree/main/examples/butterflies) and download the [video](https://github.com/ScaDS/vest/raw/refs/heads/main/docs/images/vest-butterflies.mp4).


## Features

- **Interactive 3D Visualization**: Explore images placed at 3D coordinates
- **Browser-Based**: Runs entirely in your web browser using [Three.js](http://threejs.org/)
- **Pip-Installable**: Easy installation as a Python package
- **Flexible Data Input**: Works with CSV files containing `filename`, `x`, `y` and `z` columns and folders of .png or .jpg files.
- **Fast Navigation**: Smooth keyboard movement, mouse and touchscreen controls

## Installation

Installation of VEST is commonly done like this:

```
pip install vision-embedding-space-travelling
```

Or the development version:

```bash
git clone https://github.com/scads/vest.git
cd vest
pip install -e .
```

While VEST uses minimal dependencies only ([pandas](https://pandas.pydata.org/) and [Flask](https://flask.palletsprojects.com/en/stable/)), you may need to install additional requirements such as [pytorch](https://pytorch.org/get-started/locally/), [transformers](https://github.com/huggingface/transformers), [umap-learn](https://pypi.org/project/umap-learn/), [kagglehub](https://github.com/Kaggle/kagglehub) depending on which example notebook you use. For more details, check the instructions in the example directories and the 'environmnent.yml' files.

## Quick Start

Navigate to a folder containing a VEST-compatible `data.csv` file and an `images` subfolder with content as explaned below. E.g.:
```bash
cd examples/mnist
```

Run VEST like this:
```bash
vest data.csv --image-path ./images
```

The `images` folder may contain sub-folders, as long as these are secified in the `filename` column of the CSV file. 

## Data Format

To use VEST with your own data, you need a .csv file with image locations and coordinates in these following columns:

| Column | Type | Description |
|--------|------|-------------|
| `x` | float | X coordinate in 3D space |
| `y` | float | Y coordinate in 3D space |
| `z` | float | Z coordinate in 3D space |
| `filename` | string | Relative path to image file (.png, .jpg, etc.) |

Example:
```
filename, x, y, z
test\Image_420.jpg, 11.708443, 5.975971, 1.1601356
train\Image_420.jpg, 14.487134, 3.430255, -2.0715249
test\Image_2562.jpg, 12.263655, 5.8971086, -0.066879705
```

## Controls

### Camera Movement
- **W / A / S / D** - Move forward, left, backward, right
- **E** - Move up
- **Y** - Move down
- **Mouse** - Look around (click to enable pointer lock)
- **Touch control**
  * 1 finger: Pan view
  * 2 fingers: Zoom

![alt text](https://github.com/ScaDS/vest/blob/main/docs/images/vest-touch.gif?raw=true)

While navigating through space, you can press the "Add keyframe" button in this panel. You can also save and load lists of keyframes and play an animation travelling along the given path.

![alt text](https://github.com/ScaDS/vest/blob/main/docs/images/keyframes_panel.png?raw=true)

On the right, you see three panels visualizing X-Y, X-Z and Y-Z projections. The small white arrow in there is your current view point and direction. The red line corresponds to the path of keyframes which is currently loaded.

![alt text](https://github.com/ScaDS/vest/blob/main/docs/images/projection_viewpoint.png?raw=true)


## Example Gallery

### CHAMMI-75 Microscopy Images

![teaser](https://github.com/ScaDS/vest/blob/main/docs/images/vest-chammi-75.gif?raw=true)

This example was generated using the [CHAMMI-75](https://morgridge.org/research/labs/caicedo/chammi-75/) microscopy images dataset, which is licensed [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.en). See how to [download this dataset programmatically](examples/chammi-75/download1000.ipynb) and [generate vest-compatible embeddings / data files](examples/chammi-75/vision_embeddings_umap.ipynb). Read the [full example](https://github.com/ScaDS/vest/tree/main/examples/chammi-75).

### Satellite Images of wind turbines (and without)

![](https://github.com/ScaDS/vest/blob/main/docs/images/vest-wind-turbines.gif?raw=true)

This video shows VEST through [Overhead Wind Turbine Dataset (NAIP)](https://doi.org/10.5281/zenodo.7385226) which is licensed [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode) by Komfein C. et al. It contains satellite images from the US National Agricultural Imagery Program showing wind turbines and without wind turbines. The embedding was generated using [openai/clip-vit-base-patch32](https://huggingface.co/openai/clip-vit-base-patch32) and reduced to 3 dimensions using a [UMAP](https://pypi.org/project/umap-learn/). Read the [full example](https://github.com/ScaDS/vest/tree/main/examples/wind-turbine-data).

### MNist Image of Numbers

![teaser](https://github.com/ScaDS/vest/blob/main/docs/images/vest-mnist.gif?raw=true)

This visualization uses a subsample of the [MNist dataset](https://huggingface.co/datasets/ylecun/mnist) embedded using [nomic-ai/nomic-embed-vision-v1.5](https://huggingface.co/nomic-ai/nomic-embed-vision-v1.5) reduced to 3 dimensions using [UMAP](https://umap-learn.readthedocs.io/en/latest/). See [this data generation notebook](https://github.com/ScaDS/vest/blob/main/examples/mnist/vision_embeddings_umap.ipynb). Read the [full example](https://github.com/ScaDS/vest/tree/main/examples/mnist).


## Troubleshooting

### Images not loading
- Check that `image-path` points to the correct directory
- Ensure image filenames match exactly (case-sensitive on Linux/Mac)
- Supported formats: PNG, JPG

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
Note: Most of the code in this repository was vibe-coded using Github copilot integration in Visual Studio Code. When modifying code here, consider using a similar tool.

## Citation

If you use VEST (Vision Embedding Space Travelling) in your work, please cite:

```bibtex
@software{vest,
  title={VEST: Vision Embedding Space Travelling - 3D Browser-Based Visualization for Image Data},
  author={Robert Haase},
  year={2026},
  url={https://github.com/scads/vest}
}
```

## Acknowledgements 

Big thanks goes to Lea Kabjesz and Lea Gihlein for inspiration and code snippets in the example notebooks for creating embeddings. We acknowledge the financial support by the Federal Ministry of Education and Research of Germany and by Sächsische Staatsministerium für Wissenschaft, Kultur und Tourismus in the programme Center of Excellence for AI-research “Center for Scalable Data Analytics and Artificial Intelligence Dresden/Leipzig”, project identification number: ScaDS.AI
