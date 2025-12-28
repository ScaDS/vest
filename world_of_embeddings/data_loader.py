"""
Data loading utilities for 3D visualization.
"""

import pandas as pd
from pathlib import Path
from typing import Union, Optional


class DataLoader:
    """
    Load and validate data for 3D visualization.
    
    Expects a DataFrame with columns: x, y, z, filename
    """
    
    @staticmethod
    def load_csv(filepath: Union[str, Path], image_base_path: Optional[str] = None) -> tuple:
        """
        Load data from CSV file.
        
        Parameters
        ----------
        filepath : str or Path
            Path to CSV file
        image_base_path : str, optional
            Base path for image files. If None, uses directory of CSV file.
            
        Returns
        -------
        tuple
            (dataframe, image_base_path)
        """
        df = pd.read_csv(filepath)
        DataLoader.validate_dataframe(df)
        
        if image_base_path is None:
            image_base_path = str(Path(filepath).parent.resolve())
        else:
            # Convert to absolute path
            image_base_path = str(Path(image_base_path).resolve())
        
        return df, image_base_path
    
    @staticmethod
    def load_dataframe(df: pd.DataFrame, image_base_path: str) -> tuple:
        """
        Validate and return a dataframe.
        
        Parameters
        ----------
        df : pd.DataFrame
            DataFrame with columns: x, y, z, filename
        image_base_path : str
            Base path for image files
            
        Returns
        -------
        tuple
            (dataframe, image_base_path)
        """
        DataLoader.validate_dataframe(df)
        return df, image_base_path
    
    @staticmethod
    def validate_dataframe(df: pd.DataFrame):
        """
        Validate that dataframe has required columns.
        
        Raises
        ------
        ValueError
            If required columns are missing
        """
        required_columns = {'x', 'y', 'z', 'filename'}
        df_columns = set(df.columns)
        
        if not required_columns.issubset(df_columns):
            missing = required_columns - df_columns
            raise ValueError(f"DataFrame missing required columns: {missing}")
        
        # Validate data types
        for col in ['x', 'y', 'z']:
            if not pd.api.types.is_numeric_dtype(df[col]):
                raise ValueError(f"Column '{col}' must be numeric")
        
        if not pd.api.types.is_string_dtype(df['filename']):
            df['filename'] = df['filename'].astype(str)
