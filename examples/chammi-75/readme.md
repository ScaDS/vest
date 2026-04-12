# CHAMMI-75 Microscopy images

This example uses a small fraction of the [CHAMMI-75](https://morgridge.org/research/labs/caicedo/chammi-75/) microscopy images dataset, which is licensed [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.en).

Go through the [download notebook](download1000.ipynb) to download the data.
Then, generate the embeddings using [vision_embeddings_umap.ipynb](vision_embeddings_umap.ipynb).

Afterwards, you can navigate to this folder using the terminal and run this command:
```
vest data.csv --image-path ./images
```
