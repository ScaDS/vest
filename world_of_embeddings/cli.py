"""
Command-line interface for world_of_embeddings.
"""

import argparse
import sys
from pathlib import Path
import pandas as pd

from .app import run_app
from .data_loader import DataLoader


def main():
    """Main entry point for CLI."""
    parser = argparse.ArgumentParser(
        description="World of Embeddings - 3D Image Visualization"
    )
    
    parser.add_argument(
        "data",
        nargs="?",
        help="Path to CSV file with x, y, z, filename columns"
    )
    
    parser.add_argument(
        "--image-path",
        type=str,
        help="Base path for image files (defaults to CSV directory)"
    )
    
    parser.add_argument(
        "--host",
        type=str,
        default="127.0.0.1",
        help="Host to bind to (default: 127.0.0.1)"
    )
    
    parser.add_argument(
        "--port",
        type=int,
        default=5000,
        help="Port to run on (default: 5000)"
    )
    
    parser.add_argument(
        "--no-debug",
        action="store_true",
        help="Disable debug mode"
    )
    
    args = parser.parse_args()
    
    # Load data if provided
    dataframe = None
    image_base_path = None
    
    if args.data:
        try:
            data_path = Path(args.data)
            if not data_path.exists():
                print(f"Error: File not found: {args.data}")
                sys.exit(1)
            
            dataframe, image_base_path = DataLoader.load_csv(
                data_path,
                args.image_path
            )
            print(f"Loaded {len(dataframe)} points from {args.data}")
        except Exception as e:
            print(f"Error loading data: {e}")
            sys.exit(1)
    
    # Run app
    print(f"Starting server at http://{args.host}:{args.port}")
    run_app(
        dataframe=dataframe,
        image_base_path=image_base_path,
        host=args.host,
        port=args.port,
        debug=not args.no_debug
    )


if __name__ == "__main__":
    main()
