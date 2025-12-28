/**
 * 3D Viewer for image visualization in 3D space
 * Uses Three.js for rendering and custom camera controls
 */

class CameraController {
    constructor(camera) {
        this.camera = camera;
        this.keys = {};
        this.mouse = { x: 0, y: 0, locked: false };
        this.forwardSpeed = 0;
        this.maxSpeed = 2.5;
        this.accelStep = 0.05;
        this.drag = 0.98;
        this.rotationStep = 0.02;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            // Space key stops motion
            if (e.key === ' ') {
                this.forwardSpeed = 0;
            }
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
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);

        // Keyboard-driven view rotation (mouse still works)
        if (this.keys['w']) euler.x += this.rotationStep;
        if (this.keys['s']) euler.x -= this.rotationStep;
        if (this.keys['a']) euler.y += this.rotationStep;
        if (this.keys['d']) euler.y -= this.rotationStep;
        if (this.keys['e']) euler.z -= this.rotationStep;
        if (this.keys['y']) euler.z += this.rotationStep;

        // Prevent flipping over the top/bottom
        euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
        this.camera.quaternion.setFromEuler(euler);

        // Adjust forward speed with I/J (allow backward motion)
        const accelerating = this.keys['i'];
        const braking = this.keys['k'];
        if (accelerating) this.forwardSpeed = Math.min(this.maxSpeed, this.forwardSpeed + this.accelStep);
        if (braking) this.forwardSpeed = Math.max(-this.maxSpeed, this.forwardSpeed - this.accelStep);

        if (!accelerating && !braking) {
            this.forwardSpeed *= this.drag;
            if (Math.abs(this.forwardSpeed) < 1e-4) this.forwardSpeed = 0;
        }

        // Move along the view direction (positive = forward, negative = backward)
        if (Math.abs(this.forwardSpeed) > 0) {
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            this.camera.position.add(forward.multiplyScalar(this.forwardSpeed));
        }
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
        this.bounds = null;

        // Mini side-views (XY, XZ, YZ)
        this.sideViews = {
            xy: { canvas: null, ctx: null, off: null, offCtx: null, axes: ['x','y'], scale: 1, centerA: 0, centerB: 0, margin: 8 },
            xz: { canvas: null, ctx: null, off: null, offCtx: null, axes: ['x','z'], scale: 1, centerA: 0, centerB: 0, margin: 8 },
            yz: { canvas: null, ctx: null, off: null, offCtx: null, axes: ['y','z'], scale: 1, centerA: 0, centerB: 0, margin: 8 }
        };

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

        // Setup side-views
        this.initSideViews();
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
            // Prepare mini-view bounds and static layers
            this.bounds = stats.bounds || null;
            this.computeSideViewScales();
            this.drawSideViewsStatic();
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

    initSideViews() {
        // Grab canvases and create offscreen buffers
        const xy = this.sideViews.xy;
        const xz = this.sideViews.xz;
        const yz = this.sideViews.yz;

        xy.canvas = document.getElementById('view-xy');
        xz.canvas = document.getElementById('view-xz');
        yz.canvas = document.getElementById('view-yz');

        if (xy.canvas) xy.ctx = xy.canvas.getContext('2d');
        if (xz.canvas) xz.ctx = xz.canvas.getContext('2d');
        if (yz.canvas) yz.ctx = yz.canvas.getContext('2d');

        [xy, xz, yz].forEach(v => {
            if (!v || !v.canvas) return;
            v.off = document.createElement('canvas');
            v.off.width = v.canvas.width;
            v.off.height = v.canvas.height;
            v.offCtx = v.off.getContext('2d');
        });
    }

    computeSideViewScales() {
        if (!this.bounds) return;
        const setScale = (v) => {
            const [a, b] = v.axes; // axis names
            const w = v.canvas ? v.canvas.width : 0;
            const h = v.canvas ? v.canvas.height : 0;
            if (!w || !h) return;
            const margin = v.margin || 8;
            const aMin = this.bounds[a][0];
            const aMax = this.bounds[a][1];
            const bMin = this.bounds[b][0];
            const bMax = this.bounds[b][1];
            const aRange = Math.max(1e-6, aMax - aMin);
            const bRange = Math.max(1e-6, bMax - bMin);
            const scaleA = (w - 2 * margin) / aRange;
            const scaleB = (h - 2 * margin) / bRange;
            v.scale = Math.min(scaleA, scaleB);
            v.centerA = (aMin + aMax) / 2;
            v.centerB = (bMin + bMax) / 2;
        };
        setScale(this.sideViews.xy);
        setScale(this.sideViews.xz);
        setScale(this.sideViews.yz);
    }

