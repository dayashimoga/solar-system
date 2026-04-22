window.launchRoverSimulator = function(planetName) {
    // 1. Hide the solarCanvas and UI
    document.getElementById('solarCanvas').style.display = 'none';
    document.querySelector('.navbar').style.display = 'none';
    document.getElementById('uiOverlay').style.display = 'none';
    
    // 2. Create the Rover UI Container
    const container = document.createElement('div');
    container.id = 'roverContainer';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.zIndex = '100';
    container.style.background = '#000';
    document.body.appendChild(container);

    // 3. Rover HUD & Exit button
    const hud = document.createElement('div');
    hud.style.position = 'absolute';
    hud.style.top = '20px';
    hud.style.left = '20px';
    hud.style.color = '#fff';
    hud.style.fontFamily = 'Inter, sans-serif';
    hud.style.zIndex = '101';
    hud.innerHTML = `
        <h1 style="margin:0;font-size:24px;">${planetName} Surface Simulator</h1>
        <p style="color:#aaa;margin-top:5px;">Use WASD to drive. Space to jump.</p>
        <button id="exitRover" style="margin-top:10px;padding:8px 16px;background:#ef4444;border:none;border-radius:6px;color:#fff;cursor:pointer;font-weight:bold;transition:0.2s;">🚀 Return to Orbit</button>
        <div id="nasaData" style="margin-top:20px;background:rgba(0,0,0,0.5);padding:15px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);max-width:350px;backdrop-filter:blur(10px);">
            <div style="font-size:14px;color:#aaa;">Loading planetary telemetry...</div>
        </div>
    `;
    container.appendChild(hud);

    document.getElementById('exitRover').onclick = () => {
        document.body.removeChild(container);
        document.getElementById('solarCanvas').style.display = 'block';
        document.querySelector('.navbar').style.display = 'flex';
        document.getElementById('uiOverlay').style.display = 'block';
    };

    // 4. Three.js Scene Setup
    const scene = new THREE.Scene();
    if(planetName === 'Mars') scene.fog = new THREE.FogExp2(0xc27a5d, 0.03);
    else scene.fog = new THREE.FogExp2(0x111111, 0.03);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(scene.fog.color);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    dirLight.position.set(100, 200, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    scene.add(dirLight);

    // Stars background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) starPos[i] = (Math.random() - 0.5) * 1000;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({color:0xffffff, size:1, sizeAttenuation:false});
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Procedural Terrain
    const terrainColor = planetName === 'Mars' ? 0xc25533 : 0x888888;
    const geo = new THREE.PlaneGeometry(400, 400, 100, 100);
    const pos = geo.attributes.position;
    for(let i=0; i<pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        // Multi-frequency noise for realistic craters and bumps
        let z = Math.sin(x*0.05)*Math.cos(y*0.05)*4 
              + Math.sin(x*0.15)*Math.cos(y*0.1)*1.5 
              + Math.sin(x*0.5)*0.2;
        
        // Add some random craters
        if(Math.sin(x*0.1)*Math.cos(y*0.1) > 0.8) {
            z -= 3;
        }
        pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ 
        color: terrainColor, 
        roughness: 0.9, 
        metalness: 0.1,
        flatShading: true 
    });
    const terrain = new THREE.Mesh(geo, mat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Rover Construction (Detailed)
    const roverGroup = new THREE.Group();
    
    // Main Body (Gold-ish foil look)
    const bodyGeo = new THREE.BoxGeometry(2.4, 1.2, 3.6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xddaa55, roughness: 0.3, metalness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.2;
    body.castShadow = true;
    roverGroup.add(body);
    
    // Solar Panel
    const panelGeo = new THREE.BoxGeometry(3.5, 0.1, 2.5);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x112255, roughness: 0.1, metalness: 0.9 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.y = 1.85;
    panel.castShadow = true;
    roverGroup.add(panel);

    // Mast / Camera Head
    const mastGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0.8, 2.5, -1.2);
    mast.castShadow = true;
    roverGroup.add(mast);

    const headGeo = new THREE.BoxGeometry(0.6, 0.4, 0.4);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.8, 3.2, -1.2);
    head.castShadow = true;
    roverGroup.add(head);
    
    // Wheels (6-wheel rocker-bogie style)
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const wheelPositions = [
        [-1.5, 0.6, -1.5], [1.5, 0.6, -1.5], 
        [-1.5, 0.6, 0],    [1.5, 0.6, 0],
        [-1.5, 0.6, 1.5],  [1.5, 0.6, 1.5]
    ];
    const wheels = [];
    wheelPositions.forEach(p => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...p);
        wheel.castShadow = true;
        roverGroup.add(wheel);
        wheels.push(wheel);
    });
    
    scene.add(roverGroup);

    // Physics state
    let speed = 0;
    let turnSpeed = 0;
    const maxSpeed = 0.25;
    let velocityY = 0;
    const gravity = -0.01;
    
    // Raycaster for terrain height
    const raycaster = new THREE.Raycaster();
    const downVector = new THREE.Vector3(0, -1, 0);

    // Controls
    const keys = { w:false, a:false, s:false, d:false, space:false };
    const keydown = e => { 
        if(e.code === 'Space') keys.space = true;
        if(keys[e.key.toLowerCase()] !== undefined) keys[e.key.toLowerCase()] = true; 
    };
    const keyup = e => { 
        if(e.code === 'Space') keys.space = false;
        if(keys[e.key.toLowerCase()] !== undefined) keys[e.key.toLowerCase()] = false; 
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    window.addEventListener('resize', () => {
        if(!document.getElementById('roverContainer')) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let frame = 0;

    function animate() {
        if(!document.getElementById('roverContainer')) {
            window.removeEventListener('keydown', keydown);
            window.removeEventListener('keyup', keyup);
            return;
        }
        requestAnimationFrame(animate);
        frame++;
        
        // Acceleration
        if(keys.w) speed += 0.005;
        else if(keys.s) speed -= 0.005;
        else speed *= 0.92; // Friction
        
        speed = Math.max(-maxSpeed/2, Math.min(maxSpeed, speed));
        
        // Turning
        if(keys.a) turnSpeed += 0.002;
        else if(keys.d) turnSpeed -= 0.002;
        else turnSpeed *= 0.8;
        
        turnSpeed = Math.max(-0.04, Math.min(0.04, turnSpeed));
        
        // Apply movement
        if(Math.abs(speed) > 0.01) {
            roverGroup.rotation.y += turnSpeed * (speed > 0 ? 1 : -1);
            // Spin wheels
            wheels.forEach(w => w.rotation.x += speed * 1.5);
        }
        roverGroup.translateZ(-speed);

        // Terrain Collision (Raycast down)
        raycaster.set(new THREE.Vector3(roverGroup.position.x, 100, roverGroup.position.z), downVector);
        const intersects = raycaster.intersectObject(terrain);
        let groundHeight = 0;
        if(intersects.length > 0) {
            groundHeight = intersects[0].point.y;
        }

        // Jump mechanics & gravity
        if(roverGroup.position.y <= groundHeight + 0.1) {
            roverGroup.position.y = groundHeight;
            velocityY = 0;
            if(keys.space) velocityY = 0.3; // Jump
        } else {
            velocityY += gravity;
        }
        roverGroup.position.y += velocityY;
        
        // Smooth camera follow
        const camIdealPos = new THREE.Vector3(0, 5, 10);
        camIdealPos.applyQuaternion(roverGroup.quaternion);
        camIdealPos.add(roverGroup.position);
        
        camera.position.lerp(camIdealPos, 0.1);
        
        const lookAtIdeal = new THREE.Vector3(0, 1, -2);
        lookAtIdeal.applyQuaternion(roverGroup.quaternion);
        lookAtIdeal.add(roverGroup.position);
        
        // Camera lookAt needs to be updated smoothly too, or just snap
        camera.lookAt(lookAtIdeal);
        
        renderer.render(scene, camera);
    }
    animate();

    // NASA API Fetch (Mars only)
    if(planetName === 'Mars') {
        fetch('https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=DEMO_KEY')
            .then(res => res.json())
            .then(data => {
                const photo = data.latest_photos && data.latest_photos.length > 0 ? data.latest_photos[0] : null;
                const nasaDiv = document.getElementById('nasaData');
                if(photo && nasaDiv) {
                    nasaDiv.innerHTML = `
                        <h3 style="margin:0 0 12px;font-size:16px;display:flex;align-items:center;gap:8px;">
                            <span style="display:inline-block;width:10px;height:10px;background:#10b981;border-radius:50%;box-shadow:0 0 8px #10b981;"></span>
                            NASA Telemetry (Live)
                        </h3>
                        <div style="font-size:13px;color:#cbd5e1;margin-bottom:12px;line-height:1.6;">
                            <strong>Rover:</strong> ${photo.rover.name} (Status: ${photo.rover.status})<br>
                            <strong>Camera:</strong> ${photo.camera.full_name}<br>
                            <strong>Earth Date:</strong> ${photo.earth_date} | <strong>Sol:</strong> ${photo.sol}
                        </div>
                        <img src="${photo.img_src}" style="width:100%;border-radius:8px;max-height:220px;object-fit:cover;border:1px solid rgba(255,255,255,0.2);">
                    `;
                } else if(nasaDiv) {
                    nasaDiv.innerHTML = '<div style="color:#ef4444;">NASA Telemetry unavailable.</div>';
                }
            }).catch(err => {
                const nasaDiv = document.getElementById('nasaData');
                if(nasaDiv) nasaDiv.innerHTML = '<div style="color:#ef4444;">NASA API connection failed.</div>';
            });
    } else {
        const nasaDiv = document.getElementById('nasaData');
        if(nasaDiv) nasaDiv.innerHTML = `
            <h3 style="margin:0 0 10px;font-size:16px;">Simulation Mode</h3>
            <p style="color:#aaa;font-size:13px;line-height:1.5;">No live NASA telemetry available for ${planetName}. Procedural terrain generation active based on hypothetical topography.</p>
        `;
    }
};
