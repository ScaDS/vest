#!/usr/bin/env python
"""
Setup script for vest package.
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding="utf-8") if readme_file.exists() else ""

setup(
    name="vest",
    version="0.1.0",
    author="Your Name",
    author_email="your.email@example.com",
    description="A 3D browser-based visualization engine for image data in 3D space",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/scads/vest",
    packages=find_packages(),
    package_data={
        "vest": [
            "templates/*",
            "static/*",
            "data/*"
        ]
    },
    include_package_data=True,
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Scientific/Engineering :: Visualization",
    ],
    python_requires=">=3.8",
    install_requires=[
        "Flask>=2.0.0",
        "pandas>=1.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=6.0",
            "black>=21.0",
            "flake8>=3.9",
        ]
    },
    entry_points={
        "console_scripts": [
            "vest=vest.cli:main",
        ]
    },
)
