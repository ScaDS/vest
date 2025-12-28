"""
World of Embeddings - A 3D browser-based visualization engine for image data.

This package provides tools to visualize images placed in 3D space, allowing
interactive exploration using mouse and keyboard controls.
"""

__version__ = "0.1.0"
__author__ = "Your Name"

from .app import create_app
from .data_loader import DataLoader

__all__ = ["create_app", "DataLoader"]
