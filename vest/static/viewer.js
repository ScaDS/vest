/**
 * 3D Viewer for image visualization in 3D space
 * Uses Three.js for rendering and custom camera controls
 */

class CameraController {
    constructor(camera, element) {
        this.camera = camera;
        this.element = element || document.body;
        this.keys = {};
        this.mouse = { x: 0, y: 0, locked: false };
        this.forwardSpeed = 0;
        this.strafeSpeed = 0;
        this.verticalSpeed = 0;
        this.maxSpeed = 2.5;
        this.accelStep = 0.05;
        this.drag = 0.98;
        this.movementStep = 0.1;
        this.rotationStep = 0.005;

        // Touch controls
        this.touch = {
            active: false,
            lastX: 0,
            lastY: 0,
            isPinching: false,
            lastDistance: 0,
            centerX: 0,
            centerY: 0,
            isPanning: false
        };

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
                euler.y -= movementX * 0.002;
                euler.x -= movementY * 0.002;
                
                // Clamp vertical rotation
                euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
                
                this.camera.quaternion.setFromEuler(euler);
            }
        });

        // Click on the canvas element to toggle pointer lock
        this.element.addEventListener('click', () => {
            if (this.mouse.locked) {
                // Exit pointer lock if currently locked
                document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
                document.exitPointerLock();
            } else {
                // Request pointer lock if not currently locked
                this.element.requestPointerLock =
                    this.element.requestPointerLock || this.element.mozRequestPointerLock;
                this.element.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = document.pointerLockElement === this.element;
        });
        
        document.addEventListener('mozpointerlockchange', () => {
            this.mouse.locked = document.mozPointerLockElement === this.element;
        });

        // Mouse wheel controls for forward/backward movement
        this.element.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Get camera forward direction
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            
            // Scroll down (positive deltaY) moves backward, scroll up (negative) moves forward
            // Scale the movement by wheel delta and a sensitivity factor
            const scrollSensitivity = 0.05;
            const moveAmount = -e.deltaY * scrollSensitivity;
            
            // Move camera along its forward direction
            this.camera.position.add(forward.multiplyScalar(moveAmount));
        }, { passive: false });

        // Touch controls
        this.element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1) {
                // Single touch - rotation mode
                this.touch.active = true;
                this.touch.isPinching = false;
                this.touch.isPanning = false;
                this.touch.lastX = e.touches[0].clientX;
                this.touch.lastY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // Two finger touch - pinch zoom mode
                this.touch.active = false;
                this.touch.isPinching = true;
                this.touch.isPanning = false;
                
                const dx = e.touches[1].clientX - e.touches[0].clientX;
                const dy = e.touches[1].clientY - e.touches[0].clientY;
                this.touch.lastDistance = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate center point between two fingers
                this.touch.centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                this.touch.centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            } else if (e.touches.length >= 3) {
                // Three or more fingers - panning mode
                this.touch.active = false;
                this.touch.isPinching = false;
                this.touch.isPanning = true;
                
                // Calculate average position of all touches
                let sumX = 0, sumY = 0;
                for (let i = 0; i < e.touches.length; i++) {
                    sumX += e.touches[i].clientX;
                    sumY += e.touches[i].clientY;
                }
                this.touch.lastX = sumX / e.touches.length;
                this.touch.lastY = sumY / e.touches.length;
            }
        }, { passive: false });

        this.element.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && this.touch.active) {
                // Single touch - rotate camera
                const deltaX = e.touches[0].clientX - this.touch.lastX;
                const deltaY = e.touches[0].clientY - this.touch.lastY;
                
                const euler = new THREE.Euler(0, 0, 0, 'YXZ');
                euler.setFromQuaternion(this.camera.quaternion);
                euler.y += deltaX * 0.002;
                euler.x += deltaY * 0.002;
                
                // Clamp vertical rotation
                euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
                
                this.camera.quaternion.setFromEuler(euler);
                
                this.touch.lastX = e.touches[0].clientX;
                this.touch.lastY = e.touches[0].clientY;
            } else if (e.touches.length === 2 && this.touch.isPinching) {
                // Two finger touch - pinch to zoom
                const dx = e.touches[1].clientX - e.touches[0].clientX;
                const dy = e.touches[1].clientY - e.touches[0].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate new center point
                const newCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const newCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                
                // Calculate zoom direction towards the pinch center
                const zoomDelta = distance - this.touch.lastDistance;
                
                // Convert screen space center to normalized device coordinates
                const ndcX = (newCenterX / window.innerWidth) * 2 - 1;
                const ndcY = -(newCenterY / window.innerHeight) * 2 + 1;
                
                // Create a raycaster from the camera through the pinch center point
                const raycaster = new THREE.Raycaster();
                const mouseVector = new THREE.Vector2(ndcX, ndcY);
                raycaster.setFromCamera(mouseVector, this.camera);
                
                // Get the direction from camera to the pinch center
                const direction = raycaster.ray.direction.clone();
                
                // Move camera along this direction
                const zoomSensitivity = 0.03;
                const moveAmount = zoomDelta * zoomSensitivity;
                this.camera.position.add(direction.multiplyScalar(moveAmount));
                
                this.touch.lastDistance = distance;
                this.touch.centerX = newCenterX;
                this.touch.centerY = newCenterY;
            } else if (e.touches.length >= 3 && this.touch.isPanning) {
                // Three or more fingers - pan the view
                // Calculate average position of all touches
                let sumX = 0, sumY = 0;
                for (let i = 0; i < e.touches.length; i++) {
                    sumX += e.touches[i].clientX;
                    sumY += e.touches[i].clientY;
                }
                const avgX = sumX / e.touches.length;
                const avgY = sumY / e.touches.length;
                
                const deltaX = avgX - this.touch.lastX;
                const deltaY = avgY - this.touch.lastY;
                
                // Get camera right vector for horizontal panning
                const right = new THREE.Vector3();
                this.camera.getWorldDirection(right);
                right.cross(this.camera.up).normalize();
                
                // Get world up vector for vertical panning
                const up = new THREE.Vector3(0, 1, 0);
                
                // Pan sensitivity
                const panSensitivity = 0.02;
                
                // Move camera based on touch movement
                this.camera.position.add(right.multiplyScalar(-deltaX * panSensitivity));
                this.camera.position.add(up.multiplyScalar(deltaY * panSensitivity));
                
                this.touch.lastX = avgX;
                this.touch.lastY = avgY;
            }
        }, { passive: false });

        this.element.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 0) {
                this.touch.active = false;
                this.touch.isPinching = false;
                this.touch.isPanning = false;
            } else if (e.touches.length === 1) {
                // Transition to single touch mode
                this.touch.active = true;
                this.touch.isPinching = false;
                this.touch.isPanning = false;
                this.touch.lastX = e.touches[0].clientX;
                this.touch.lastY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // Transition to two-finger mode
                this.touch.active = false;
                this.touch.isPinching = true;
                this.touch.isPanning = false;
                
                const dx = e.touches[1].clientX - e.touches[0].clientX;
                const dy = e.touches[1].clientY - e.touches[0].clientY;
                this.touch.lastDistance = Math.sqrt(dx * dx + dy * dy);
                this.touch.centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                this.touch.centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            } else if (e.touches.length >= 3) {
                // Transition to three-finger mode
                this.touch.active = false;
                this.touch.isPinching = false;
                this.touch.isPanning = true;
                
                let sumX = 0, sumY = 0;
                for (let i = 0; i < e.touches.length; i++) {
                    sumX += e.touches[i].clientX;
                    sumY += e.touches[i].clientY;
                }
                this.touch.lastX = sumX / e.touches.length;
                this.touch.lastY = sumY / e.touches.length;
            }
        }, { passive: false });
    }

    setupArrowButtons() {
        const buttonMappings = {
            'btn-forward': 'w',
            'btn-back': 's',
            'btn-left': 'a',
            'btn-right': 'd',
            'btn-up': 'e',
            'btn-down': 'y'
        };

        Object.keys(buttonMappings).forEach(btnId => {
            const button = document.getElementById(btnId);
            if (!button) return;
            
            const key = buttonMappings[btnId];
            
            // Mouse events
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.keys[key] = true;
            });
            
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.keys[key] = false;
            });
            
            button.addEventListener('mouseleave', (e) => {
                this.keys[key] = false;
            });
            
            // Touch events for mobile
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[key] = true;
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[key] = false;
            });
            
            button.addEventListener('touchcancel', (e) => {
                this.keys[key] = false;
            });
        });
    }

    update(deltaTime = 1) {
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);

        // Keyboard-driven view rotation (mouse still works)
        if (this.keys['i']) euler.x += this.rotationStep;
        if (this.keys['k']) euler.x -= this.rotationStep;
        if (this.keys['j']) euler.y += this.rotationStep;
        if (this.keys['l']) euler.y -= this.rotationStep;
        if (this.keys['o']) euler.z -= this.rotationStep;
        if (this.keys['m']) euler.z += this.rotationStep;

        // Prevent flipping over the top/bottom
        euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
        this.camera.quaternion.setFromEuler(euler);

        // Adjust forward speed with W/S (allow backward motion)
        this.forwardSpeed = 0;
        if (this.keys['w']) this.forwardSpeed += this.movementStep;
        if (this.keys['s']) this.forwardSpeed -= this.movementStep;

        // Adjust strafe speed with A/D (left/right)
        this.strafeSpeed = 0;
        if (this.keys['a']) this.strafeSpeed -= this.movementStep;
        if (this.keys['d']) this.strafeSpeed += this.movementStep;

        // Adjust vertical speed with E/Y (up/down)
        this.verticalSpeed = 0;
        if (this.keys['e']) this.verticalSpeed += this.movementStep;
        if (this.keys['y']) this.verticalSpeed -= this.movementStep;

        // No drag - speed remains constant unless user actively changes it

        // Move along the view direction (positive = forward, negative = backward)
        if (Math.abs(this.forwardSpeed) > 0) {
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            this.camera.position.add(forward.multiplyScalar(this.forwardSpeed * deltaTime));
        }

        // Move left/right (strafe)
        if (Math.abs(this.strafeSpeed) > 0) {
            const right = new THREE.Vector3();
            this.camera.getWorldDirection(right);
            right.cross(this.camera.up).normalize();
            this.camera.position.add(right.multiplyScalar(this.strafeSpeed * deltaTime));
        }

        // Move up/down (vertical) relative to camera orientation
        if (Math.abs(this.verticalSpeed) > 0) {
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);

            const right = new THREE.Vector3();
            right.crossVectors(forward, this.camera.up).normalize();

            const up = new THREE.Vector3();
            up.crossVectors(right, forward).normalize();

            this.camera.position.add(up.multiplyScalar(this.verticalSpeed * deltaTime));
        }
    }
}

class ImageViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.nearestCount = 50;
        this.controller = null;
        this.points = [];
        this.imageSprites = [];
        this.imageBasePath = '';
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.bounds = null;
        this.imageSize = 0.25; // Default image size
        this.renderImages = true; // Render images flag
        this.fovConeAngle = 35; // Field of view cone angle in degrees
        this.fovConeThreshold = 0.5; // Cosine of cone angle (dot product threshold)
        this.lastTime = performance.now();
        
        // Store initial camera state for reset (will be set after data loads)
        this.initialCameraPosition = null;
        this.initialCameraTarget = null;

        // Mini side-views (XY, XZ, YZ)
        this.sideViews = {
            xy: { canvas: null, ctx: null, off: null, offCtx: null, axes: ['x','y'], scale: 1, centerA: 0, centerB: 0, margin: 8 },
            xz: { canvas: null, ctx: null, off: null, offCtx: null, axes: ['x','z'], scale: 1, centerA: 0, centerB: 0, margin: 8 },
            yz: { canvas: null, ctx: null, off: null, offCtx: null, axes: ['y','z'], scale: 1, centerA: 0, centerB: 0, margin: 8 }
        };

        // Keyframe animation
        this.keyframes = [];
        this.isPlayingKeyframes = false;
        this.keyframeSpeed = 1.0;
        this.keyframeProgress = 0;
        this.keyframeStartTime = 0;

        // Coloring mode: default to legacy XYZ mapping.
        this.colorMode = 'xyz';
        this.numericColorColumns = [];
        this.numericColumnBounds = {};
        this.colorDisplayRanges = {};

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
        this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 10000);
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Camera controller - pass renderer.domElement for pointer lock
        this.controller = new CameraController(this.camera, this.renderer.domElement);

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

        // Setup image size slider
        this.initImageSizeSlider();

        // Setup nearest count slider
        this.initNearestCountSlider();

        // Setup FOV cone slider
        this.initFovConeSlider();

        // Setup side-views
        this.initSideViews();

        // Setup keyframe controls
        this.initKeyframeControls();

        // Setup color mode dropdown
        this.initColorModeControl();
        this.initColorIntensityControls();

        // Setup arrow button controls
        this.controller.setupArrowButtons();

        // Setup global keyboard shortcuts
        this.initGlobalKeyboardShortcuts();
    }

    computeColorFromXYZ(x, y, z, bounds) {
        if (!bounds) {
            return { r: 200, g: 200, b: 200 };
        }

        // Normalize coordinates to [-0.5, 0.5] range (centered)
        const xNorm = (x - bounds.x[0]) / (bounds.x[1] - bounds.x[0]) - 0.5;
        const yNorm = (y - bounds.y[0]) / (bounds.y[1] - bounds.y[0]) - 0.5;
        const zNorm = (z - bounds.z[0]) / (bounds.z[1] - bounds.z[0]) - 0.5;
        
        // Color scheme for 6 directions:
        // +X: Red,     -X: Cyan (G+B)
        // +Y: Green,   -Y: Magenta (R+B)
        // +Z: Blue,    -Z: Yellow (R+G)
        
        // Start with base grey to ensure minimum brightness
        const baseGrey = 80;
        const colorStrength = 175; // Maximum additional color contribution
        
        let r = baseGrey;
        let g = baseGrey;
        let b = baseGrey;
        
        // X axis contribution
        if (xNorm > 0) {
            // Positive X: add Red
            r += xNorm * 2 * colorStrength;
        } else {
            // Negative X: add Cyan (Green + Blue)
            g += Math.abs(xNorm) * 2 * colorStrength;
            b += Math.abs(xNorm) * 2 * colorStrength;
        }
        
        // Y axis contribution
        if (yNorm > 0) {
            // Positive Y: add Green
            g += yNorm * 2 * colorStrength;
        } else {
            // Negative Y: add Magenta (Red + Blue)
            r += Math.abs(yNorm) * 2 * colorStrength;
            b += Math.abs(yNorm) * 2 * colorStrength;
        }
        
        // Z axis contribution
        if (zNorm > 0) {
            // Positive Z: add Blue
            b += zNorm * 2 * colorStrength;
        } else {
            // Negative Z: add Yellow (Red + Green)
            r += Math.abs(zNorm) * 2 * colorStrength;
            g += Math.abs(zNorm) * 2 * colorStrength;
        }
        
        // Clamp values to [0, 255]
        r = Math.min(255, Math.max(0, Math.floor(r)));
        g = Math.min(255, Math.max(0, Math.floor(g)));
        b = Math.min(255, Math.max(0, Math.floor(b)));
        
        return { r, g, b };
    }

    interpolateRgb(colorA, colorB, t) {
        const clampT = Math.max(0, Math.min(1, t));
        return {
            r: Math.round(colorA.r + (colorB.r - colorA.r) * clampT),
            g: Math.round(colorA.g + (colorB.g - colorA.g) * clampT),
            b: Math.round(colorA.b + (colorB.b - colorA.b) * clampT)
        };
    }

    computeBlueWhiteOrangeColor(value, min, max) {
        if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
            return { r: 255, g: 255, b: 255 };
        }

        const t = (value - min) / (max - min);
        const lowBlue = { r: 49, g: 130, b: 189 };
        const midWhite = { r: 255, g: 255, b: 255 };
        const highOrange = { r: 230, g: 97, b: 1 };

        if (t <= 0.5) {
            return this.interpolateRgb(lowBlue, midWhite, t * 2);
        }

        return this.interpolateRgb(midWhite, highOrange, (t - 0.5) * 2);
    }

    getPointColorRGB(point) {
        if (!point) {
            return { r: 200, g: 200, b: 200 };
        }

        if (this.colorMode === 'xyz') {
            return this.computeColorFromXYZ(point.x, point.y, point.z, this.bounds);
        }

        const bounds = this.colorDisplayRanges[this.colorMode] || this.numericColumnBounds[this.colorMode];
        const numericValue = Number(point[this.colorMode]);
        return this.computeBlueWhiteOrangeColor(numericValue, bounds?.min, bounds?.max);
    }

    refreshColorRendering() {
        this.drawSideViewsStatic();
        this.reloadLoadedImages();
        this.updateNearestPoint();
    }

    initColorModeControl() {
        const select = document.getElementById('color-mode-select');
        if (!select) return;

        select.addEventListener('change', (e) => {
            this.colorMode = e.target.value || 'xyz';
            this.updateColorIntensityUI();
            this.refreshColorRendering();
        });
    }

    initColorIntensityControls() {
        const minSlider = document.getElementById('color-intensity-min-slider');
        const maxSlider = document.getElementById('color-intensity-max-slider');

        if (!minSlider || !maxSlider) return;

        const onSliderChange = (source) => {
            if (this.colorMode === 'xyz') {
                return;
            }

            const col = this.colorMode;
            const fullBounds = this.numericColumnBounds[col];
            if (!fullBounds) {
                return;
            }

            let minVal = parseFloat(minSlider.value);
            let maxVal = parseFloat(maxSlider.value);

            if (source === 'min' && minVal > maxVal) {
                maxVal = minVal;
                maxSlider.value = String(maxVal);
            }

            if (source === 'max' && maxVal < minVal) {
                minVal = maxVal;
                minSlider.value = String(minVal);
            }

            minVal = Math.max(fullBounds.min, Math.min(fullBounds.max, minVal));
            maxVal = Math.max(fullBounds.min, Math.min(fullBounds.max, maxVal));

            this.colorDisplayRanges[col] = { min: minVal, max: maxVal };
            this.updateColorIntensityUI();
            this.refreshColorRendering();
        };

        minSlider.addEventListener('input', () => onSliderChange('min'));
        maxSlider.addEventListener('input', () => onSliderChange('max'));
    }

    updateColorIntensityUI() {
        const container = document.getElementById('color-intensity-controls');
        const minSlider = document.getElementById('color-intensity-min-slider');
        const maxSlider = document.getElementById('color-intensity-max-slider');
        const minValue = document.getElementById('color-intensity-min-value');
        const maxValue = document.getElementById('color-intensity-max-value');
        const leftMask = document.getElementById('color-gradient-mask-left');
        const rightMask = document.getElementById('color-gradient-mask-right');

        if (!container || !minSlider || !maxSlider || !minValue || !maxValue || !leftMask || !rightMask) {
            return;
        }

        if (this.colorMode === 'xyz') {
            container.classList.add('hidden');
            return;
        }

        const fullBounds = this.numericColumnBounds[this.colorMode];
        if (!fullBounds) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        if (!this.colorDisplayRanges[this.colorMode]) {
            this.colorDisplayRanges[this.colorMode] = {
                min: fullBounds.min,
                max: fullBounds.max
            };
        }

        const displayRange = this.colorDisplayRanges[this.colorMode];
        displayRange.min = Math.max(fullBounds.min, Math.min(fullBounds.max, displayRange.min));
        displayRange.max = Math.max(fullBounds.min, Math.min(fullBounds.max, displayRange.max));
        if (displayRange.max < displayRange.min) {
            displayRange.max = displayRange.min;
        }

        const totalRange = Math.max(1e-12, fullBounds.max - fullBounds.min);
        const step = totalRange / 500;

        minSlider.min = String(fullBounds.min);
        minSlider.max = String(fullBounds.max);
        minSlider.step = String(step);
        minSlider.value = String(displayRange.min);

        maxSlider.min = String(fullBounds.min);
        maxSlider.max = String(fullBounds.max);
        maxSlider.step = String(step);
        maxSlider.value = String(displayRange.max);

        minValue.textContent = displayRange.min.toFixed(3);
        maxValue.textContent = displayRange.max.toFixed(3);

        const leftPct = ((displayRange.min - fullBounds.min) / totalRange) * 100;
        const rightPct = ((displayRange.max - fullBounds.min) / totalRange) * 100;
        leftMask.style.width = `${Math.max(0, Math.min(100, leftPct)).toFixed(2)}%`;
        rightMask.style.width = `${Math.max(0, Math.min(100, 100 - rightPct)).toFixed(2)}%`;
    }

    updateColorModeOptions() {
        const select = document.getElementById('color-mode-select');
        if (!select) return;

        const preserveMode = this.colorMode;
        this.numericColorColumns = [];
        this.numericColumnBounds = {};

        if (this.points.length > 0) {
            const firstPoint = this.points[0] || {};
            const candidateColumns = Object.keys(firstPoint).filter(col => !['x', 'y', 'z', 'filename'].includes(col));

            candidateColumns.forEach(col => {
                const numericValues = this.points
                    .map(p => Number(p[col]))
                    .filter(v => Number.isFinite(v));

                if (numericValues.length === 0) {
                    return;
                }

                this.numericColorColumns.push(col);
                this.numericColumnBounds[col] = {
                    min: Math.min(...numericValues),
                    max: Math.max(...numericValues)
                };

                if (!this.colorDisplayRanges[col]) {
                    this.colorDisplayRanges[col] = {
                        min: this.numericColumnBounds[col].min,
                        max: this.numericColumnBounds[col].max
                    };
                }
            });
        }

        select.innerHTML = '';

        const xyzOption = document.createElement('option');
        xyzOption.value = 'xyz';
        xyzOption.textContent = 'X/Y/Z';
        select.appendChild(xyzOption);

        this.numericColorColumns.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            select.appendChild(option);
        });

        const canKeepPrevious = preserveMode === 'xyz' || this.numericColorColumns.includes(preserveMode);
        this.colorMode = canKeepPrevious ? preserveMode : 'xyz';
        select.value = this.colorMode;
        this.updateColorIntensityUI();
    }

    async loadData() {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();

            this.points = data.points;
            this.imageBasePath = data.image_base_path;
            this.updateColorModeOptions();

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

    getRenderableByPointIndex(pointIndex) {
        if (!Number.isInteger(pointIndex) || pointIndex < 0) {
            return null;
        }

        if (pointIndex < this.imageSprites.length) {
            const candidate = this.imageSprites[pointIndex];
            if (candidate && candidate.userData && candidate.userData.index === pointIndex) {
                return candidate;
            }
        }

        return this.imageSprites.find(obj => obj?.userData?.index === pointIndex) || null;
    }

    disposeMaterial(material) {
        if (!material) return;

        const disposeOne = (mat) => {
            if (!mat) return;
            if (mat.map) {
                mat.map.dispose();
                mat.map = null;
            }
            mat.dispose();
        };

        if (Array.isArray(material)) {
            material.forEach(disposeOne);
            return;
        }

        disposeOne(material);
    }

    disposeRenderable(obj, { disposeUserTexture = true } = {}) {
        if (!obj) return;

        if (disposeUserTexture && obj.userData?.texture) {
            obj.userData.texture.dispose();
            delete obj.userData.texture;
        }

        if (obj.geometry) {
            obj.geometry.dispose();
        }

        this.disposeMaterial(obj.material);
    }

    removeRenderableFromScene(obj, { disposeUserTexture = true } = {}) {
        if (!obj) return;

        if (obj.parent) {
            obj.parent.remove(obj);
        }

        this.disposeRenderable(obj, { disposeUserTexture });
    }

    createScene(stats) {
        // Clear existing sprites
        this.imageSprites.forEach(sprite => this.removeRenderableFromScene(sprite));
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

            // Create a sprite for point-like visualization
            const material = new THREE.SpriteMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
                sizeAttenuation: true
            });
            const sprite = new THREE.Sprite(material);
            sprite.position.set(x, y, z);
            sprite.scale.set(0.5, 0.5, 1);
            sprite.userData = { filename, index, imageUrl: `/api/image/${filename}`, textureLoader, isSprite: true };

            this.scene.add(sprite);
            this.imageSprites.push(sprite);
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
            
            // Store this as the initial camera state for reset view
            this.initialCameraPosition = this.camera.position.clone();
            this.initialCameraTarget = new THREE.Vector3(centerX, centerY, centerZ);
        }
    }

    initImageSizeSlider() {
        const slider = document.getElementById('image-size-slider');
        const valueDisplay = document.getElementById('image-size-value');
        
        if (!slider || !valueDisplay) return;
        
        // Logarithmic scale: slider value is the exponent (base 10)
        // Range: -2 to 1 (0.01 to 10)
        const updateImageSize = () => {
            const exponent = parseFloat(slider.value);
            this.imageSize = Math.pow(10, exponent);
            valueDisplay.textContent = this.imageSize.toFixed(2);
            
            // Reload all images that are currently loaded
            this.reloadLoadedImages();
            
            // Redraw side views with new point sizes
            this.drawSideViewsStatic();
        };
        
        // Initialize display
        updateImageSize();
        
        // Listen for changes
        slider.addEventListener('input', updateImageSize);
    }
    
    reloadLoadedImages() {
        // Reload all sprites that currently have images loaded
        this.imageSprites.forEach(sprite => {
            if (sprite.userData.isImage) {
                this.loadSpriteAsImage(sprite);
            }
        });
    }

    initNearestCountSlider() {
        const slider = document.getElementById('nearest-count-slider');
        const valueDisplay = document.getElementById('nearest-count-value');
        
        if (!slider || !valueDisplay) return;
        
        const updateNearestCount = () => {
            this.nearestCount = parseInt(slider.value);
            // Display "All" when at maximum (500)
            valueDisplay.textContent = this.nearestCount >= 500 ? 'All' : this.nearestCount;
        };
        
        // Initialize display
        updateNearestCount();
        
        // Listen for changes
        slider.addEventListener('input', updateNearestCount);
    }

    initFovConeSlider() {
        const slider = document.getElementById('fov-cone-slider');
        const valueDisplay = document.getElementById('fov-cone-value');
        
        if (!slider || !valueDisplay) return;
        
        const updateFovCone = () => {
            this.fovConeAngle = parseFloat(slider.value);
            valueDisplay.textContent = this.fovConeAngle.toFixed(0);
            
            // Convert angle to dot product threshold
            // Cone angle is the full cone, so half-angle is used for cosine
            const halfAngleRad = (this.fovConeAngle / 2) * (Math.PI / 180);
            this.fovConeThreshold = Math.cos(halfAngleRad);
        };
        
        // Initialize display
        updateFovCone();
        
        // Listen for changes
        slider.addEventListener('input', updateFovCone);
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

        // Setup drag controls for each side view
        this.setupSideViewDragControls();
    }

    setupSideViewDragControls() {
        const views = [this.sideViews.xy, this.sideViews.xz, this.sideViews.yz];
        
        views.forEach((v) => {
            if (!v.canvas) {
                console.warn('Canvas not found for side view:', v.axes);
                return;
            }
            
            // Ensure canvas has pointer events enabled
            v.canvas.style.cursor = 'crosshair';
            
            let mouseDownPos = null;
            v.isDragging = false;
            
            v.canvas.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = v.canvas.getBoundingClientRect();
                mouseDownPos = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                v.isDragging = true;
                v.canvas.style.cursor = 'grabbing';
            });
            
            v.canvas.addEventListener('mousemove', (e) => {
                if (v.isDragging && mouseDownPos) {
                    v.canvas.style.cursor = 'grabbing';
                }
            });
            
            v.canvas.addEventListener('mouseup', (e) => {
                if (!mouseDownPos) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                const rect = v.canvas.getBoundingClientRect();
                const mouseUpPos = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
                
                // Convert canvas positions to world coordinates
                const worldDown = this.canvasToWorld(v, mouseDownPos.x, mouseDownPos.y);
                const worldUp = this.canvasToWorld(v, mouseUpPos.x, mouseUpPos.y);
                
                // Apply the drag to camera position and orientation
                this.applySideViewDrag(v, worldDown, worldUp);
                
                mouseDownPos = null;
                v.isDragging = false;
                v.canvas.style.cursor = 'crosshair';
            });
            
            // Reset on mouse leave
            v.canvas.addEventListener('mouseleave', () => {
                mouseDownPos = null;
                v.isDragging = false;
                v.canvas.style.cursor = 'crosshair';
            });
        });
    }

    applySideViewDrag(view, worldDown, worldUp) {
        const [axisA, axisB] = view.axes;
        
        // Get current camera direction to preserve the unchanged component
        const currentDirection = new THREE.Vector3();
        this.camera.getWorldDirection(currentDirection);
        
        // Set camera position based on mouse-down world coordinates
        // Only update the axes that are being modified in this view
        if (axisA === 'x' && axisB === 'y') {
            // XY view: modify X and Y, preserve Z
            this.camera.position.x = worldDown.a;
            this.camera.position.y = worldDown.b;
            // Z stays as is
        } else if (axisA === 'x' && axisB === 'z') {
            // XZ view: modify X and Z, preserve Y
            this.camera.position.x = worldDown.a;
            this.camera.position.z = worldDown.b;
            // Y stays as is
        } else if (axisA === 'y' && axisB === 'z') {
            // YZ view: modify Y and Z, preserve X
            this.camera.position.y = worldDown.a;
            this.camera.position.z = worldDown.b;
            // X stays as is
        }
        
        // Calculate the direction vector from down to up (in world space)
        const deltaA = worldUp.a - worldDown.a;
        const deltaB = worldUp.b - worldDown.b;
        
        // Build the 3D direction vector based on which view we're in
        // Preserve the component in the dimension not controlled by this view
        let directionX, directionY, directionZ;
        
        if (axisA === 'x' && axisB === 'y') {
            // XY view: drag in X-Y plane, preserve Z direction
            directionX = deltaA;
            directionY = deltaB;
            directionZ = currentDirection.z;
        } else if (axisA === 'x' && axisB === 'z') {
            // XZ view: drag in X-Z plane, preserve Y direction
            directionX = deltaA;
            directionY = currentDirection.y;
            directionZ = deltaB;
        } else if (axisA === 'y' && axisB === 'z') {
            // YZ view: drag in Y-Z plane, preserve X direction
            directionX = currentDirection.x;
            directionY = deltaA;
            directionZ = deltaB;
        }
        
        // Create direction vector and normalize it
        const direction = new THREE.Vector3(directionX, directionY, directionZ);
        const length = direction.length();
        
        // Only update orientation if there's a meaningful drag
        if (length > 1e-6) {
            direction.normalize();
            
            // Set camera to look in this direction
            // We need to calculate the target point along this direction
            const target = new THREE.Vector3(
                this.camera.position.x + direction.x,
                this.camera.position.y + direction.y,
                this.camera.position.z + direction.z
            );
            
            this.camera.lookAt(target);
        }
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

    canvasToWorld(v, canvasX, canvasY) {
        // Inverse of worldToCanvas
        const w = v.canvas.width;
        const h = v.canvas.height;
        const aVal = v.centerA + (canvasX - w / 2) / v.scale;
        const bVal = v.centerB - (canvasY - h / 2) / v.scale;
        return { a: aVal, b: bVal };
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
            const radius = 2; // Fixed size, independent of image size
            this.points.forEach(p => {
                const rgb = this.getPointColorRGB(p);
                ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                
                const px = this.worldToCanvas(v, p[a], p[b]);
                ctx.beginPath();
                ctx.arc(px.x, px.y, radius, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }

    drawArrow(ctx, startPx, endPx) {
        // Draw line
        ctx.strokeStyle = '#ffffff';
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
        ctx.fillStyle = '#ffffff';
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

            // Draw keyframe path lines if multiple keyframes exist
            let aName = v.axes[0];
            let bName = v.axes[1];
            if (this.keyframes.length >= 2) {
                ctx.strokeStyle = '#ff0000';  // Red color
                ctx.lineWidth = 2;
                ctx.beginPath();
                
                // Draw lines connecting consecutive keyframes
                for (let i = 0; i < this.keyframes.length; i++) {
                    const keyframe = this.keyframes[i];
                    const kfPos = keyframe.position;
                    const kfPx = this.worldToCanvas(v, kfPos[aName], kfPos[bName]);
                    
                    if (i === 0) {
                        ctx.moveTo(kfPx.x, kfPx.y);
                    } else {
                        ctx.lineTo(kfPx.x, kfPx.y);
                    }
                }
                ctx.stroke();
                
                // Draw small circles at keyframe positions
                ctx.fillStyle = '#ff0000';
                for (let i = 0; i < this.keyframes.length; i++) {
                    const keyframe = this.keyframes[i];
                    const kfPos = keyframe.position;
                    const kfPx = this.worldToCanvas(v, kfPos[aName], kfPos[bName]);
                    
                    ctx.beginPath();
                    ctx.arc(kfPx.x, kfPx.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Camera position dot
            const posPx = this.worldToCanvas(v, camPos[aName], camPos[bName]);
            ctx.fillStyle = '#ffffff';
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
        if (this.points.length > 0) {
            const xs = this.points.map(p => p.x);
            const ys = this.points.map(p => p.y);
            const zs = this.points.map(p => p.z);

            const boundsElement = document.getElementById('bounds');
            if (boundsElement) {
                const boundsText = `X: [${Math.min(...xs).toFixed(1)}, ${Math.max(...xs).toFixed(1)}]<br>
                                   Y: [${Math.min(...ys).toFixed(1)}, ${Math.max(...ys).toFixed(1)}]<br>
                                   Z: [${Math.min(...zs).toFixed(1)}, ${Math.max(...zs).toFixed(1)}]`;
                boundsElement.innerHTML = boundsText;
            }
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

        // Get camera forward direction
        const cameraForward = new THREE.Vector3();
        this.camera.getWorldDirection(cameraForward);

        // Calculate distances for all sprites and check if they're in front of camera
        const distances = this.imageSprites.map((sprite, index) => {
            const distance = this.camera.position.distanceTo(sprite.position);
            
            // Vector from camera to sprite
            const toSprite = new THREE.Vector3().subVectors(sprite.position, this.camera.position);
            toSprite.normalize();
            
            // Dot product: check if sprite is within FOV cone
            const dotProduct = cameraForward.dot(toSprite);
            
            return {
                sprite,
                distance,
                index,
                inFront: dotProduct > this.fovConeThreshold
            };
        });

        // Filter to only include sprites in front of camera, then sort by distance
        const inFrontSprites = distances.filter(item => item.inFront);
        inFrontSprites.sort((a, b) => a.distance - b.distance);

        // Get the nearest N closest that are in front
        // If nearestCount is at max (500), show all images
        const closestCount = this.nearestCount >= 500 ? inFrontSprites.length : Math.min(this.nearestCount, inFrontSprites.length);
    const closest = inFrontSprites.slice(0, closestCount);
    const closestSet = new Set(closest.map(item => item.sprite));
        
        // Find min and max distance for normalization (only among sprites in front)
        const maxDist = inFrontSprites.length > 0 ? inFrontSprites[inFrontSprites.length - 1].distance : 0;
        const minDist = inFrontSprites.length > 0 ? inFrontSprites[0].distance : 0;
        const distRange = maxDist - minDist;

        // Update all sprites
        distances.forEach((item, idx) => {
            const { sprite, distance, inFront } = item;
            
            // Only show images for sprites that are in front of the camera and if renderImages is enabled
            const isClosest = inFront && closestSet.has(sprite);

            if (isClosest && this.renderImages) {
                // Load as image if not already loaded
                if (!sprite.userData.isImage && !sprite.userData.imageLoadPending) {
                    this.loadSpriteAsImage(sprite);
                } else {
                    // Update image size dynamically based on current distance and imageSize setting
                    if (sprite.type === 'Mesh' && sprite.userData.aspect) {
                        const aspect = sprite.userData.aspect;
                        const baseHeight = this.imageSize;
                        const baseWidth = baseHeight * aspect;
                        
                        // Distance-based scaling to maintain consistent apparent size
                        const minDistance = 5.0; // Reference distance
                        const distanceScale = Math.sqrt(distance / minDistance);
                        
                        const finalHeight = baseHeight * distanceScale;
                        const finalWidth = baseWidth * distanceScale;
                        
                        // Update geometry if size has changed significantly
                        if (sprite.geometry) {
                            const currentWidth = sprite.geometry.parameters.width;
                            const currentHeight = sprite.geometry.parameters.height;
                            const sizeDiff = Math.abs(currentWidth - finalWidth) + Math.abs(currentHeight - finalHeight);
                            
                            // Only recreate geometry if size difference is significant (> 1% of target size)
                            if (sizeDiff > (finalWidth + finalHeight) * 0.01) {
                                sprite.geometry.dispose();
                                sprite.geometry = new THREE.PlaneGeometry(finalWidth, finalHeight);
                            }
                        }
                    }
                }
            } else {
                // Convert to rectangle if it's currently an image
                if (sprite.userData.isImage || sprite.userData.imageLoadPending) {
                    this.convertSpriteToRectangle(sprite);
                }
                
                // Update dot appearance based on distance
                // Normalize distance (0 = closest, 1 = furthest)
                const normalizedDist = distRange > 0 ? (distance - minDist) / distRange : 0;
                
                // Base size in world units - use imageSize for consistency with images
                const baseSize = this.imageSize;
                
                // Distance-based scaling: use logarithmic scale to maintain more consistent size
                // Scale grows slowly with distance to compensate for perspective shrinking
                const minDistance = 5.0; // Reference distance
                const distanceScale = Math.sqrt(distance / minDistance);
                
                // Apply distance scaling with slight size variation based on depth
                let finalSize = baseSize * distanceScale * (1.0 - normalizedDist * 0.3);
                
                const pointData = this.points[sprite.userData.index];
                const rgb = this.getPointColorRGB(pointData);
                const color = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
                
                // Opacity: more opaque when closer
                const opacity = 1.0 - (normalizedDist * 0.4);
                
                // Update sprite size and appearance
                if (sprite.userData.isSprite) {
                    sprite.scale.set(finalSize, finalSize, 1);
                } else if (sprite.geometry && sprite.geometry.type === 'PlaneGeometry') {
                    sprite.geometry.dispose();
                    sprite.geometry = new THREE.PlaneGeometry(finalSize, finalSize);
                }
                
                // Update material
                sprite.material.color.setHex(color);
                sprite.material.opacity = opacity;
                
                // Make sprite visible now that color is set (prevents white flash on load)
                if (!sprite.visible) {
                    sprite.visible = true;
                }
            }
            
            // Face camera (sprites automatically billboard, meshes need manual update)
            if (sprite.type === 'Mesh') {
                sprite.lookAt(this.camera.position);
            }
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
        if (!sprite?.userData) {
            return;
        }

        const pointIndex = sprite.userData.index;
        const textureLoader = new THREE.TextureLoader();
        const imageUrl = sprite.userData.imageUrl;

        const loadToken = (sprite.userData.imageLoadToken || 0) + 1;
        sprite.userData.imageLoadToken = loadToken;
        sprite.userData.imageLoadPending = true;
        sprite.userData.isImage = true;
        sprite.userData.isSprite = false;
        
        // Hide the sprite while the image is loading to prevent white square flash
        sprite.visible = false;

        const isRequestStillValid = () => {
            const current = this.getRenderableByPointIndex(pointIndex);
            if (!current?.userData) return false;
            return (
                current.userData.imageLoadToken === loadToken &&
                current.userData.isImage === true
            );
        };

        textureLoader.load(
            imageUrl,
            (texture) => {
                if (!isRequestStillValid()) {
                    texture.dispose();
                    return;
                }

                const currentObj = this.getRenderableByPointIndex(pointIndex);
                if (!currentObj?.userData) {
                    texture.dispose();
                    return;
                }

                // Frame color follows the active color mode.
                const pointData = this.points[pointIndex];
                const rgb = this.getPointColorRGB(pointData);
                const frameColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                
                // Create a canvas to draw the image with a colored frame
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const img = texture.image;
                const frameWidth = Math.max(3, Math.floor(img.width * 0.03)); // 3% of image width, minimum 3px
                
                // Set canvas size to accommodate image plus frame
                canvas.width = img.width + frameWidth * 2;
                canvas.height = img.height + frameWidth * 2;
                
                // Draw the colored frame (border)
                ctx.fillStyle = frameColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw the original image on top, leaving the frame visible
                ctx.drawImage(img, frameWidth, frameWidth, img.width, img.height);
                
                // Create a new texture from the canvas
                const framedTexture = new THREE.CanvasTexture(canvas);
                framedTexture.needsUpdate = true;
                
                // Calculate and store aspect ratio (based on canvas, not original image)
                const aspect = canvas.width / canvas.height;
                currentObj.userData.aspect = aspect;
                
                // Match the original sprite size (0.5 units)
                // Use the sprite's scale as base to ensure smooth transition
                const spriteBaseSize = 0.5; // matches the initial sprite scale
                const baseHeight = spriteBaseSize;
                const baseWidth = baseHeight * aspect;
                
                const newGeometry = new THREE.PlaneGeometry(baseWidth, baseHeight);
                const imageMaterial = new THREE.MeshBasicMaterial({ 
                    map: framedTexture,
                    transparent: true,
                    side: THREE.DoubleSide
                });
                
                // If it's a sprite, convert to mesh
                if (currentObj.type === 'Sprite') {
                    // Remove old sprite from scene
                    this.removeRenderableFromScene(currentObj, { disposeUserTexture: false });
                    
                    // Create new mesh
                    const mesh = new THREE.Mesh(newGeometry, imageMaterial);
                    mesh.position.copy(currentObj.position);
                    mesh.userData = currentObj.userData;
                    mesh.userData.texture = framedTexture;
                    mesh.userData.isImage = true;
                    mesh.userData.isSprite = false;
                    mesh.userData.imageLoadPending = false;
                    mesh.visible = true; // Ensure mesh is visible
                    
                    // Replace in array
                    const index = this.imageSprites.indexOf(currentObj);
                    if (index !== -1) {
                        this.imageSprites[index] = mesh;
                    }
                    this.scene.add(mesh);
                } else {
                    // Dispose of old material and geometry
                    this.disposeRenderable(currentObj, { disposeUserTexture: false });
                    
                    currentObj.geometry = newGeometry;
                    currentObj.material = imageMaterial;
                    currentObj.userData.texture = framedTexture;
                    currentObj.userData.isImage = true;
                    currentObj.userData.isSprite = false;
                    currentObj.userData.imageLoadPending = false;
                    currentObj.visible = true; // Ensure mesh is visible
                }
                
                // Clean up original texture
                texture.dispose();
            },
            undefined,
            (error) => {
                const currentObj = this.getRenderableByPointIndex(pointIndex);
                if (currentObj?.userData && currentObj.userData.imageLoadToken === loadToken) {
                    currentObj.userData.imageLoadPending = false;
                    currentObj.userData.isImage = false;
                    currentObj.userData.isSprite = true;
                    currentObj.visible = true; // Make sprite visible again on error
                }
                console.warn(`Failed to load image: ${sprite.userData.filename}`, error);
            }
        );
    }
    


    convertSpriteToRectangle(sprite) {
        if (!sprite?.userData) {
            return;
        }

        // Invalidate any pending async image load for this point
        sprite.userData.imageLoadToken = (sprite.userData.imageLoadToken || 0) + 1;
        sprite.userData.imageLoadPending = false;

        // Dispose of texture if it exists
        if (sprite.userData.texture) {
            sprite.userData.texture.dispose();
            delete sprite.userData.texture;
        }
        
        // If it's a mesh, convert back to sprite
        if (sprite.type === 'Mesh') {
            // Remove old mesh from scene
            this.removeRenderableFromScene(sprite, { disposeUserTexture: false });
            
            // Create new sprite
            const material = new THREE.SpriteMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
                sizeAttenuation: true
            });
            const newSprite = new THREE.Sprite(material);
            newSprite.position.copy(sprite.position);
            newSprite.scale.set(0.5, 0.5, 1);
            newSprite.userData = sprite.userData;
            newSprite.userData.isImage = false;
            newSprite.userData.isSprite = true;
            newSprite.userData.imageLoadPending = false;
            newSprite.visible = false; // Hide initially to prevent white flash
            
            // Replace in array
            const index = this.imageSprites.indexOf(sprite);
            if (index !== -1) {
                this.imageSprites[index] = newSprite;
            }
            this.scene.add(newSprite);
        } else {
            // Already a sprite, just update material
            this.disposeMaterial(sprite.material);
            sprite.material = new THREE.SpriteMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
                sizeAttenuation: true
            });
            sprite.userData.isImage = false;
            sprite.userData.isSprite = true;
            sprite.userData.imageLoadPending = false;
            sprite.visible = false; // Hide initially to prevent white flash
        }
    }

    // ===== Keyframe Methods =====
    
    initKeyframeControls() {
        const addBtn = document.getElementById('add-keyframe-btn');
        const playBtn = document.getElementById('play-keyframes-btn');
        const speedSlider = document.getElementById('keyframe-speed-slider');
        const speedValue = document.getElementById('keyframe-speed-value');
        const resetViewBtn = document.getElementById('reset-view-btn');

        addBtn.addEventListener('click', () => this.addKeyframe());
        playBtn.addEventListener('click', () => this.togglePlayKeyframes());
        resetViewBtn.addEventListener('click', () => this.resetView());
        
        speedSlider.addEventListener('input', (e) => {
            this.keyframeSpeed = parseFloat(e.target.value);
            speedValue.textContent = this.keyframeSpeed.toFixed(1);
        });
    }

    initGlobalKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Space key adds a keyframe
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault(); // Prevent default scrolling behavior
                this.addKeyframe();
            }
        });
    }

    addKeyframe() {
        // Capture current camera state
        const keyframe = {
            position: this.camera.position.clone(),
            quaternion: this.camera.quaternion.clone(),
            timestamp: Date.now()
        };
        
        this.keyframes.push(keyframe);
        this.updateKeyframesList();
    }

    resetView() {
        // Reset camera to initial position and orientation (based on data bounds)
        if (this.initialCameraPosition && this.initialCameraTarget) {
            this.camera.position.copy(this.initialCameraPosition);
            this.camera.lookAt(this.initialCameraTarget);
        } else {
            // Fallback if data hasn't loaded yet
            this.camera.position.set(0, 50, 100);
            this.camera.lookAt(0, 0, 0);
        }
    }

    updateKeyframesList() {
        const list = document.getElementById('keyframes-list');
        list.innerHTML = '';
        
        this.keyframes.forEach((keyframe, index) => {
            const item = document.createElement('div');
            item.className = 'keyframe-item';
            
            const info = document.createElement('div');
            info.className = 'keyframe-item-info';
            const pos = keyframe.position;
            info.textContent = `${index + 1}. (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)})`;
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'keyframe-item-buttons';
            
            const gotoBtn = document.createElement('div');
            gotoBtn.className = 'keyframe-item-goto';
            gotoBtn.textContent = 'Goto';
            gotoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.jumpToKeyframe(index);
            });
            
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'keyframe-item-delete';
            deleteBtn.textContent = 'Del';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteKeyframe(index);
            });
            
            buttonsContainer.appendChild(gotoBtn);
            buttonsContainer.appendChild(deleteBtn);
            
            item.appendChild(info);
            item.appendChild(buttonsContainer);
            list.appendChild(item);
        });
    }

    deleteKeyframe(index) {
        this.keyframes.splice(index, 1);
        this.updateKeyframesList();
    }

    jumpToKeyframe(index) {
        if (index >= 0 && index < this.keyframes.length) {
            const keyframe = this.keyframes[index];
            this.camera.position.copy(keyframe.position);
            this.camera.quaternion.copy(keyframe.quaternion);
        }
    }

    togglePlayKeyframes() {
        const playBtn = document.getElementById('play-keyframes-btn');
        
        if (this.isPlayingKeyframes) {
            this.stopPlayingKeyframes();
            playBtn.textContent = '▶️';
        } else {
            if (this.keyframes.length < 2) {
                alert('Please add at least 2 keyframes to play animation');
                return;
            }
            this.startPlayingKeyframes();
            playBtn.textContent = '⏸️';
        }
    }

    startPlayingKeyframes() {
        this.isPlayingKeyframes = true;
        this.keyframeProgress = 0;
        this.keyframeStartTime = performance.now();
    }

    stopPlayingKeyframes() {
        this.isPlayingKeyframes = false;
        this.keyframeProgress = 0;
    }

    updateKeyframeAnimation(deltaTime) {
        if (!this.isPlayingKeyframes || this.keyframes.length < 2) {
            return;
        }

        // Animation phases: pause at each keyframe for 2 seconds, then transition to next
        const pauseDuration = 750; // milliseconds to pause at each keyframe
        const transitionDuration = 2000 / this.keyframeSpeed; // milliseconds to transition between keyframes
        const phaseDuration = pauseDuration + transitionDuration;
        const totalDuration = phaseDuration * this.keyframes.length;
        
        // Update progress
        const elapsed = performance.now() - this.keyframeStartTime;
        const cycleTime = elapsed % totalDuration;
        
        // Determine which keyframe we're at/transitioning from
        const phaseIndex = Math.floor(cycleTime / phaseDuration);
        const phaseProgress = (cycleTime % phaseDuration);
        
        const currentKeyframeIndex = phaseIndex % this.keyframes.length;
        const nextKeyframeIndex = (phaseIndex + 1) % this.keyframes.length;
        
        const currentKeyframe = this.keyframes[currentKeyframeIndex];
        const nextKeyframe = this.keyframes[nextKeyframeIndex];
        
        if (phaseProgress < pauseDuration) {
            // Pausing phase: stay at current keyframe
            this.camera.position.copy(currentKeyframe.position);
            this.camera.quaternion.copy(currentKeyframe.quaternion);
        } else {
            // Transition phase: interpolate to next keyframe
            const transitionProgress = (phaseProgress - pauseDuration) / transitionDuration;
            
            // Interpolate position
            this.camera.position.lerpVectors(
                currentKeyframe.position,
                nextKeyframe.position,
                this.smoothstep(transitionProgress)
            );
            
            // Interpolate rotation (quaternion)
            THREE.Quaternion.slerp(
                currentKeyframe.quaternion,
                nextKeyframe.quaternion,
                this.camera.quaternion,
                this.smoothstep(transitionProgress)
            );
        }
    }

    // Smooth interpolation function (ease in-out)
    smoothstep(t) {
        return t * t * (3 - 2 * t);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Calculate deltaTime for frame-rate independent movement
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 2); // Normalize to 60fps, cap at 2x
        this.lastTime = currentTime;

        // Update keyframe animation (if playing)
        if (this.isPlayingKeyframes) {
            this.updateKeyframeAnimation(deltaTime);
        } else {
            // Update camera controller only when not playing keyframes
            this.controller.update(deltaTime);
        }

        // Update UI
        const pos = this.camera.position;
        document.getElementById('camera-pos').textContent = 
            `${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)}`;

        // Update view angle display
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);
        const pitch = (euler.x * 180 / Math.PI).toFixed(0);
        const yaw = (euler.y * 180 / Math.PI).toFixed(0);
        const roll = (euler.z * 180 / Math.PI).toFixed(0);
        document.getElementById('view-angle').textContent = 
            `${pitch}°, ${yaw}°, ${roll}°`;

        this.updateNearestPoint();

        // Update side-views dynamic overlay (camera arrow)
        this.drawSideViewsDynamic();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Global variables for modal state