    worldToCanvas(v, aVal, bVal) {
        // Center-based uniform scaling, y-axis up
        const w = v.canvas.width;
        const h = v.canvas.height;
        const x = w / 2 + (aVal - v.centerA) * v.scale;
        const y = h / 2 - (bVal - v.centerB) * v.scale;
        return { x, y };
    }

    drawSideViewsStatic() {
        // Draw static background and all points with same size
        const views = [this.sideViews.xy, this.sideViews.xz, this.sideViews.yz];
        views.forEach((v) => {
            if (!v.canvas || !v.offCtx) return;
            const ctx = v.offCtx;
            const w = v.off.width;
            const h = v.off.height;
            ctx.clearRect(0, 0, w, h);

            // Background grid (subtle)
            ctx.fillStyle = '#0f0f0f';
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.moveTo(w / 2, 0);
            ctx.lineTo(w / 2, h);
            ctx.stroke();

            // Points
            const [a, b] = v.axes;
            const radius = 2; // fixed size
            ctx.fillStyle = '#ffffff';
            this.points.forEach(p => {
                const px = this.worldToCanvas(v, p[a], p[b]);
                ctx.beginPath();
                ctx.arc(px.x, px.y, radius, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }

    drawArrow(ctx, startPx, endPx) {
        // Draw line
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startPx.x, startPx.y);
        ctx.lineTo(endPx.x, endPx.y);
        ctx.stroke();

        // Arrow head
        const dx = endPx.x - startPx.x;
        const dy = endPx.y - startPx.y;
        const angle = Math.atan2(dy, dx);
        const headLen = 8;
        ctx.beginPath();
        ctx.moveTo(endPx.x, endPx.y);
        ctx.lineTo(endPx.x - headLen * Math.cos(angle - Math.PI / 6), endPx.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endPx.x - headLen * Math.cos(angle + Math.PI / 6), endPx.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(endPx.x, endPx.y);
        ctx.fillStyle = '#4a9eff';
        ctx.fill();
    }

    drawSideViewsDynamic() {
        // Overlay the camera position and arrow
        if (!this.bounds) return;
        const views = [this.sideViews.xy, this.sideViews.xz, this.sideViews.yz];
        const camPos = this.camera.position;
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);

        views.forEach((v) => {
            if (!v.canvas || !v.ctx) return;
            const ctx = v.ctx;
            const w = v.canvas.width;
            const h = v.canvas.height;

            // Draw static layer first
            if (v.off) ctx.drawImage(v.off, 0, 0);

            // Camera position dot
            let aName = v.axes[0];
            let bName = v.axes[1];
            const posPx = this.worldToCanvas(v, camPos[aName], camPos[bName]);
            ctx.fillStyle = '#ff5e5e';
            ctx.beginPath();
            ctx.arc(posPx.x, posPx.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Camera direction arrow in plane
            const dirA = camDir[aName];
            const dirB = camDir[bName];
            let len2 = Math.hypot(dirA, dirB);
            let dir2A = dirA, dir2B = dirB;
            if (len2 < 1e-6) {
                // Fallback up arrow
                dir2A = 0; dir2B = 1; len2 = 1;
            }
            dir2A /= len2; dir2B /= len2;

            // Arrow length ~ 20% of larger range in world units, then mapped
            const rangeA = this.bounds[aName][1] - this.bounds[aName][0];
            const rangeB = this.bounds[bName][1] - this.bounds[bName][0];
            const Lw = 0.2 * Math.max(rangeA, rangeB);
            const endWorldA = camPos[aName] + dir2A * Lw;
            const endWorldB = camPos[bName] + dir2B * Lw;
            const endPx = this.worldToCanvas(v, endWorldA, endWorldB);

            this.drawArrow(ctx, posPx, endPx);
        });
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

        // If side-views exist, recompute scales and redraw static layer
        if (this.sideViews.xy.canvas) {
            this.computeSideViewScales();
            this.drawSideViewsStatic();
        }
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

        // Update side-views dynamic overlay (camera arrow)
        this.drawSideViewsDynamic();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ImageViewer();
});
