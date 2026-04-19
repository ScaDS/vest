# Satellite images

In this example we can visualize satellite images in 3D space.
* 200 synthetic images generated using OpenAI's gpt-image1-mini model. The process can be reproducted by executing [image_generator.py](image_generator.py). It will produce:
  * 100 images from single regions / bioms (1..100*.png)
  * 100 images from pairs of regions  (101..200*.png)
* 196 images (naip_rgb_*.png) from the region around Chicago, from the USGS National Map — NAIP ImageServer (https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer). The download was done by executing the [download_naip.ipynb](download_naip.ipynb) notebook multiple times due to rate limits.

Instead of regenerating the data, it is recommended to download [images.zip](https://doi.org/10.5281/zenodo.19635483) and unzip it so that the images are located in a `images` folder next to `data.csv`.

Optionally you can re-create the embedddings using [vision_embeddings_umap.ipynb](vision_embeddings_umap.ipynb).

Finally, you can start VEST like this:
```
vest data.csv --image-path ./images
```

The data.csv file contains an additional column "synthetic" allowing you to visualize in orange an blue if a dataset was synthetic or not.
