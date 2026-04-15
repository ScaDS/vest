# X-ray images of patients with COVID-19 

In this example, we view X-Ray images of patients with COVID-19. We are using the covid-10-image-repository published under [CC-BY 3.0 unported](https://creativecommons.org/licenses/by/3.0/) license by Hinrich B. Winther, Hans Laser, Svetlana Gerbel, Sabine K. Maschke, Jan B. Hinrichs, Jens Vogel-Claussen, Frank K. Wacker, Marius M. Höper, Bernhard C. Meyer  (2020, [DOI: 10.6084/m9.figshare.12275009](https://doi.org/10.6084/m9.figshare.12275009)), downloaded from [https://github.com/ml-workgroup/covid-19-image-repository](https://github.com/ml-workgroup/covid-19-image-repository).

After follwing the instructions in [download.ipynb](download.ipynb), and optionally re-creating the embedddings using [vision_embeddings_umap.ipynb](vision_embeddings_umap.ipynb), you can start VEST like this:

```
vest data.csv --image-path covid-19-image-repository/png
```