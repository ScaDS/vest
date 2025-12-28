"""
Example usage of world_of_embeddings
"""

import pandas as pd
from pathlib import Path
from world_of_embeddings.app import run_app
from world_of_embeddings.data_loader import DataLoader


def example_basic():
    """Basic example with in-memory DataFrame."""
    # Create sample data
    df = pd.DataFrame({
        'x': [0, 10, -10, 5, -5, 0, 0, 0],
        'y': [0, 0, 0, 5, -5, 10, -10, 0],
        'z': [0, 10, 10, 0, 0, 5, 5, -10],
        'filename': [
            'sample1.png', 'sample2.png', 'sample3.png', 'sample4.png',
            'sample5.png', 'sample6.png', 'sample7.png', 'sample8.png'
        ]
    })
    
    # Run the app
    # Replace './sample_images' with your actual image directory
    run_app(df, image_base_path='./sample_images')


def example_from_csv():
    """Load data from CSV file."""
    csv_path = './data/embeddings.csv'  # Change to your CSV path
    image_path = './images'  # Change to your image directory
    
    # Validate data
    try:
        df, img_path = DataLoader.load_csv(csv_path, image_path)
        print(f"Loaded {len(df)} points")
        print(f"Bounds:")
        print(f"  X: [{df['x'].min()}, {df['x'].max()}]")
        print(f"  Y: [{df['y'].min()}, {df['y'].max()}]")
        print(f"  Z: [{df['z'].min()}, {df['z'].max()}]")
        
        # Run visualization
        run_app(df, image_path)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("Please create a CSV file with x, y, z, filename columns")


def example_processed_data():
    """Example with processed/normalized data."""
    import numpy as np
    
    # Simulate embedding data (e.g., from UMAP, t-SNE)
    n_samples = 100
    np.random.seed(42)
    
    # Create synthetic 3D embeddings
    embeddings = np.random.randn(n_samples, 3) * 50
    filenames = [f'image_{i:04d}.png' for i in range(n_samples)]
    
    df = pd.DataFrame({
        'x': embeddings[:, 0],
        'y': embeddings[:, 1],
        'z': embeddings[:, 2],
        'filename': filenames
    })
    
    print(f"Created {len(df)} synthetic points")
    print(df.head())
    
    # Note: This example won't show images since they don't exist
    # Create actual image files or use existing ones
    # run_app(df, image_base_path='./images')


if __name__ == '__main__':
    print("World of Embeddings Examples")
    print("=" * 50)
    print()
    print("Choose an example to run:")
    print("1. Basic example (requires sample images)")
    print("2. Load from CSV")
    print("3. Processed data (visualization only)")
    print()
    
    choice = input("Enter choice (1-3): ").strip()
    
    if choice == '1':
        example_basic()
    elif choice == '2':
        example_from_csv()
    elif choice == '3':
        example_processed_data()
    else:
        print("Invalid choice")
