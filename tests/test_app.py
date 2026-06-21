"""
Tests for the Flask application routes.
"""

import os
import unittest
import tempfile
from pathlib import Path
from vest.app import create_app


class TestImageRoute(unittest.TestCase):
    """Test the /images/ static route."""

    def setUp(self):
        self.app = create_app()
        self.app.testing = True
        self.client = self.app.test_client()

    def test_images_route_no_base_path(self):
        """Return 404 when no image base path is set."""
        response = self.client.get('/images/test.png')
        self.assertEqual(response.status_code, 404)

    def test_images_route_serves_file(self):
        """Serve an image file from the configured base path."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create a minimal PNG file (1x1 red pixel)
            img_path = os.path.join(tmpdir, 'test.png')
            with open(img_path, 'wb') as f:
                # Minimal valid PNG bytes
                f.write(
                    b'\x89PNG\r\n\x1a\n'
                    b'\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
                    b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx'
                    b'\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N'
                    b'\x00\x00\x00\x00IEND\xaeB`\x82'
                )

            self.app.image_base_path = tmpdir
            response = self.client.get('/images/test.png')
            self.assertEqual(response.status_code, 200)

    def test_images_route_file_not_found(self):
        """Return 404 for a missing image file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            self.app.image_base_path = tmpdir
            response = self.client.get('/images/nonexistent.png')
            self.assertEqual(response.status_code, 404)

    def test_images_route_path_traversal(self):
        """Reject path traversal attempts."""
        with tempfile.TemporaryDirectory() as tmpdir:
            self.app.image_base_path = tmpdir
            response = self.client.get('/images/../../../etc/passwd')
            # Flask normalises the URL before routing, so this becomes a
            # redirect or 404 – either way it must not return 200.
            self.assertNotEqual(response.status_code, 200)


if __name__ == '__main__':
    unittest.main()
