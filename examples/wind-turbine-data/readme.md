# Satellite images of wind turbines

In this example, we use the Dataset [Overhead Wind Turbine Dataset (NAIP)](https://doi.org/10.5281/zenodo.7385226) which is licensed [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode) by Komfein C. et al. It contains satellite images from the US National Agricultural Imagery Program showing wind turbines and without wind turbines (background). Additionally, it contains synthetic images of which many can be recognized as synthetic because the shadow of the wind turbines points in different directions within individual images.

In order to use the dataset with VEST, download the zip-file from the location above and unzip it so that the following folder structure is created:

* wind-turbine-data (this folder)
  * images
    * EM
      * Background
      * Real
      * Test
    * NW
      * Background
      * Real
      * Test
    * SW
      * Background
      * Real
      * Test
    * Synthetic 
  * labels
    * ...
  * data.csv
  * domain_overview.json
  * [vision_embeddings_umap.ipynb](vision_embeddings_umap.ipynb)

You can then start VEST from the current directory like this:
```
vest data.csv --image-path ./images
```