let selectedSaveFile = null;
let selectedLoadFile = null;
let viewerInstance = null;

// Modal control functions
function closeSaveModal() {
    document.getElementById('save-modal').classList.remove('active');
    selectedSaveFile = null;
}

function closeLoadModal() {
    document.getElementById('load-modal').classList.remove('active');
    selectedLoadFile = null;
}

async function openSaveModal() {
    const modal = document.getElementById('save-modal');
    const fileList = document.getElementById('save-file-list');
    
    // Fetch existing .kf.csv files
    try {
        const response = await fetch('/api/keyframes/list');
        const data = await response.json();
        
        // Populate file list
        fileList.innerHTML = '';
        data.files.forEach(filename => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.textContent = filename;
            item.onclick = () => {
                document.querySelectorAll('#save-file-list .file-item').forEach(el => 
                    el.classList.remove('selected'));
                item.classList.add('selected');
                selectedSaveFile = filename;
                // Auto-populate filename input (remove .kf.csv extension)
                const baseName = filename.replace('.kf.csv', '');
                document.getElementById('save-filename').value = baseName;
            };
            fileList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading file list:', error);
    }
    
    modal.classList.add('active');
}

async function openLoadModal() {
    const modal = document.getElementById('load-modal');
    const fileList = document.getElementById('load-file-list');
    
    // Fetch existing .kf.csv files
    try {
        const response = await fetch('/api/keyframes/list');
        const data = await response.json();
        
        // Populate file list
        fileList.innerHTML = '';
        data.files.forEach(filename => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.textContent = filename;
            item.onclick = () => {
                document.querySelectorAll('#load-file-list .file-item').forEach(el => 
                    el.classList.remove('selected'));
                item.classList.add('selected');
                selectedLoadFile = filename;
            };
            fileList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading file list:', error);
    }
    
    modal.classList.add('active');
}

async function confirmSave() {
    const filenameInput = document.getElementById('save-filename');
    let filename = filenameInput.value.trim();
    
    if (!filename) {
        alert('Please enter a filename');
        return;
    }
    
    // Add .kf.csv extension if not present
    if (!filename.endsWith('.kf.csv')) {
        filename += '.kf.csv';
    }
    
    // Get keyframes from viewer instance
    if (!viewerInstance || !viewerInstance.keyframes || viewerInstance.keyframes.length === 0) {
        alert('No keyframes to save');
        return;
    }
    
    try {
        const response = await fetch('/api/keyframes/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: filename,
                keyframes: viewerInstance.keyframes
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            closeSaveModal();
        } else {
            alert(`Error saving keyframes: ${result.error}`);
        }
    } catch (error) {
        console.error('Error saving keyframes:', error);
        alert('Error saving keyframes: ' + error.message);
    }
}

async function confirmLoad() {
    if (!selectedLoadFile) {
        alert('Please select a file to load');
        return;
    }
    
    try {
        const response = await fetch(`/api/keyframes/load?filename=${encodeURIComponent(selectedLoadFile)}`);
        const result = await response.json();
        
        if (response.ok) {
            // Load keyframes into viewer instance
            if (viewerInstance) {
                // Convert plain objects to Three.js objects
                viewerInstance.keyframes = result.keyframes.map(kf => ({
                    position: new THREE.Vector3(kf.position.x, kf.position.y, kf.position.z),
                    quaternion: new THREE.Quaternion(kf.quaternion._x, kf.quaternion._y, kf.quaternion._z, kf.quaternion._w),
                    timestamp: kf.timestamp || Date.now()
                }));
                viewerInstance.updateKeyframesList();
            }
            closeLoadModal();
        } else {
            alert(`Error loading keyframes: ${result.error}`);
        }
    } catch (error) {
        console.error('Error loading keyframes:', error);
        alert('Error loading keyframes: ' + error.message);
    }
}

// Initialize viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    viewerInstance = new ImageViewer();
    
    // Add event listeners for Save and Load buttons
    document.getElementById('save-keyframes-btn').addEventListener('click', openSaveModal);
    document.getElementById('load-keyframes-btn').addEventListener('click', openLoadModal);
});
