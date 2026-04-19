# Logos

In this example we can visualize different company logos in 3D space. 
The logos were AI-generated using OpenAI's gpt-image1-mini model.  You can reproduce the process by executing [generate_company_names.py](generate_company_names.py) and [generate_logos.py](generate_logos.py). Alternatively, it is recommended to download [logos.zip](https://doi.org/10.5281/zenodo.19633744) and unzip it so that the images are located in a `logos` folder next to `data.csv`.

Optionally you can re-create the embedddings using [vision_embeddings_umap.ipynb](vision_embeddings_umap.ipynb).

Finally, you can start VEST like this:
```
vest data.csv --image-path ./logos
```
