"""
Tests for world_of_embeddings
"""

import unittest
import pandas as pd
from world_of_embeddings.data_loader import DataLoader


class TestDataLoader(unittest.TestCase):
    """Test data loading and validation."""
    
    def test_valid_dataframe(self):
        """Test valid DataFrame validation."""
        df = pd.DataFrame({
            'x': [0, 1, 2],
            'y': [0, 1, 2],
            'z': [0, 1, 2],
            'filename': ['a.png', 'b.png', 'c.png']
        })
        
        # Should not raise
        validated_df, path = DataLoader.load_dataframe(df, './images')
        self.assertEqual(len(validated_df), 3)
    
    def test_missing_column(self):
        """Test missing required column."""
        df = pd.DataFrame({
            'x': [0, 1, 2],
            'y': [0, 1, 2],
            'z': [0, 1, 2]
            # Missing 'filename'
        })
        
        with self.assertRaises(ValueError):
            DataLoader.load_dataframe(df, './images')
    
    def test_non_numeric_coordinate(self):
        """Test non-numeric coordinate column."""
        df = pd.DataFrame({
            'x': ['a', 'b', 'c'],  # Non-numeric
            'y': [0, 1, 2],
            'z': [0, 1, 2],
            'filename': ['a.png', 'b.png', 'c.png']
        })
        
        with self.assertRaises(ValueError):
            DataLoader.load_dataframe(df, './images')
    
    def test_string_conversion(self):
        """Test automatic string conversion for filename."""
        df = pd.DataFrame({
            'x': [0, 1, 2],
            'y': [0, 1, 2],
            'z': [0, 1, 2],
            'filename': [1, 2, 3]  # Non-string
        })
        
        # Should not raise (converts to string)
        validated_df, path = DataLoader.load_dataframe(df, './images')
        self.assertEqual(validated_df['filename'].dtype, 'object')


if __name__ == '__main__':
    unittest.main()
