"""
Flask application for the 3D image visualization engine.
"""

import os
import json
import pandas as pd
from flask import Flask, render_template, jsonify, request, send_file
from pathlib import Path


def create_app(config_name='development'):
    """Create and configure the Flask application."""
    app = Flask(
        __name__,
        template_folder=os.path.join(os.path.dirname(__file__), 'templates'),
        static_folder=os.path.join(os.path.dirname(__file__), 'static')
    )
    
    # Store data in app context
    app.data_df = None
    app.image_base_path = None
    
    @app.route('/')
    def index():
        """Render the main 3D viewer page."""
        return render_template('viewer.html')
    
    @app.route('/api/data', methods=['GET', 'POST'])
    def get_data():
        """Get or set the 3D scene data."""
        if request.method == 'POST':
            # Receive dataframe data as JSON
            data = request.get_json()
            try:
                df = pd.DataFrame(data['points'])
                app.data_df = df
                app.image_base_path = data.get('image_base_path', '')
                return jsonify({'status': 'success', 'message': 'Data loaded'})
            except Exception as e:
                return jsonify({'status': 'error', 'message': str(e)}), 400
        
        # Return data as JSON for the viewer
        if app.data_df is None:
            return jsonify({'points': []})
        
        # Convert DataFrame to list of dicts
        points = app.data_df.to_dict('records')
        return jsonify({
            'points': points,
            'image_base_path': app.image_base_path
        })
    
    @app.route('/api/image/<path:filename>')
    def get_image(filename):
        """Serve image files."""
        if app.image_base_path is None:
            return jsonify({'error': 'No image base path set'}), 400
        
        # Normalize path separators and construct full path
        filename = filename.replace('/', os.sep).replace('\\', os.sep)
        file_path = os.path.join(app.image_base_path, filename)
        file_path = os.path.normpath(file_path)
        
        if os.path.exists(file_path):
            # Detect MIME type based on file extension
            ext = os.path.splitext(filename)[1].lower()
            mime_types = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.bmp': 'image/bmp'
            }
            mimetype = mime_types.get(ext, 'image/png')
            return send_file(file_path, mimetype=mimetype)
        
        # Log detailed error info
        print(f"ERROR: Image not found")
        print(f"  Requested: {filename}")
        print(f"  Base path: {app.image_base_path}")
        print(f"  Full path: {file_path}")
        print(f"  Base path exists: {os.path.exists(app.image_base_path)}")
        if os.path.exists(app.image_base_path):
            files = os.listdir(app.image_base_path)
            print(f"  Files in base path: {files[:10]}...")  # Show first 10
        return jsonify({'error': 'File not found', 'path': file_path}), 404
    
    @app.route('/api/stats')
    def get_stats():
        """Get statistics about loaded data."""
        if app.data_df is None:
            return jsonify({
                'point_count': 0,
                'bounds': None
            })
        
        df = app.data_df
        return jsonify({
            'point_count': len(df),
            'bounds': {
                'x': [float(df['x'].min()), float(df['x'].max())],
                'y': [float(df['y'].min()), float(df['y'].max())],
                'z': [float(df['z'].min()), float(df['z'].max())]
            }
        })
    
    return app


def run_app(dataframe=None, image_base_path=None, host='127.0.0.1', port=5000, debug=True):
    """
    Create and run the Flask app with data.
    
    Parameters
    ----------
    dataframe : pd.DataFrame
        DataFrame with columns: x, y, z, filename
    image_base_path : str
        Base path for image files
    host : str
        Host address to bind to
    port : int
        Port to run on
    debug : bool
        Enable Flask debug mode
    """
    app = create_app()
    
    if dataframe is not None:
        app.data_df = dataframe
    
    if image_base_path is not None:
        # Convert to absolute path
        from pathlib import Path
        app.image_base_path = str(Path(image_base_path).resolve())
        print(f"Image base path set to: {app.image_base_path}")
    
    # Open browser (only in main process, not in reloader process)
    import webbrowser
    import threading
    import os
    
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not debug:
        def open_browser():
            webbrowser.open(f'http://{host}:{port}')
        
        threading.Timer(1.0, open_browser).start()
    
    app.run(host=host, port=port, debug=debug)
