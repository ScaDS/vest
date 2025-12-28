/**
 * 3D Viewer for image visualization in 3D space
 * Uses Three.js for rendering and custom camera controls
 */

class CameraController {
    constructor(camera) {
        this.camera = camera;
        this.keys = {};
        this.mouse = { x: 0, y: 0, locked: false };
        this.velocity = new THREE.Vector3();
        this.speed = 0.1;
        this.acceleration = 0.02;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse controls
        document.addEventListener('mousemove', (e) => {
            if (this.mouse.locked) {
                const movementX = e.movementX || 0;
                const movementY = e.movementY || 0;

                const euler = new THREE.Euler(0, 0, 0, 'YXZ');
                euler.setFromQuaternion(this.camera.quaternion);
                euler.rotateY(-movementX * 0.005);
                euler.rotateX(-movementY * 0.005);
                
                // Clamp vertical rotation
                euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
                
                this.camera.quaternion.setFromEuler(euler);
            }
        });

        document.addEventListener('click', () => {
            document.body.requestPointerLock =
                document.body.requestPointerLock || document.body.mozRequestPointerLock;
            document.body.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = document.pointerLockElement === document.body;
        });
    }

    update() {
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);

        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.crossVectors(forward, up).normalize();

        let targetVelocity = new THREE.Vector3();

        if (this.keys['w']) targetVelocity.add(forward);
        if (this.keys['s']) targetVelocity.sub(forward);
        if (this.keys['d']) targetVelocity.add(right);
        if (this.keys['a']) targetVelocity.sub(right);
        if (this.keys[' ']) targetVelocity.y += 1;
        if (this.keys['control']) targetVelocity.y -= 1;

        targetVelocity.normalize().multiplyScalar(this.speed);

        // Apply acceleration
        this.velocity.lerp(targetVelocity, this.acceleration);

        // Clamp velocity
        if (this.velocity.length() > this.speed) {
            this.velocity.normalize().multiplyScalar(this.speed);
        }

        this.camera.position.add(this.velocity);
    }
}

class ImageViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controller = null;
        this.points = [];
        this.imageSprites = [];
        this.imageBasePath = '';
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.init();
        this.loadData();
        this.animate();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.Fog(0x0a0a0a, 500, 2000);

        // Camera setup
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Camera controller
        this.controller = new CameraController(this.camera);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        this.scene.add(directionalLight);

        // Grid helper (optional)
        const gridHelper = new THREE.GridHelper(500, 50, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        // Add coordinate axes helper
        const axesHelper = new THREE.AxesHelper(100);
        this.scene.add(axesHelper);

        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        document.addEventListener('click', (e) => this.onMouseClick(e));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeImagePopup();
        });

        // Close popup on background click
        document.getElementById('image-popup').addEventListener('click', (e) => {
            if (e.target.id === 'image-popup' || e.target.classList.contains('close-popup')) {
                this.closeImagePopup();
            }
        });
    }

    async loadData() {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();

            this.points = data.points;
            this.imageBasePath = data.image_base_path;

            // Also fetch stats for bounds
            const statsResponse = await fetch('/api/stats');
            const stats = await statsResponse.json();

            this.createScene(stats);
            this.updateUI();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading data:', error);
            this.hideLoading();
        }
    }

    createScene(stats) {
        // Clear existing sprites
        this.imageSprites.forEach(sprite => this.scene.remove(sprite));
        this.imageSprites = [];

        if (this.points.length === 0) {
            console.warn('No points to display');
            return;
        }

        // Create sprites for each image
        const textureLoader = new THREE.TextureLoader();

        this.points.forEach((point, index) => {
            const filename = point.filename;
            const x = point.x;
            const y = point.y;
            const z = point.z;

            // Create a simple placeholder geometry (will be replaced based on distance)
            const geometry = new THREE.CircleGeometry(0.5, 8);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, z);
            mesh.userData = { filename, index, imageUrl: `/api/image/${filename}`, textureLoader };

            this.scene.add(mesh);
            this.imageSprites.push(mesh);
        });

        // Adjust camera to see all points
        if (stats.bounds) {
            const centerX = (stats.bounds.x[0] + stats.bounds.x[1]) / 2;
            const centerY = (stats.bounds.y[0] + stats.bounds.y[1]) / 2;
            const centerZ = (stats.bounds.z[0] + stats.bounds.z[1]) / 2;
            const maxDist = Math.max(
                stats.bounds.x[1] - stats.bounds.x[0],
                stats.bounds.y[1] - stats.bounds.y[0],
                stats.bounds.z[1] - stats.bounds.z[0]
            );

            this.camera.position.set(
                centerX + maxDist,
                centerY + maxDist * 0.5,
                centerZ + maxDist
            );
            this.camera.lookAt(centerX, centerY, centerZ);
        }
    }

    onMouseClick(event) {
        // Don't racast if over UI
        if (event.target.id === 'ui-panel' || event.target.id === 'controls' ||
            event.target.parentElement.id === 'ui-panel' ||
            event.target.parentElement.id === 'controls') {
            return;
        }

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.imageSprites);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData.filename) {
                this.showImagePopup(object.userData.filename);
            }
        }
    }

    showImagePopup(filename) {
        const popup = document.getElementById('image-popup');
        const img = document.getElementById('popup-image');
        img.src = `/api/image/${filename}`;
        popup.style.display = 'block';
    }

    closeImagePopup() {
        document.getElementById('image-popup').style.display = 'none';
    }

    updateUI() {
        document.getElementById('point-count').textContent = this.points.length;

        if (this.points.length > 0) {
            const xs = this.points.map(p => p.x);
            const ys = this.points.map(p => p.y);
            const zs = this.points.map(p => p.z);

            const boundsText = `X: [${Math.min(...xs).toFixed(1)}, ${Math.max(...xs).toFixed(1)}]<br>
                               Y: [${Math.min(...ys).toFixed(1)}, ${Math.max(...ys).toFixed(1)}]<br>
                               Z: [${Math.min(...zs).toFixed(1)}, ${Math.max(...zs).toFixed(1)}]`;
            document.getElementById('bounds').innerHTML = boundsText;
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        loading.style.display = 'none';
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    updateNearestPoint() {
        if (this.imageSprites.length === 0) return;

        // Calculate distances for all sprites
        const distances = this.imageSprites.map((sprite, index) => ({
            sprite,
            distance: this.camera.position.distanceTo(sprite.position),
            index
        }));

        // Sort by distance
        distances.sort((a, b) => a.distance - b.distance);

        // Get the 10 closest
        const closestCount = Math.min(10, distances.length);
        const closest = distances.slice(0, closestCount);
        
        // Find min and max distance for normalization
        const maxDist = distances[distances.length - 1].distance;
        const minDist = distances[0].distance;
        const distRange = maxDist - minDist;

        // Update all sprites
        distances.forEach((item, idx) => {
            const { sprite, distance } = item;
            const isClosest = idx < closestCount;

            if (isClosest) {
                // Load as image if not already loaded
                if (!sprite.userData.isImage) {
                    this.loadSpriteAsImage(sprite);
                }
            } else {
                // Convert to dot if it's currently an image
                if (sprite.userData.isImage) {
                    this.convertSpriteToCircle(sprite);
                }
                
                // Update dot appearance based on distance
                // Normalize distance (0 = closest, 1 = furthest)
                const normalizedDist = distRange > 0 ? (distance - minDist) / distRange : 0;
                
                // Size: 50px (close) to 5px (far)
                const size = 50 - (normalizedDist * 45);
                
                // Brightness: white (close) to grey (far)
                // RGB: (255,255,255) to (100,100,100)
                const brightness = 255 - (normalizedDist * 155);
                const color = (brightness << 16) | (brightness << 8) | brightness;
                
                // Opacity: more opaque when closer
                const opacity = 1.0 - (normalizedDist * 0.3);
                
                // Update geometry size
                if (sprite.geometry.type === 'CircleGeometry') {
                    sprite.geometry.dispose();
                    sprite.geometry = new THREE.CircleGeometry(size * 0.01, 8);
                }
                
                // Update material
                sprite.material.color.setHex(color);
                sprite.material.opacity = opacity;
            }
            
            // Always face camera
            sprite.lookAt(this.camera.position);
        });

        // Update UI with nearest point
        if (closest[0] && closest[0].distance < 1000) {
            document.getElementById('near-point').textContent = 
                `${closest[0].sprite.userData.filename} (${closest[0].distance.toFixed(1)}m)`;
        } else {
            document.getElementById('near-point').textContent = '-';
        }
    }

    loadSpriteAsImage(sprite) {
        const textureLoader = new THREE.TextureLoader();
        const imageUrl = sprite.userData.imageUrl;
        
        sprite.userData.isImage = true;
        
        textureLoader.load(
            imageUrl,
            (texture) => {
                // Calculate aspect ratio and resize geometry
                const aspect = texture.image.width / texture.image.height;
                const height = 5;
                const width = height * aspect;
                
                const newGeometry = new THREE.PlaneGeometry(width, height);
                const imageMaterial = new THREE.MeshBasicMaterial({ 
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide
                });
                
                // Dispose of old material and geometry
                sprite.material.dispose();
                sprite.geometry.dispose();
                
                sprite.geometry = newGeometry;
                sprite.material = imageMaterial;
                sprite.userData.texture = texture;
            },
            undefined,
            (error) => {
                console.warn(`Failed to load image: ${sprite.userData.filename}`, error);
                sprite.userData.isImage = false;
            }
        );
    }

    convertSpriteToCircle(sprite) {
        // Dispose of texture if it exists
        if (sprite.userData.texture) {
            sprite.userData.texture.dispose();
            delete sprite.userData.texture;
        }
        
        // Dispose old geometry and material
        sprite.material.dispose();
        sprite.geometry.dispose();
        
        // Create circle geometry and basic material
        sprite.geometry = new THREE.CircleGeometry(0.5, 8);
        sprite.material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        sprite.userData.isImage = false;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update camera controller
        this.controller.update();

        // Update UI
        const pos = this.camera.position;
        document.getElementById('camera-pos').textContent = 
            `${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)}`;

        this.updateNearestPoint();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ImageViewer();
});
