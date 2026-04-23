/* Solar System Explorer - Immersive Deep Zoom */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });

    const canvas = $('#solarCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Camera
    let zoom = 0.01, zoomTarget = 0.01;
    let cx = 0, cy = 0, cxTarget = 0, cyTarget = 0;
    let isDragging = false, dragStart = {x:0,y:0}, camStart = {x:0,y:0};
    const MIN_ZOOM = 0.0000001, MAX_ZOOM = 20000;

    // Controls
    const ctrl = document.createElement('div');
    ctrl.innerHTML = `
        <div style="position:fixed;top:70px;left:15px;background:rgba(0,0,0,0.75);padding:12px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);z-index:10;backdrop-filter:blur(10px);">
            <p style="margin:0 0 8px;color:#fff;font-weight:700;font-size:14px;">🔭 Space Explorer</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button id="z00" class="btn btn-secondary btn-sm" style="border-color: #8b5cf6;">Cosmic Web</button>
                <button id="z0" class="btn btn-secondary btn-sm">Supercluster</button>
                <button id="z1" class="btn btn-secondary btn-sm">Milky Way</button>
                <button id="z2" class="btn btn-secondary btn-sm">Constellations</button>
                <button id="z3" class="btn btn-secondary btn-sm">Solar System</button>
                <button id="zBH" class="btn btn-primary btn-sm" style="background:linear-gradient(45deg,#111,#333); border:1px solid #fff; box-shadow: 0 0 10px rgba(255,255,255,0.2);">Sagittarius A* (Black Hole)</button>
            </div>
            <div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;">
                <label style="color:#bbb;font-size:11px;display:block;margin-bottom:4px;">⏱ Time Speed: <span id="timeSpeedVal">1×</span></label>
                <input type="range" id="timeSpeedSlider" min="-5" max="10" step="0.5" value="1" style="width:100%;accent-color:#8b5cf6;">
                <div style="display:flex;gap:8px;margin-top:6px;">
                    <label style="color:#aaa;font-size:11px;cursor:pointer;"><input type="checkbox" id="showAsteroidBelt" checked style="accent-color:#8b5cf6;"> Asteroid Belt</label>
                    <label style="color:#aaa;font-size:11px;cursor:pointer;"><input type="checkbox" id="distScaleToggle"> True Scale</label>
                </div>
            </div>
            <p id="zoomInfo" style="margin:8px 0 0;font-size:11px;color:#888;">Scroll to zoom • Drag to pan</p>
        </div>
        <div id="infoPanel" class="info-panel" style="position:fixed;top:70px;right:-400px;transition:right 0.3s;z-index:10;background:rgba(15,15,26,0.85);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.15);padding:24px;border-radius:12px;color:#fff;width:300px;box-shadow:0 10px 40px rgba(0,0,0,0.5);">
            <h2 id="ipTitle" style="margin:0 0 10px;font-size:1.5rem;display:flex;align-items:center;gap:8px;">Star</h2>
            <div id="ipType" style="color:#aaccff;font-size:0.9rem;margin-bottom:15px;font-weight:600;">Type</div>
            <div class="info-stats" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;border-top:1px solid rgba(255,255,255,0.1);padding-top:15px;">
                <div><div style="font-size:0.7rem;color:#888;text-transform:uppercase;">Magnitude</div><div id="ipMag" style="font-weight:600;">0</div></div>
                <div><div style="font-size:0.7rem;color:#888;text-transform:uppercase;">Planets</div><div id="ipPlanets" style="font-weight:600;">0</div></div>
                <div><div style="font-size:0.7rem;color:#888;text-transform:uppercase;">Distance</div><div id="ipDist" style="font-weight:600;">Unknown</div></div>
            </div>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button id="ipClose" class="btn btn-secondary" style="flex:1;">Close</button>
                <button id="btnLandRover" class="btn btn-primary hidden" style="flex:1;background:linear-gradient(135deg, #f97316, #ea580c);">Land Rover (3D)</button>
            </div>
        </div>`;
    document.body.appendChild(ctrl);

    $('#z00').onclick = () => { zoomTarget = 0.00000002; cxTarget = 0; cyTarget = 0; };
    $('#z0').onclick = () => { zoomTarget = 0.000003; cxTarget=0; cyTarget=0; };
    $('#z1').onclick = () => { zoomTarget = 0.0008; cxTarget=-100000; cyTarget=50000; };
    $('#z2').onclick = () => { zoomTarget = 0.03; cxTarget=0; cyTarget=0; };
    $('#z3').onclick = () => { zoomTarget = 1.0; cxTarget=0; cyTarget=0; };
    $('#zBH').onclick = () => { zoomTarget = 0.2; cxTarget=150000; cyTarget=-150000; };
    $('#ipClose').onclick = () => { $('#infoPanel').style.right = '-400px'; selectedObj = null; };

    canvas.addEventListener('mousedown', e => { isDragging=true; dragStart={x:e.clientX,y:e.clientY}; camStart={x:cx,y:cy}; });
    window.addEventListener('mouseup', () => isDragging=false);
    window.addEventListener('mousemove', e => { if(!isDragging)return; cxTarget=camStart.x-(e.clientX-dragStart.x)/zoom; cyTarget=camStart.y-(e.clientY-dragStart.y)/zoom; });
    
    // Touch support
    canvas.addEventListener('touchstart', e => { if(e.touches.length===1){isDragging=true;dragStart={x:e.touches[0].clientX,y:e.touches[0].clientY};camStart={x:cx,y:cy};}e.preventDefault(); },{passive:false});
    canvas.addEventListener('touchmove', e => { if(!isDragging||e.touches.length!==1)return; cxTarget=camStart.x-(e.touches[0].clientX-dragStart.x)/zoom; cyTarget=camStart.y-(e.touches[0].clientY-dragStart.y)/zoom; e.preventDefault(); },{passive:false});
    canvas.addEventListener('touchend', () => isDragging=false);
    
    // SMOOTH ADAPTIVE ZOOM
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        let factor;
        if(zoom < 0.0001) factor = e.deltaY > 0 ? 0.96 : 1.04;
        else if(zoom < 0.001) factor = e.deltaY > 0 ? 0.965 : 1.035;
        else if(zoom < 0.01) factor = e.deltaY > 0 ? 0.97 : 1.03;
        else if(zoom < 1) factor = e.deltaY > 0 ? 0.975 : 1.025;
        else factor = e.deltaY > 0 ? 0.97 : 1.03;
        zoomTarget = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomTarget * factor));
    },{passive:false});

    // Zoom +/- Buttons
    const zInBtn = $('#zoomInBtn');
    const zOutBtn = $('#zoomOutBtn');
    if(zInBtn) zInBtn.onclick = () => { zoomTarget = Math.min(MAX_ZOOM, zoomTarget * 1.5); };
    if(zOutBtn) zOutBtn.onclick = () => { zoomTarget = Math.max(MIN_ZOOM, zoomTarget * 0.67); };

    // INFINITE STARFIELD (tiled, no boundary)
    const TILE_SIZE = 4000;
    const STARS_PER_TILE = 150;
    const starTileCache = {};
    
    function getStarTile(tx, ty) {
        const key = `${tx},${ty}`;
        if(starTileCache[key]) return starTileCache[key];
        let seed = Math.abs(tx * 73856093 ^ ty * 19349663) % 2147483647;
        const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
        const stars = [];
        for(let i=0; i<STARS_PER_TILE; i++) {
            stars.push({
                x: tx * TILE_SIZE + rng() * TILE_SIZE,
                y: ty * TILE_SIZE + rng() * TILE_SIZE,
                s: rng() * 2 + 0.3,
                b: rng() * 0.6 + 0.4,
                h: rng() * 60 + 200
            });
        }
        starTileCache[key] = stars;
        return stars;
    }

    // ═══════════════════════════════════════════════════════
    // CONSTELLATIONS — 19 major constellations with real stars
    // ═══════════════════════════════════════════════════════
    const CONSTELLATIONS = [
        { name: 'Orion', cx: 3000, cy: 1000, stars: [
            { name: 'Betelgeuse', x: 2700, y: 600, s: 8, color: '#ff6644', type: 'Red Supergiant', mag: 0.42, planets: 0, dist: '700 ly' },
            { name: 'Rigel', x: 3300, y: 1500, s: 7, color: '#aaccff', type: 'Blue Supergiant', mag: 0.13, planets: 0, dist: '860 ly' },
            { name: 'Bellatrix', x: 3200, y: 650, s: 5, color: '#bbddff', type: 'Blue Giant', mag: 1.64, planets: 0, dist: '250 ly' },
            { name: 'Mintaka', x: 2850, y: 1000, s: 4, color: '#ddeeff', type: 'Multiple Star', mag: 2.23, planets: 2, dist: '1200 ly' },
            { name: 'Alnilam', x: 3000, y: 1000, s: 5, color: '#cce0ff', type: 'Blue Supergiant', mag: 1.69, planets: 1, dist: '2000 ly' },
            { name: 'Alnitak', x: 3150, y: 1000, s: 4, color: '#ddeeff', type: 'Triple Star', mag: 1.77, planets: 3, dist: '1260 ly' },
            { name: 'Saiph', x: 2750, y: 1450, s: 4, color: '#bbddff', type: 'Blue Supergiant', mag: 2.09, planets: 0, dist: '650 ly' },
        ], lines: [[0,2],[0,4],[2,5],[3,4],[4,5],[1,5],[1,6],[6,3]] },
        { name: 'Ursa Major', cx: -5000, cy: -4000, stars: [
            { name: 'Dubhe', x: -5500, y: -4500, s: 6, color: '#ffd700', type: 'Giant', mag: 1.79, planets: 1 },
            { name: 'Merak', x: -5400, y: -3800, s: 5, color: '#fff', type: 'Main Sequence', mag: 2.37, planets: 2 },
            { name: 'Phecda', x: -4800, y: -3600, s: 5, color: '#fff', type: 'Main Sequence', mag: 2.44, planets: 0 },
            { name: 'Megrez', x: -4700, y: -4100, s: 4, color: '#fff', type: 'Main Sequence', mag: 3.31, planets: 1 },
            { name: 'Alioth', x: -4200, y: -4300, s: 5, color: '#fff', type: 'Main Sequence', mag: 1.77, planets: 0 },
            { name: 'Mizar', x: -3800, y: -4500, s: 5, color: '#fff', type: 'Binary', mag: 2.04, planets: 1 },
            { name: 'Alkaid', x: -3400, y: -4800, s: 5, color: '#cce0ff', type: 'Main Sequence', mag: 1.86, planets: 0 },
        ], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]] },
        { name: 'Cassiopeia', cx: 7000, cy: -5000, stars: [
            { name: 'Schedar', x: 6500, y: -5200, s: 6, color: '#ffa500', type: 'Giant', mag: 2.24, planets: 1 },
            { name: 'Caph', x: 6800, y: -4600, s: 5, color: '#fff', type: 'Giant', mag: 2.27, planets: 0 },
            { name: 'Gamma Cas', x: 7100, y: -5400, s: 5, color: '#aaccff', type: 'Blue Subgiant', mag: 2.47, planets: 2 },
            { name: 'Ruchbah', x: 7400, y: -4800, s: 4, color: '#fff', type: 'Eclipsing Binary', mag: 2.68, planets: 0 },
            { name: 'Segin', x: 7600, y: -5300, s: 4, color: '#cce0ff', type: 'B-type', mag: 3.37, planets: 1 },
        ], lines: [[0,1],[1,2],[2,3],[3,4]] },
        { name: 'Scorpius', cx: -8000, cy: 6000, stars: [
            { name: 'Antares', x: -8000, y: 6000, s: 9, color: '#ff4400', type: 'Red Supergiant', mag: 0.96, planets: 0, dist: '550 ly' },
            { name: 'Shaula', x: -7200, y: 7200, s: 5, color: '#bbddff', type: 'Binary', mag: 1.63, planets: 2 },
            { name: 'Sargas', x: -7500, y: 7000, s: 4, color: '#fff4cc', type: 'Giant', mag: 1.87, planets: 1 },
            { name: 'Dschubba', x: -8200, y: 5400, s: 5, color: '#cce0ff', type: 'Beta Cephei', mag: 2.32, planets: 0 },
            { name: 'Acrab', x: -8400, y: 5200, s: 4, color: '#ddeeff', type: 'Multiple', mag: 2.62, planets: 3 },
            { name: 'Fang', x: -8100, y: 5700, s: 3, color: '#cce0ff', type: 'Binary', mag: 3.04, planets: 0 },
        ], lines: [[4,3],[3,5],[5,0],[0,2],[2,1]] },
        { name: 'Leo', cx: 10000, cy: 2000, stars: [
            { name: 'Regulus', x: 9500, y: 2500, s: 7, color: '#cce0ff', type: 'Blue-white', mag: 1.35, planets: 1 },
            { name: 'Denebola', x: 10800, y: 1800, s: 5, color: '#fff', type: 'Main Sequence', mag: 2.14, planets: 2 },
            { name: 'Algieba', x: 9800, y: 1600, s: 5, color: '#ffa500', type: 'Binary Giant', mag: 2.28, planets: 1 },
            { name: 'Zosma', x: 10400, y: 1600, s: 4, color: '#fff', type: 'Main Sequence', mag: 2.56, planets: 0 },
            { name: 'Ras Elased', x: 9600, y: 1400, s: 4, color: '#ffd700', type: 'Giant', mag: 3.0, planets: 0 },
        ], lines: [[0,2],[2,4],[2,3],[3,1]] },
        { name: 'Lyra', cx: -1500, cy: -6000, stars: [
            { name: 'Vega', x: -1500, y: -6000, s: 9, color: '#fff', type: 'Main Sequence A0V', mag: 0.03, planets: 2, dist: '25 ly' },
            { name: 'Sulafat', x: -1200, y: -5600, s: 4, color: '#cce0ff', type: 'Giant', mag: 3.24, planets: 0 },
            { name: 'Sheliak', x: -1300, y: -5500, s: 4, color: '#fff', type: 'Eclipsing Binary', mag: 3.52, planets: 1 },
            { name: 'Epsilon Lyr', x: -1600, y: -5800, s: 3, color: '#fff', type: 'Double-double', mag: 4.67, planets: 0 },
        ], lines: [[0,3],[0,1],[1,2]] },
        { name: 'Cygnus', cx: -3000, cy: -8000, stars: [
            { name: 'Deneb', x: -3000, y: -9000, s: 8, color: '#fff', type: 'Blue-white Supergiant', mag: 1.25, planets: 0, dist: '2600 ly' },
            { name: 'Sadr', x: -3000, y: -8000, s: 5, color: '#fff4cc', type: 'Supergiant', mag: 2.23, planets: 1 },
            { name: 'Gienah', x: -3600, y: -7600, s: 4, color: '#ffa500', type: 'Giant', mag: 2.48, planets: 0 },
            { name: 'Albireo', x: -3000, y: -7000, s: 5, color: '#ffa500', type: 'Binary', mag: 3.08, planets: 2, dist: '430 ly' },
            { name: 'Fawaris', x: -2400, y: -7600, s: 4, color: '#cce0ff', type: 'Main Sequence', mag: 2.87, planets: 1 },
        ], lines: [[0,1],[1,2],[1,3],[1,4]] },
        { name: 'Draco', cx: -2000, cy: -11000, stars: [
            { name: 'Thuban', x: -2000, y: -11000, s: 5, color: '#fff', type: 'Giant', mag: 3.65, planets: 1 },
            { name: 'Eltanin', x: -1500, y: -10000, s: 6, color: '#ffa500', type: 'Giant', mag: 2.23, planets: 0 },
            { name: 'Rastaban', x: -1000, y: -10200, s: 5, color: '#ffec8b', type: 'Supergiant', mag: 2.73, planets: 0 },
            { name: 'Altais', x: -3000, y: -11500, s: 4, color: '#fff4cc', type: 'Giant', mag: 3.07, planets: 1 },
        ], lines: [[0,1],[1,2],[0,3]] },
        { name: 'Pegasus', cx: 12000, cy: -3000, stars: [
            { name: 'Markab', x: 11000, y: -3000, s: 5, color: '#cce0ff', type: 'Dwarf', mag: 2.48, planets: 0 },
            { name: 'Scheat', x: 11500, y: -4500, s: 5, color: '#ff6644', type: 'Red Giant', mag: 2.42, planets: 1 },
            { name: 'Algenib', x: 13000, y: -3500, s: 4, color: '#aaccff', type: 'Subgiant', mag: 2.83, planets: 0 },
            { name: 'Enif', x: 12500, y: -1500, s: 6, color: '#ffa500', type: 'Supergiant', mag: 2.39, planets: 2 },
        ], lines: [[0,1],[0,2],[1,2],[0,3]] },
        { name: 'Centaurus', cx: -11000, cy: 11000, stars: [
            { name: 'Alpha Centauri', x: -11000, y: 11000, s: 9, color: '#fff4cc', type: 'Binary System', mag: -0.27, planets: 3, dist: '4.37 ly' },
            { name: 'Hadar', x: -10000, y: 10500, s: 8, color: '#cce0ff', type: 'Giant', mag: 0.61, planets: 0 },
            { name: 'Menkent', x: -12000, y: 9500, s: 5, color: '#ffa500', type: 'Giant', mag: 2.06, planets: 1 },
        ], lines: [[0,1],[0,2]] },
        { name: 'Crux', cx: -12500, cy: 13000, stars: [
            { name: 'Acrux', x: -12500, y: 13000, s: 8, color: '#cce0ff', type: 'Multiple Star', mag: 0.76, planets: 0, dist: '320 ly' },
            { name: 'Mimosa', x: -13200, y: 12800, s: 7, color: '#aaccff', type: 'Giant', mag: 1.25, planets: 0 },
            { name: 'Gacrux', x: -12600, y: 12000, s: 6, color: '#ff6644', type: 'Red Giant', mag: 1.64, planets: 1 },
            { name: 'Imai', x: -12000, y: 12600, s: 5, color: '#fff', type: 'Subgiant', mag: 2.80, planets: 0 },
        ], lines: [[0,2],[1,3]] },
        { name: 'Gemini', cx: 5000, cy: 5000, stars: [
            { name: 'Pollux', x: 4500, y: 5500, s: 6, color: '#ffa500', type: 'Giant', mag: 1.14, planets: 1, dist: '34 ly' },
            { name: 'Castor', x: 5500, y: 4500, s: 5, color: '#cce0ff', type: 'Multiple Star', mag: 1.58, planets: 0 },
            { name: 'Alhena', x: 4000, y: 6500, s: 4, color: '#fff', type: 'Subgiant', mag: 1.93, planets: 0 },
        ], lines: [[0,1],[0,2]] },
        { name: 'Taurus', cx: 8000, cy: 8000, stars: [
            { name: 'Aldebaran', x: 8000, y: 8000, s: 8, color: '#ff6644', type: 'Red Giant', mag: 0.85, planets: 1, dist: '65 ly' },
            { name: 'Elnath', x: 9000, y: 7000, s: 5, color: '#cce0ff', type: 'Giant', mag: 1.65, planets: 0 },
            { name: 'Alcyone', x: 8500, y: 9000, s: 4, color: '#bbddff', type: 'Binary', mag: 2.85, planets: 0 },
        ], lines: [[0,1],[0,2]] },
        { name: 'Canis Major', cx: 1000, cy: 4000, stars: [
            { name: 'Sirius', x: 1000, y: 4000, s: 10, color: '#ffffff', type: 'Main Sequence A1V', mag: -1.46, planets: 0, dist: '8.6 ly' },
            { name: 'Adhara', x: 500, y: 4800, s: 5, color: '#cce0ff', type: 'Binary Giant', mag: 1.50, planets: 0 },
            { name: 'Wezen', x: 1300, y: 4900, s: 5, color: '#fff4cc', type: 'Supergiant', mag: 1.83, planets: 0, dist: '1800 ly' },
            { name: 'Murzim', x: 300, y: 3800, s: 4, color: '#cce0ff', type: 'Beta Cephei', mag: 1.98, planets: 0 },
            { name: 'Aludra', x: 1600, y: 5200, s: 4, color: '#bbddff', type: 'Blue Supergiant', mag: 2.45, planets: 1 },
        ], lines: [[3,0],[0,1],[0,2],[2,4]] },
        { name: 'Aquila', cx: -6000, cy: -2000, stars: [
            { name: 'Altair', x: -6000, y: -2000, s: 8, color: '#fff', type: 'Main Sequence A7V', mag: 0.77, planets: 0, dist: '16.7 ly' },
            { name: 'Tarazed', x: -6200, y: -2400, s: 5, color: '#ffa500', type: 'Giant', mag: 2.72, planets: 1 },
            { name: 'Okab', x: -5600, y: -1600, s: 4, color: '#fff', type: 'Main Sequence', mag: 3.36, planets: 0 },
            { name: 'Alshain', x: -5800, y: -1700, s: 4, color: '#ffec8b', type: 'Subgiant', mag: 3.71, planets: 2 },
        ], lines: [[1,0],[0,3],[3,2]] },
        { name: 'Virgo', cx: 14000, cy: 5000, stars: [
            { name: 'Spica', x: 14000, y: 5000, s: 8, color: '#cce0ff', type: 'Binary B1V', mag: 0.97, planets: 0, dist: '250 ly' },
            { name: 'Porrima', x: 13500, y: 4200, s: 5, color: '#fff', type: 'Binary', mag: 2.74, planets: 1 },
            { name: 'Vindemiatrix', x: 14500, y: 3800, s: 5, color: '#ffd700', type: 'Giant', mag: 2.83, planets: 0 },
            { name: 'Heze', x: 14800, y: 5500, s: 4, color: '#fff', type: 'Main Sequence', mag: 3.37, planets: 2 },
        ], lines: [[0,1],[1,2],[0,3]] },
        { name: 'Sagittarius', cx: -13000, cy: 3000, stars: [
            { name: 'Kaus Australis', x: -13000, y: 3000, s: 6, color: '#cce0ff', type: 'Giant', mag: 1.85, planets: 0, dist: '143 ly' },
            { name: 'Nunki', x: -12500, y: 2400, s: 5, color: '#aaccff', type: 'B2V', mag: 2.02, planets: 0 },
            { name: 'Ascella', x: -13200, y: 3600, s: 4, color: '#fff', type: 'Binary', mag: 2.59, planets: 1 },
            { name: 'Kaus Media', x: -13500, y: 2800, s: 4, color: '#ffa500', type: 'Giant', mag: 2.70, planets: 0 },
            { name: 'Kaus Borealis', x: -13800, y: 2400, s: 4, color: '#ffd700', type: 'Giant', mag: 2.81, planets: 1 },
        ], lines: [[4,3],[3,0],[0,2],[0,1],[1,4]] },
        { name: 'Aquarius', cx: 16000, cy: -6000, stars: [
            { name: 'Sadalsuud', x: 16000, y: -6000, s: 6, color: '#fff4cc', type: 'Supergiant', mag: 2.87, planets: 1 },
            { name: 'Sadalmelik', x: 15500, y: -6500, s: 5, color: '#ffd700', type: 'Supergiant', mag: 2.95, planets: 0, dist: '520 ly' },
            { name: 'Skat', x: 16500, y: -5200, s: 4, color: '#fff', type: 'Main Sequence', mag: 3.27, planets: 2 },
            { name: 'Albali', x: 15000, y: -5500, s: 3, color: '#fff', type: 'Main Sequence', mag: 3.77, planets: 0 },
        ], lines: [[3,1],[1,0],[0,2]] },
        { name: 'Pisces', cx: 17000, cy: -1000, stars: [
            { name: 'Eta Piscium', x: 17000, y: -1000, s: 5, color: '#ffd700', type: 'Giant', mag: 3.62, planets: 1 },
            { name: 'Gamma Piscium', x: 17500, y: -400, s: 4, color: '#ffd700', type: 'Giant', mag: 3.69, planets: 0 },
            { name: 'Omega Piscium', x: 16500, y: -1500, s: 3, color: '#fff', type: 'Subgiant', mag: 4.01, planets: 0 },
            { name: 'Iota Piscium', x: 17800, y: -1200, s: 4, color: '#fff4cc', type: 'Main Sequence F7V', mag: 4.13, planets: 2, dist: '45 ly' },
        ], lines: [[2,0],[0,1],[1,3]] },
    ];

    // ═══════════════════════════════════════════════════════
    // SOLAR SYSTEM — Named Moons
    // ═══════════════════════════════════════════════════════
    const sun = { r: 50, color: '#facc15', glow: '#fef08a' };
    const planets = [
        { name:'Mercury', d:80, e:0.2056, s:3, c:'#a8a29e', v:0.04, a:0, moons:[] },
        { name:'Venus', d:130, e:0.0067, s:6, c:'#fcd34d', v:0.015, a:1, moons:[] },
        { name:'Earth', d:190, e:0.0167, s:7, c:'#3b82f6', v:0.01, a:2, moons:[{name:'Moon', d:14, s:1.5, c:'#ddd', v:0.04, a:0}] },
        { name:'Mars', d:250, e:0.0934, s:5, c:'#ef4444', v:0.008, a:-1, moons:[
            {name:'Phobos', d:9, s:0.8, c:'#aaa', v:0.06, a:0},
            {name:'Deimos', d:16, s:0.6, c:'#999', v:0.03, a:2}
        ]},
        { name:'Jupiter', d:450, e:0.0489, s:22, c:'#fdba74', v:0.002, a:3, bands:true, moons:[
            {name:'Io', d:32, s:2, c:'#ffeb3b', v:0.02, a:0},
            {name:'Europa', d:45, s:1.8, c:'#e0e8ff', v:0.015, a:1},
            {name:'Ganymede', d:65, s:2.5, c:'#ccc', v:0.01, a:2},
            {name:'Callisto', d:90, s:2.3, c:'#888', v:0.007, a:3},
            {name:'Amalthea', d:28, s:1.2, c:'#cca', v:0.025, a:4},
            {name:'Thebe', d:26, s:0.7, c:'#bba', v:0.028, a:5},
            {name:'Himalia', d:110, s:1.0, c:'#997', v:0.004, a:0.5},
            {name:'Elara', d:120, s:0.7, c:'#887', v:0.003, a:1.5}
        ]},
        { name:'Saturn', d:650, e:0.0565, s:18, c:'#fde047', v:0.001, a:5, hasRings:true, moons:[
            {name:'Titan', d:48, s:3, c:'#ffb74d', v:0.012, a:0},
            {name:'Enceladus', d:30, s:1, c:'#fff', v:0.03, a:1},
            {name:'Mimas', d:25, s:0.8, c:'#bbb', v:0.04, a:2},
            {name:'Dione', d:35, s:1.2, c:'#ddd', v:0.02, a:3},
            {name:'Rhea', d:40, s:1.5, c:'#eef', v:0.018, a:4},
            {name:'Iapetus', d:60, s:1.4, c:'#999', v:0.008, a:5},
            {name:'Tethys', d:33, s:1.1, c:'#dde', v:0.022, a:0.7},
            {name:'Hyperion', d:55, s:0.9, c:'#aa8', v:0.01, a:1.2}
        ]},
        { name:'Uranus', d:850, e:0.0463, s:14, c:'#67e8f9', v:0.0005, a:0, moons:[
            {name:'Titania', d:25, s:1.5, c:'#ccc', v:0.015, a:0},
            {name:'Oberon', d:32, s:1.4, c:'#bbb', v:0.01, a:1},
            {name:'Umbriel', d:18, s:1.2, c:'#999', v:0.02, a:2},
            {name:'Ariel', d:20, s:1.1, c:'#ddd', v:0.025, a:3},
            {name:'Miranda', d:15, s:0.9, c:'#eee', v:0.035, a:4},
            {name:'Puck', d:12, s:0.6, c:'#aab', v:0.04, a:5},
            {name:'Cordelia', d:10, s:0.4, c:'#bbc', v:0.05, a:0.3}
        ]},
        { name:'Neptune', d:1050, e:0.0086, s:13, c:'#3b82f6', v:0.0004, a:Math.PI, moons:[
            {name:'Triton', d:25, s:2, c:'#b3e5fc', v:-0.015, a:0},
            {name:'Proteus', d:18, s:1.2, c:'#aaa', v:0.02, a:1},
            {name:'Nereid', d:40, s:0.8, c:'#888', v:0.008, a:2},
            {name:'Larissa', d:14, s:0.7, c:'#99b', v:0.03, a:3},
            {name:'Galatea', d:12, s:0.5, c:'#aac', v:0.035, a:4}
        ]},
        { name:'Pluto', d:1250, e:0.2488, s:2.5, c:'#ddc', v:0.0002, a:4, isDwarf:true, moons:[
            {name:'Charon', d:8, s:1.2, c:'#ccc', v:0.05, a:0},
            {name:'Nix', d:14, s:0.5, c:'#bba', v:0.02, a:1.5},
            {name:'Hydra', d:18, s:0.5, c:'#aab', v:0.015, a:3}
        ]},
        { name:'Ceres', d:340, e:0.0758, s:2, c:'#a8a8a0', v:0.006, a:2.5, isDwarf:true, moons:[] },
        { name:'Haumea', d:1400, e:0.1912, s:2.2, c:'#e8ddd0', v:0.00018, a:1, isDwarf:true, moons:[
            {name:'Hi\u02BBiaka', d:10, s:0.5, c:'#ccc', v:0.03, a:0},
            {name:'Namaka', d:7, s:0.4, c:'#bbb', v:0.04, a:2}
        ]},
        { name:'Makemake', d:1500, e:0.1559, s:2, c:'#e0c8a0', v:0.00015, a:3, isDwarf:true, moons:[
            {name:'MK2', d:6, s:0.3, c:'#888', v:0.05, a:0}
        ]},
        { name:'Eris', d:1700, e:0.4407, s:2.3, c:'#e8e8e8', v:0.0001, a:5.5, isDwarf:true, moons:[
            {name:'Dysnomia', d:10, s:0.6, c:'#999', v:0.025, a:0}
        ]}
    ];

    // Procedural exoplanet systems
    function genExoSystem(star) {
        if(star._exo) return star._exo;
        let seed = star.name.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
        const rng = () => { seed=(seed*16807)%2147483647; return(seed-1)/2147483646; };
        const np = star.planets !== undefined ? star.planets : Math.floor(rng() * 4) + 1;
        const exoPlanets = [];
        for(let i=0; i<np; i++) {
            exoPlanets.push({
                name: `${star.name} ${String.fromCharCode(98+i)}`,
                d: 20 + i * 18 + rng()*10,
                s: 2 + rng()*5,
                c: `hsl(${rng()*360},${40+rng()*40}%,${40+rng()*30}%)`,
                v: 0.02 + rng()*0.03,
                a: rng() * Math.PI * 2
            });
        }
        star._exo = exoPlanets;
        return exoPlanets;
    }

    // ═══════════════════════════════════════════════════════
    // GALAXIES — Full Visual Rendering (PERSISTENT across zoom)
    // ═══════════════════════════════════════════════════════
    const GALAXIES = [
        { name: 'Milky Way', x: -100000, y: 50000, r: 8000, color: '#cce0ff', type: 'Barred Spiral Galaxy', dist: '0 Mly', arms: 4, bh: 'Sagittarius A*', bhMass: '4M solar', orionArm: true },
        { name: 'Andromeda (M31)', x: 800000, y: -500000, r: 10000, color: '#e6f0ff', type: 'Spiral Galaxy', dist: '2.5 Mly', arms: 2, bh: 'P2', bhMass: '140M solar' },
        { name: 'Triangulum (M33)', x: 600000, y: -400000, r: 4000, color: '#ccccff', type: 'Spiral Galaxy', dist: '2.7 Mly', arms: 2, bh: 'M33 X-7', bhMass: '15M solar' },
        { name: 'Centaurus A', x: -400000, y: 600000, r: 6000, color: '#ffccb3', type: 'Lenticular Galaxy', dist: '11 Mly', arms: 0, bh: 'Cen A BH', bhMass: '55M solar' },
        { name: 'M81 (Bode)', x: 200000, y: -800000, r: 5000, color: '#e6e6fa', type: 'Spiral Galaxy', dist: '11.8 Mly', arms: 2, bh: 'M81*', bhMass: '70M solar' },
        { name: 'Sombrero (M104)', x: -700000, y: -200000, r: 5500, color: '#ffebcc', type: 'Spiral Galaxy', dist: '31 Mly', arms: 1, bh: 'M104 BH', bhMass: '1B solar' },
        { name: 'Pinwheel (M101)', x: 1200000, y: 300000, r: 7000, color: '#eef', type: 'Spiral Galaxy', dist: '21 Mly', arms: 5, bh: 'M101 Center', bhMass: '20M solar' },
        { name: 'Whirlpool (M51)', x: 500000, y: 700000, r: 5000, color: '#ddeeff', type: 'Spiral Galaxy', dist: '23 Mly', arms: 2, bh: 'M51 BH', bhMass: '40M solar' },
        { name: 'Large Magellanic Cloud', x: -300000, y: 300000, r: 3500, color: '#e8e0ff', type: 'Irregular Galaxy', dist: '0.16 Mly', arms: 1, bh: 'LMC X-1', bhMass: '10M solar' },
        { name: 'Small Magellanic Cloud', x: -250000, y: 350000, r: 2000, color: '#e0e8ff', type: 'Irregular Galaxy', dist: '0.20 Mly', arms: 0, bh: 'SMC BH', bhMass: '5M solar' },
        { name: 'M87 (Virgo A)', x: -900000, y: -800000, r: 9000, color: '#ffe8cc', type: 'Elliptical Galaxy', dist: '54 Mly', arms: 0, bh: 'M87*', bhMass: '6.5B solar' },
        { name: 'NGC 1300', x: 1500000, y: -600000, r: 4500, color: '#ffeedd', type: 'Barred Spiral', dist: '69 Mly', arms: 2, bh: 'NGC 1300 BH', bhMass: '73M solar' },
        { name: 'Cartwheel Galaxy', x: -1200000, y: 900000, r: 5500, color: '#ccffee', type: 'Ring Galaxy', dist: '489 Mly', arms: 0, bh: 'Cartwheel BH', bhMass: '100M solar' },
    ];

    const CLUSTERS = [
        { name: 'Local Group', x: 200000, y: -200000, r: 1500000 },
        { name: 'Virgo Cluster', x: -5000000, y: 3000000, r: 4000000 },
        { name: 'Fornax Cluster', x: 4000000, y: -6000000, r: 3500000 }
    ];

    // Generate galaxy particle systems
    function genGalaxyParticles(g) {
        if(g._particles) return g._particles;
        let seed = g.name.length * 12345 + g.x;
        const rng = () => { seed=(seed*16807)%2147483647; return(seed-1)/2147483646; };
        const p = [];
        const numParticles = 3000;
        const numArms = g.arms || 2;
        const isElliptical = g.type.includes('Elliptical');
        const isIrregular = g.type.includes('Irregular');
        const isRing = g.type.includes('Ring');

        for(let i=0; i<numParticles; i++) {
            let a, d, tilt, v;
            if(isRing) {
                tilt = 0.85; d = g.r * (0.6 + rng() * 0.35); a = rng() * Math.PI * 2;
                v = 150 / Math.max(10, d) * (rng() > 0.5 ? 1 : -1);
            } else if(isElliptical) {
                tilt = 0.7; d = rng() * g.r * Math.pow(rng(), 0.3); a = rng() * Math.PI * 2;
                v = 200 / Math.max(10, d);
            } else if(isIrregular) {
                tilt = 0.9; d = rng() * g.r * 0.8; a = rng() * Math.PI * 2;
                v = 50 / Math.max(10, d) * (rng() > 0.5 ? 1 : -1);
            } else {
                tilt = 0.6;
                const armIndex = Math.floor(rng() * numArms);
                const armOffset = (armIndex / numArms) * Math.PI * 2;
                d = rng() * g.r;
                const windFactor = 2.5 + rng() * 0.2;
                a = armOffset + (d / g.r) * windFactor + (rng()-0.5) * 0.4;
                v = 180 / Math.max(200, d);
            }
            if(d < g.r * 0.05) v *= 2.5;
            const normalizedDist = d / g.r;
            const hue = isRing ? 180 + rng()*40 : (220 + rng() * 30 - normalizedDist * 20);
            const sat = 50 + rng() * 40;
            const lum = 55 + rng() * 25 - normalizedDist * 15;
            const alpha = (0.15 + rng() * 0.6) * (1 - normalizedDist * 0.4);
            p.push({ a, d, tilt, v, s: rng() * 2.5 + 0.8, c: `hsla(${hue}, ${sat}%, ${lum}%, ${alpha})` });
        }
        g._particles = p;
        return p;
    }

    // Info Panel Logic
    let hoveredObj = null;
    let selectedObj = null;

    canvas.addEventListener('click', e => {
        if(hoveredObj) {
            selectedObj = hoveredObj;
            if (selectedObj.x !== undefined && selectedObj.y !== undefined) {
                cxTarget = selectedObj.x;
                cyTarget = selectedObj.y;
            }
            zoomTarget = selectedObj.targetZoom || 15;
            
            $('#ipTitle').innerHTML = `<span>${selectedObj.emoji || '✨'}</span> ${selectedObj.name}`;
            $('#ipType').textContent = selectedObj.type || 'Celestial Object';
            $('#ipMag').textContent = selectedObj.mag !== undefined ? selectedObj.mag : 'N/A';
            $('#ipPlanets').textContent = selectedObj.planets !== undefined ? selectedObj.planets : 'N/A';
            $('#ipDist').textContent = selectedObj.dist || (Math.round(Math.hypot(selectedObj.x, selectedObj.y)/10) + ' ly');
            
            const btnLand = $('#btnLandRover');
            if(selectedObj.type === 'Solar System Planet' && ['Mars', 'Moon'].includes(selectedObj.name)) {
                btnLand.classList.remove('hidden');
                btnLand.style.display = 'block';
                btnLand.onclick = () => launchRoverSimulator(selectedObj.name);
            } else {
                btnLand.style.display = 'none';
            }

            $('#infoPanel').style.right = '15px';
        } else {
            $('#infoPanel').style.right = '-400px';
            selectedObj = null;
        }
    });

    canvas.addEventListener('mousemove', e => {
        const w = canvas.width, h = canvas.height;
        const mx = (e.clientX - w/2) / zoom + cx;
        const my = (e.clientY - h/2) / zoom + cy;
        hoveredObj = null;

        if (zoom < 0.005) {
            for(const g of GALAXIES) {
                if(Math.hypot(mx - g.x, my - g.y) < Math.max(g.r, 50/zoom)) {
                    hoveredObj = {...g, emoji: '🌌', targetZoom: 0.005};
                    break;
                }
            }
        } else if (zoom >= 0.005 && zoom < 10) {
            // Check Stars
            for(const c of CONSTELLATIONS) {
                for(const s of c.stars) {
                    if(Math.hypot(mx - s.x, my - s.y) < Math.max(s.s*2, 30/zoom)) {
                        hoveredObj = {...s, emoji: '⭐', targetZoom: 20};
                        break;
                    }
                }
                if(hoveredObj) break;
            }
            // Check Solar System Planets
            if(!hoveredObj && Math.hypot(mx, my) < 2000) {
                if(Math.hypot(mx, my) < sun.r) {
                    hoveredObj = {name:'Sun', x:0, y:0, type:'G-Type Main Sequence', emoji:'☀️', targetZoom: 1.5, mag: -26.74, planets: 8, dist: '0 ly'};
                } else {
                    for(const p of planets) {
                        const r = p.d * (1 - p.e * p.e) / (1 + p.e * Math.cos(p.a));
                        const px = Math.cos(p.a) * r;
                        const py = Math.sin(p.a) * r;
                        if(Math.hypot(mx - px, my - py) < Math.max(p.s*2, 20/zoom)) {
                            hoveredObj = {...p, x:px, y:py, emoji:'🪐', type:'Solar System Planet', mag:'N/A', planets: p.moons.length + ' moons', targetZoom: 25, dist: p.d + ' Mkm'};
                            break;
                        }
                    }
                }
            }
            // Check galaxies at this zoom (they persist)
            if(!hoveredObj && zoom < 0.1) {
                for(const g of GALAXIES) {
                    if(Math.hypot(mx - g.x, my - g.y) < Math.max(g.r * 0.5, 200/zoom)) {
                        hoveredObj = {...g, emoji: '🌌', targetZoom: 0.01};
                        break;
                    }
                }
            }
        } else if (zoom >= 10 && selectedObj) {
            // Check Exo Planets or Moons
            if(selectedObj.moons) {
                for(const m of selectedObj.moons) {
                    const cx2 = selectedObj.x; const cy2 = selectedObj.y;
                    const mmx = cx2 + Math.cos(m.a)*m.d;
                    const mmy = cy2 + Math.sin(m.a)*m.d;
                    const d = Math.hypot((e.clientX - w/2)/zoom + cx - mmx, (e.clientY - h/2)/zoom + cy - mmy);
                    if(d < Math.max(m.s*2, 20/zoom)) {
                        hoveredObj = {...m, x:mmx, y:mmy, emoji:'🌑', type:'Natural Satellite', mag:'N/A', planets:0, targetZoom: 100, dist: selectedObj.dist};
                        break;
                    }
                }
            } else if (selectedObj._exo) {
                for(const ep of selectedObj._exo) {
                    const cx2 = selectedObj.x; const cy2 = selectedObj.y;
                    const emx = cx2 + Math.cos(ep.a)*ep.d;
                    const emy = cy2 + Math.sin(ep.a)*ep.d;
                    const d = Math.hypot((e.clientX - w/2)/zoom + cx - emx, (e.clientY - h/2)/zoom + cy - emy);
                    if(d < Math.max(ep.s*2, 20/zoom)) {
                        hoveredObj = {...ep, x:emx, y:emy, emoji:'🌍', type:'Exoplanet', mag:'N/A', planets:0, targetZoom: 100, dist: selectedObj.dist};
                        break;
                    }
                }
            }
        }
        
        canvas.style.cursor = hoveredObj ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
    });

    // ═══════════════════════════════════════════════════════
    // ZOOM DEPTH LABEL
    // ═══════════════════════════════════════════════════════
    function getZoomDepthLabel(z) {
        if(z < 0.000005) return 'Supercluster Scale';
        if(z < 0.00005) return 'Galaxy Cluster';
        if(z < 0.0005) return 'Local Group';
        if(z < 0.003) return 'Galactic View';
        if(z < 0.01) return 'Constellation Field';
        if(z < 0.1) return 'Star Field';
        if(z < 2) return 'Solar System';
        if(z < 50) return 'Planet View';
        return 'Moon Detail';
    }

    let time = 0;
    let timeSpeed = 1;
    let showAsteroids = true;
    let trueScale = false;

    // Generate asteroid belt (cached)
    const asteroids = [];
    {
        let aseed = 42;
        const arng = () => { aseed=(aseed*16807)%2147483647; return(aseed-1)/2147483646; };
        for(let i=0; i<400; i++) {
            const d = 300 + arng() * 130; // Between Mars (250) and Jupiter (450)
            asteroids.push({ a: arng()*Math.PI*2, d, s: arng()*1.5+0.3, v: 0.003+arng()*0.002, b: arng()*0.5+0.3 });
        }
    }

    // Generate Kuiper Belt (cached)
    const kuiperBelt = [];
    {
        let kseed = 84;
        const krng = () => { kseed=(kseed*16807)%2147483647; return(kseed-1)/2147483646; };
        for(let i=0; i<600; i++) {
            const d = 1100 + krng() * 700; // Beyond Neptune (1050)
            kuiperBelt.push({ a: krng()*Math.PI*2, d, s: krng()*1.2+0.2, v: 0.0005+krng()*0.001, b: krng()*0.4+0.2 });
        }
    }

    // Control bindings
    const timeSlider = $('#timeSpeedSlider');
    const timeLabel = $('#timeSpeedVal');
    if(timeSlider) timeSlider.addEventListener('input', e => {
        timeSpeed = parseFloat(e.target.value);
        if(timeLabel) timeLabel.textContent = (timeSpeed >= 0 ? '' : '') + timeSpeed + '×';
    });
    const astToggle = $('#showAsteroidBelt');
    if(astToggle) astToggle.addEventListener('change', e => showAsteroids = e.target.checked);
    const scaleToggle = $('#distScaleToggle');
    if(scaleToggle) scaleToggle.addEventListener('change', e => trueScale = e.target.checked);

    function draw() {
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = '#020208';
        ctx.fillRect(0, 0, w, h);
        time += timeSpeed;

        // Logarithmic zoom interpolation and smooth camera
        zoom = Math.exp(Math.log(zoom) + (Math.log(zoomTarget) - Math.log(zoom)) * 0.04);
        cx += (cxTarget - cx) * 0.04;
        cy += (cyTarget - cy) * 0.04;

        // HUD
        let zText = zoom < 0.001 ? (zoom*1000000).toFixed(0) + ' µx' : (zoom*1000).toFixed(1) + 'x';
        $('#zoomInfo').textContent = `Zoom: ${zText} | [${Math.round(cx)}, ${Math.round(cy)}]`;
        const depthLabel = $('#zoomLevelText');
        if(depthLabel) depthLabel.textContent = getZoomDepthLabel(zoom);

        ctx.save();
        ctx.translate(w/2, h/2);
        ctx.scale(zoom, zoom);
        ctx.translate(-cx, -cy);

        const vw = w/zoom, vh = h/zoom;
        const vl = cx - vw/2, vr = cx + vw/2, vt = cy - vh/2, vb = cy + vh/2;

        // ─── 1. GALAXIES & DEEP SPACE (ALWAYS VISIBLE when zoom < 0.1) ───
        if (zoom < 0.1) {
            const galaxyFade = zoom > 0.01 ? Math.max(0, 1 - (zoom - 0.01) / 0.09) : 1;
            
            for(const g of GALAXIES) {
                const galaxyScreenR = g.r * zoom;
                const galaxyMargin = Math.max(g.r * 3, 50/zoom);
                if(g.x < vl - galaxyMargin || g.x > vr + galaxyMargin || g.y < vt - galaxyMargin || g.y > vb + galaxyMargin) continue;
                
                // At very far zoom, render galaxies as glowing dots
                if(galaxyScreenR < 2) {
                    const dotR = Math.max(3, 8 - galaxyScreenR * 2) / zoom;
                    const dotG = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, dotR);
                    dotG.addColorStop(0, 'rgba(255,255,255,0.9)');
                    dotG.addColorStop(0.3, g.color);
                    dotG.addColorStop(1, 'transparent');
                    ctx.fillStyle = dotG;
                    ctx.beginPath(); ctx.arc(g.x, g.y, dotR, 0, Math.PI*2); ctx.fill();
                }

                // Render Galaxy Particles — animated, with fade
                const particles = genGalaxyParticles(g);
                ctx.globalCompositeOperation = 'screen';
                const pScale = Math.max(0.5, Math.min(200, 1.5 / Math.max(0.00001, zoom * 10)));
                const particleAlpha = Math.min(1, galaxyScreenR / 2) * galaxyFade;
                if(particleAlpha > 0.02) {
                    ctx.globalAlpha = particleAlpha;
                    for(const p of particles) {
                        const baseAngle = p.a + time * p.v * 0.0005; 
                        const dx = Math.cos(baseAngle) * p.d;
                        const dy = Math.sin(baseAngle) * p.d * p.tilt;
                        ctx.fillStyle = p.c;
                        const ps = p.s * pScale;
                        ctx.fillRect(g.x + dx - ps/2, g.y + dy - ps/2, ps, ps);
                    }
                    ctx.globalAlpha = 1;
                }
                ctx.globalCompositeOperation = 'source-over';

                // Central Bulge Glow
                const bulgeR = g.type.includes('Elliptical') ? g.r/2 : g.r/4;
                const coreG = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, bulgeR);
                coreG.addColorStop(0, `rgba(255,255,255,${0.9 * galaxyFade})`);
                coreG.addColorStop(0.15, g.color);
                coreG.addColorStop(0.6, `rgba(180,200,255,${0.3 * galaxyFade})`);
                coreG.addColorStop(1, 'transparent');
                ctx.fillStyle = coreG;
                ctx.beginPath(); ctx.arc(g.x, g.y, bulgeR, 0, Math.PI*2); ctx.fill();

                // Outer halo
                const haloG = ctx.createRadialGradient(g.x, g.y, g.r*0.3, g.x, g.y, g.r*1.2);
                haloG.addColorStop(0, 'transparent');
                haloG.addColorStop(0.5, `rgba(150,170,255,${0.03 * galaxyFade})`);
                haloG.addColorStop(1, 'transparent');
                ctx.fillStyle = haloG;
                ctx.beginPath(); ctx.arc(g.x, g.y, g.r*1.2, 0, Math.PI*2); ctx.fill();

                // BLACK HOLE at center (visible when zooming closer)
                if (zoom > 0.0003) {
                    const bhSize = 100 + g.r * 0.02;
                    const bhDetail = Math.min(1, (zoom - 0.0003) / 0.002);
                    
                    // Stars surrounding black hole
                    if(bhDetail > 0.3) {
                        if(!g._bhStars) {
                            let bseed = g.name.length * 99;
                            const brng = () => { bseed=(bseed*16807)%2147483647; return(bseed-1)/2147483646; };
                            g._bhStars = [];
                            for(let i=0; i<200; i++) {
                                const dist = bhSize * (2 + brng() * 15);
                                const angle = brng() * Math.PI * 2;
                                g._bhStars.push({
                                    dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist,
                                    s: brng() * 1.5 + 0.5, b: brng() * 0.5 + 0.5,
                                    orbitV: (brng() - 0.5) * 0.003, angle: angle
                                });
                            }
                        }
                        for(const bs of g._bhStars) {
                            bs.angle += bs.orbitV;
                            const dist = Math.hypot(bs.dx, bs.dy);
                            const bsx = g.x + Math.cos(bs.angle) * dist;
                            const bsy = g.y + Math.sin(bs.angle) * dist;
                            const twinkle = 0.7 + 0.3 * Math.sin(time * 0.05 + bs.dx);
                            ctx.fillStyle = `rgba(255,250,230,${bs.b * twinkle * bhDetail * galaxyFade})`;
                            const starS = bs.s / Math.max(0.001, zoom * 5);
                            ctx.fillRect(bsx - starS/2, bsy - starS/2, starS, starS);
                        }
                    }
                    
                    // Event horizon
                    ctx.globalAlpha = galaxyFade;
                    ctx.fillStyle = '#000';
                    ctx.beginPath(); ctx.arc(g.x, g.y, bhSize, 0, Math.PI*2); ctx.fill();
                    
                    // Accretion disk
                    const rot = time * 0.008;
                    const diskLayers = [
                        { color: `rgba(255,100,30,${0.8*galaxyFade})`, rx: 3.0, ry: 0.7, w: 15 },
                        { color: `rgba(255,180,60,${0.6*galaxyFade})`, rx: 2.5, ry: 0.55, w: 10 },
                        { color: `rgba(255,220,120,${0.5*galaxyFade})`, rx: 2.0, ry: 0.45, w: 7 },
                        { color: `rgba(180,140,255,${0.35*galaxyFade})`, rx: 3.5, ry: 0.85, w: 5 },
                    ];
                    for(const dl of diskLayers) {
                        ctx.strokeStyle = dl.color;
                        ctx.lineWidth = dl.w / Math.max(0.001, zoom*5);
                        ctx.beginPath();
                        ctx.ellipse(g.x, g.y, bhSize * dl.rx, bhSize * dl.ry, rot, 0, Math.PI*2);
                        ctx.stroke();
                    }
                    // Vertical jets
                    if(bhDetail > 0.5) {
                        const jetLen = bhSize * 8 * bhDetail;
                        const jetG1 = ctx.createLinearGradient(g.x, g.y - jetLen, g.x, g.y);
                        jetG1.addColorStop(0, 'transparent');
                        jetG1.addColorStop(0.5, `rgba(100,150,255,${0.15*galaxyFade})`);
                        jetG1.addColorStop(1, `rgba(150,180,255,${0.3*galaxyFade})`);
                        ctx.fillStyle = jetG1;
                        ctx.beginPath();
                        ctx.moveTo(g.x - bhSize*0.3, g.y); ctx.lineTo(g.x, g.y - jetLen); ctx.lineTo(g.x + bhSize*0.3, g.y);
                        ctx.fill();
                        const jetG2 = ctx.createLinearGradient(g.x, g.y, g.x, g.y + jetLen);
                        jetG2.addColorStop(0, `rgba(150,180,255,${0.3*galaxyFade})`);
                        jetG2.addColorStop(0.5, `rgba(100,150,255,${0.15*galaxyFade})`);
                        jetG2.addColorStop(1, 'transparent');
                        ctx.fillStyle = jetG2;
                        ctx.beginPath();
                        ctx.moveTo(g.x - bhSize*0.3, g.y); ctx.lineTo(g.x, g.y + jetLen); ctx.lineTo(g.x + bhSize*0.3, g.y);
                        ctx.fill();
                    }
                    
                    // Gravitational lensing ring
                    const lensG = ctx.createRadialGradient(g.x, g.y, bhSize*0.8, g.x, g.y, bhSize*2.5);
                    lensG.addColorStop(0, `rgba(255,220,150,${0.6*galaxyFade})`);
                    lensG.addColorStop(0.3, `rgba(255,180,100,${0.3*galaxyFade})`);
                    lensG.addColorStop(0.7, `rgba(200,150,100,${0.1*galaxyFade})`);
                    lensG.addColorStop(1, 'transparent');
                    ctx.fillStyle = lensG;
                    ctx.beginPath(); ctx.arc(g.x, g.y, bhSize*2.5, 0, Math.PI*2); ctx.fill();

                    // BH label
                    ctx.fillStyle = `rgba(255,200,150,${0.9*galaxyFade})`;
                    ctx.font = `bold ${10/zoom}px Inter,sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText(g.bh || 'SMBH', g.x, g.y - bhSize*4);
                    ctx.fillStyle = `rgba(255,200,150,${0.5*galaxyFade})`;
                    ctx.font = `${7/zoom}px Inter,sans-serif`;
                    ctx.fillText(g.bhMass ? `Mass: ~${g.bhMass}` : '', g.x, g.y - bhSize*4 + 12/zoom);
                    ctx.globalAlpha = 1;
                }

                // ─── ORION ARM — Milky Way's spiral arm connecting to solar system ───
                if(g.orionArm && zoom > 0.002 && zoom < 0.08) {
                    const armAlpha = Math.min(0.4, (zoom - 0.002) / 0.01) * galaxyFade;
                    // Draw arm from Milky Way center toward (0,0) solar system
                    ctx.strokeStyle = `rgba(150,180,255,${armAlpha * 0.3})`;
                    ctx.lineWidth = 3000;
                    ctx.beginPath();
                    ctx.moveTo(g.x, g.y);
                    ctx.quadraticCurveTo(g.x * 0.4, g.y * 0.6, 0, 0);
                    ctx.stroke();

                    // Label
                    const midX = g.x * 0.3, midY = g.y * 0.4;
                    ctx.fillStyle = `rgba(180,200,255,${armAlpha})`;
                    ctx.font = `300 ${12/zoom}px Inter,sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText('ORION ARM', midX, midY - 2000);
                    ctx.font = `${8/zoom}px Inter,sans-serif`;
                    ctx.fillStyle = `rgba(150,170,255,${armAlpha * 0.6})`;
                    ctx.fillText('Our location in the Milky Way', midX, midY - 2000 + 14/zoom);

                    // Sun marker at origin
                    if(zoom > 0.005) {
                        const sunG = ctx.createRadialGradient(0, 0, 0, 0, 0, 500);
                        sunG.addColorStop(0, `rgba(255,200,50,${armAlpha})`);
                        sunG.addColorStop(1, 'transparent');
                        ctx.fillStyle = sunG;
                        ctx.beginPath(); ctx.arc(0, 0, 500, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = `rgba(255,220,100,${armAlpha})`;
                        ctx.font = `bold ${10/zoom}px Inter,sans-serif`;
                        ctx.fillText('☀ Sol / Solar System', 0, -800);
                    }
                }

                // Galaxy Name Label — always visible
                const isHov = hoveredObj && hoveredObj.name === g.name;
                const labelAlpha = (isHov ? 1 : Math.min(0.85, 0.3 + galaxyScreenR * 0.1)) * galaxyFade;
                ctx.fillStyle = `rgba(255,255,255,${labelAlpha})`;
                const fs = Math.max(8, Math.min(200, isHov ? 22/zoom : 16/zoom));
                ctx.font = `${isHov ? 'bold ' : '600 '}${fs}px Inter,sans-serif`;
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 5;
                ctx.fillText(g.name, g.x, g.y - Math.max(g.r/2.5, 20/zoom));
                ctx.font = `${fs*0.55}px Inter,sans-serif`;
                ctx.fillStyle = `rgba(180,200,255,${labelAlpha * 0.7})`;
                ctx.fillText(`${g.type} • ${g.dist}`, g.x, g.y - Math.max(g.r/2.5, 20/zoom) + fs*1.1);
                ctx.shadowBlur = 0;
            }

            if (zoom < 0.001) {
                // Background dark matter filaments (Cosmic Web)
                if (zoom < 0.00001) {
                    const webAlpha = Math.min(0.3, (0.00001 - zoom) / 0.000005);
                    ctx.strokeStyle = `rgba(100, 50, 200, ${webAlpha})`;
                    ctx.lineWidth = 100000;
                    ctx.beginPath();
                    
                    // Procedural interconnected web lines
                    for(let i=0; i<CLUSTERS.length; i++) {
                        for(let j=i+1; j<CLUSTERS.length; j++) {
                            const c1 = CLUSTERS[i];
                            const c2 = CLUSTERS[j];
                            const dist = Math.hypot(c1.x - c2.x, c1.y - c2.y);
                            if(dist < 5e6) { // Draw filament if close enough
                                ctx.moveTo(c1.x, c1.y);
                                
                                // Bezier curve for organic dark matter strand
                                const midX = (c1.x + c2.x) / 2 + (c1.y - c2.y) * 0.2;
                                const midY = (c1.y + c2.y) / 2 + (c2.x - c1.x) * 0.2;
                                ctx.quadraticCurveTo(midX, midY, c2.x, c2.y);
                            }
                        }
                    }
                    ctx.stroke();

                    // Glow effect for filaments
                    ctx.strokeStyle = `rgba(150, 100, 255, ${webAlpha * 0.5})`;
                    ctx.lineWidth = 300000;
                    ctx.stroke();
                    
                    // Supercluster Label
                    if (zoom < 0.000002) {
                        ctx.fillStyle = `rgba(200, 150, 255, ${webAlpha * 0.8})`;
                        const scFs = Math.max(10, Math.min(2000, 40/zoom));
                        ctx.font = `900 ${scFs}px Inter,sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.fillText("LANIAKEA SUPERCLUSTER", 0, -3e6);
                        ctx.font = `600 ${scFs/2}px Inter,sans-serif`;
                        ctx.fillStyle = `rgba(180, 120, 255, ${webAlpha * 0.5})`;
                        ctx.fillText("Cosmic Web / Dark Matter Filaments", 0, -3e6 + scFs * 1.5);
                    }
                }

                for(const cl of CLUSTERS) {
                    const clGrad = ctx.createRadialGradient(cl.x, cl.y, cl.r * 0.1, cl.x, cl.y, cl.r);
                    clGrad.addColorStop(0, 'rgba(100, 120, 255, 0.08)');
                    clGrad.addColorStop(0.5, 'rgba(80, 100, 220, 0.04)');
                    clGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = clGrad;
                    ctx.beginPath(); ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI*2); ctx.fill();
                    const dashLen = Math.max(10000, cl.r * 0.03);
                    ctx.strokeStyle = 'rgba(150, 170, 255, 0.2)';
                    ctx.lineWidth = Math.max(500, 3/zoom);
                    ctx.setLineDash([dashLen, dashLen]);
                    ctx.beginPath(); ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI*2); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = 'rgba(180,200,255,0.6)';
                    const clFs = Math.max(10, Math.min(500, 25/zoom));
                    ctx.font = `bold ${clFs}px Inter,sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
                    ctx.fillText(cl.name, cl.x, cl.y - cl.r * 0.85);
                    ctx.font = `${clFs * 0.5}px Inter,sans-serif`;
                    ctx.fillStyle = 'rgba(150,170,255,0.4)';
                    ctx.fillText('Galaxy Cluster', cl.x, cl.y - cl.r * 0.85 + clFs * 1.2);
                    ctx.shadowBlur = 0;
                }
                // Supercluster
                if(zoom < 0.0001) {
                    ctx.strokeStyle = 'rgba(120,140,255,0.08)';
                    ctx.lineWidth = Math.max(5000, 5/zoom);
                    ctx.beginPath();
                    ctx.moveTo(CLUSTERS[0].x, CLUSTERS[0].y);
                    ctx.lineTo(CLUSTERS[1].x, CLUSTERS[1].y);
                    ctx.lineTo(CLUSTERS[2].x, CLUSTERS[2].y);
                    ctx.stroke();
                    const scGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 12000000);
                    scGrad.addColorStop(0, 'rgba(100,120,255,0.03)');
                    scGrad.addColorStop(0.7, 'rgba(80,100,200,0.01)');
                    scGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = scGrad;
                    ctx.beginPath(); ctx.arc(0, 0, 12000000, 0, Math.PI*2); ctx.fill();
                    const scFs = Math.max(20, 60/zoom);
                    ctx.fillStyle = 'rgba(200,220,255,0.35)';
                    ctx.font = `300 ${scFs}px Inter,sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText('LANIAKEA SUPERCLUSTER', 0, -8000000);
                    ctx.font = `${scFs*0.4}px Inter,sans-serif`;
                    ctx.fillStyle = 'rgba(200,220,255,0.2)';
                    ctx.fillText('~250 Mpc • ~100,000 galaxies', 0, -8000000 + scFs * 0.8);
                }
            }
        }

        // ─── 2. INFINITE STARFIELD ───
        if (zoom > 0.0005 && zoom < 50) {
            const tileL = Math.floor(vl/TILE_SIZE) - 1;
            const tileR = Math.floor(vr/TILE_SIZE) + 1;
            const tileT = Math.floor(vt/TILE_SIZE) - 1;
            const tileB = Math.floor(vb/TILE_SIZE) + 1;
            let tileCount = 0;
            for(let tx = tileL; tx <= tileR && tileCount < 150; tx++) {
                for(let ty = tileT; ty <= tileB && tileCount < 150; ty++) {
                    const stars = getStarTile(tx, ty);
                    for(const s of stars) {
                        const twinkle = 0.7 + 0.3 * Math.sin(time * 0.03 + s.x * 0.01);
                        ctx.fillStyle = `hsla(${s.h},80%,80%,${s.b * twinkle})`;
                        ctx.fillRect(s.x, s.y, s.s / Math.max(1, zoom * 0.5), s.s / Math.max(1, zoom * 0.5));
                    }
                    tileCount++;
                }
            }
        }

        // ─── 3. NEBULA & GALAXY GLOW ───
        if(zoom > 0.0001 && zoom < 0.1) {
            ctx.globalCompositeOperation = 'screen';
            // Brighter, more prominent galaxies
            [[0,0,'rgba(60,20,120,0.4)'],[5000,-3000,'rgba(20,60,120,0.3)'],[-4000,4000,'rgba(120,30,30,0.3)'],[150000,-150000,'rgba(255,200,100,0.3)']].forEach(([nx,ny,nc]) => {
                const g = ctx.createRadialGradient(nx,ny,0,nx,ny,12000);
                g.addColorStop(0, nc); g.addColorStop(1, 'transparent');
                ctx.fillStyle = g; ctx.fillRect(nx-12000,ny-12000,24000,24000);
            });
            ctx.globalCompositeOperation = 'source-over';
        }
        
        // ─── 3.5. SUPERMASSIVE BLACK HOLE ───
        // Located far away at 150000, -150000
        const bhX = 150000, bhY = -150000, bhR = 50;
        if(zoom > 0.005) {
            const distToBH = Math.hypot(cx - bhX, cy - bhY);
            if(distToBH < 5000/zoom) {
                // Accretion disk
                ctx.save();
                ctx.translate(bhX, bhY);
                ctx.scale(1, 0.3); // Tilted disk
                const timeStr = Date.now() / 500;
                ctx.rotate(timeStr * 0.5);
                const diskGrad = ctx.createRadialGradient(0,0,bhR, 0,0,bhR*4);
                diskGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
                diskGrad.addColorStop(0.2, 'rgba(255,150,50,0.8)');
                diskGrad.addColorStop(0.6, 'rgba(100,20,150,0.4)');
                diskGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = diskGrad;
                ctx.beginPath(); ctx.arc(0,0,bhR*4, 0, Math.PI*2); ctx.fill();
                ctx.restore();
                
                // Event Horizon
                ctx.fillStyle = '#000';
                ctx.shadowBlur = 20 * zoom;
                ctx.shadowColor = '#fff';
                ctx.beginPath(); ctx.arc(bhX, bhY, bhR, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur = 0;
                
                // Lensing (simple representation)
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 2/zoom;
                ctx.beginPath(); ctx.arc(bhX, bhY, bhR*1.5, 0, Math.PI*2); ctx.stroke();
                
                // Label
                if(zoom > 0.05) {
                    ctx.fillStyle = '#fff';
                    ctx.font = `${20/zoom}px Inter`;
                    ctx.textAlign = 'center';
                    ctx.fillText('Sagittarius A*', bhX, bhY - bhR*2 - 10/zoom);
                    ctx.fillStyle = '#aaa';
                    ctx.font = `${12/zoom}px Inter`;
                    ctx.fillText('Supermassive Black Hole', bhX, bhY - bhR*2 + 10/zoom);
                }
            }
        }

        // ─── 4. CONSTELLATIONS ───
        if(zoom > 0.003 && zoom < 3) {
            for(const c of CONSTELLATIONS) {
                if(c.cx < vl - 5000 || c.cx > vr + 5000 || c.cy < vt - 5000 || c.cy > vb + 5000) continue;
                const lineAlpha = Math.min(0.35, zoom * 5);
                ctx.strokeStyle = `rgba(100,150,255,${lineAlpha})`;
                ctx.lineWidth = Math.max(0.5, 2 / zoom);
                ctx.setLineDash([]);
                ctx.beginPath();
                for(const [a,b] of c.lines) {
                    ctx.moveTo(c.stars[a].x, c.stars[a].y);
                    ctx.lineTo(c.stars[b].x, c.stars[b].y);
                }
                ctx.stroke();
                for(const s of c.stars) {
                    const isHovered = hoveredObj && hoveredObj.name === s.name;
                    const baseR = s.s / Math.max(0.3, Math.sqrt(zoom));
                    const r = baseR + (isHovered ? 4/Math.sqrt(zoom) : 0);
                    ctx.shadowBlur = isHovered ? 30/zoom : 15/zoom;
                    ctx.shadowColor = s.color;
                    ctx.fillStyle = s.color;
                    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI*2); ctx.fill();
                    ctx.shadowBlur = 0;
                    if(zoom > 0.008) {
                        const nameAlpha = Math.min(1, (zoom - 0.008) * 50);
                        ctx.fillStyle = isHovered ? '#fff' : `rgba(255,255,255,${nameAlpha * 0.7})`;
                        let fs = Math.max(8, Math.min(60, 14/zoom));
                        ctx.font = `${isHovered ? 'bold ' : ''}${fs}px Inter,sans-serif`;
                        ctx.textAlign = 'left';
                        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
                        ctx.fillText(s.name, s.x + r + 8/zoom, s.y + 5/zoom);
                        ctx.shadowBlur = 0;
                        if(isHovered && zoom > 0.015) {
                            ctx.fillStyle = 'rgba(180,200,255,0.85)';
                            ctx.font = `${fs * 0.65}px Inter,sans-serif`;
                            ctx.fillText(`${s.type} • Mag ${s.mag}`, s.x + r + 8/zoom, s.y + 5/zoom + fs*1.1);
                            if(s.dist) ctx.fillText(`Distance: ${s.dist}`, s.x + r + 8/zoom, s.y + 5/zoom + fs*2);
                        }
                    }
                }
                if(zoom > 0.005 && zoom < 0.5) {
                    const nameAlpha = Math.min(0.35, zoom * 4) * Math.max(0, 1 - zoom * 3);
                    ctx.fillStyle = `rgba(200,210,255,${nameAlpha})`;
                    const fs = 60/zoom;
                    ctx.font = `300 ${fs}px Inter,sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText(c.name.toUpperCase(), c.cx, c.cy - 1200);
                }
            }
        }

        // ─── 5. EXOPLANET SYSTEMS ───
        if(zoom > 5) {
            for(const c of CONSTELLATIONS) {
                for(const s of c.stars) {
                    if(s.planets <= 0) continue;
                    const dd = Math.hypot(cx - s.x, cy - s.y);
                    if(dd > 400/zoom) continue;
                    const sg = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 15);
                    sg.addColorStop(0, '#fff'); sg.addColorStop(0.5, s.color); sg.addColorStop(1, 'transparent');
                    ctx.fillStyle = sg;
                    ctx.beginPath(); ctx.arc(s.x, s.y, 15, 0, Math.PI*2); ctx.fill();
                    const exos = genExoSystem(s);
                    for(const ep of exos) {
                        ep.a -= ep.v * 0.5 * timeSpeed;
                        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                        ctx.lineWidth = 0.5/zoom;
                        ctx.beginPath(); ctx.arc(s.x, s.y, ep.d, 0, Math.PI*2); ctx.stroke();
                        const px = s.x + Math.cos(ep.a) * ep.d;
                        const py = s.y + Math.sin(ep.a) * ep.d;
                        ctx.fillStyle = ep.c;
                        const isHovered = hoveredObj && hoveredObj.name === ep.name;
                        const psize = isHovered ? ep.s*1.5 : ep.s;
                        ctx.beginPath(); ctx.arc(px, py, psize, 0, Math.PI*2); ctx.fill();
                        if(zoom > 10) {
                            ctx.fillStyle = isHovered ? '#fff' : '#aaa';
                            ctx.font = `${isHovered ? 1.5 : 1}px Inter`;
                            ctx.textAlign = 'left';
                            ctx.fillText(ep.name, px + psize + 1, py + 0.5);
                        }
                    }
                    ctx.fillStyle = '#fff';
                    ctx.font = `3px Inter,sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText(`${s.name} System`, s.x, s.y - 25);
                }
            }
        }

        // ─── 6. SOLAR SYSTEM ───
        if(zoom > 0.05 && cx > -10000 && cx < 10000) {
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1/zoom;
            for(const p of planets) { 
                ctx.beginPath(); 
                for(let angle = 0; angle <= Math.PI*2; angle += 0.05) {
                    const r = p.d * (1 - p.e * p.e) / (1 + p.e * Math.cos(angle));
                    if(angle === 0) ctx.moveTo(Math.cos(angle)*r, Math.sin(angle)*r);
                    else ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
                }
                ctx.closePath();
                ctx.stroke(); 
            }

            // Asteroid Belt
            if(showAsteroids && zoom > 0.2) {
                ctx.fillStyle = 'rgba(180,170,150,0.5)';
                for(const a of asteroids) {
                    a.a -= a.v * timeSpeed;
                    const ax = Math.cos(a.a)*a.d, ay = Math.sin(a.a)*a.d;
                    ctx.globalAlpha = a.b;
                    ctx.fillRect(ax - a.s/2, ay - a.s/2, a.s, a.s);
                }
                ctx.globalAlpha = 1;
                if(zoom > 0.5 && zoom < 3) {
                    ctx.fillStyle = 'rgba(180,170,150,0.25)';
                    ctx.font = `${9/zoom}px Inter`;
                    ctx.textAlign = 'center';
                    ctx.fillText('ASTEROID BELT', 350, 0);
                }
            }

            // Kuiper Belt (beyond Neptune)
            if(showAsteroids && zoom > 0.1 && zoom < 5) {
                ctx.fillStyle = 'rgba(120,140,180,0.35)';
                for(const kb of kuiperBelt) {
                    kb.a -= kb.v * timeSpeed;
                    const kx = Math.cos(kb.a)*kb.d, ky = Math.sin(kb.a)*kb.d;
                    ctx.globalAlpha = kb.b;
                    ctx.fillRect(kx - kb.s/2, ky - kb.s/2, kb.s, kb.s);
                }
                ctx.globalAlpha = 1;
                if(zoom > 0.2 && zoom < 2) {
                    ctx.fillStyle = 'rgba(120,140,180,0.2)';
                    ctx.font = `${9/zoom}px Inter`;
                    ctx.textAlign = 'center';
                    ctx.fillText('KUIPER BELT', 1450, 0);
                }
            }

            // Oort Cloud (outermost faint shell)
            if(showAsteroids && zoom > 0.02 && zoom < 1) {
                ctx.strokeStyle = 'rgba(100,120,160,0.08)';
                ctx.lineWidth = 2/zoom;
                ctx.setLineDash([10/zoom, 20/zoom]);
                ctx.beginPath(); ctx.arc(0, 0, 2500, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(0, 0, 3000, 0, Math.PI*2); ctx.stroke();
                ctx.setLineDash([]);
                if(zoom > 0.05 && zoom < 0.5) {
                    ctx.fillStyle = 'rgba(100,120,160,0.15)';
                    ctx.font = `${12/zoom}px Inter`;
                    ctx.textAlign = 'center';
                    ctx.fillText('OORT CLOUD', 2750, 0);
                }
            }
            const rg = ctx.createRadialGradient(0,0,sun.r*0.1,0,0,sun.r*2);
            rg.addColorStop(0,'#fff'); rg.addColorStop(0.5,sun.color); rg.addColorStop(1,'transparent');
            ctx.fillStyle = rg;
            ctx.beginPath(); ctx.arc(0,0,sun.r*2,0,Math.PI*2); ctx.fill();
            if(zoom > 0.3) {
                const hovSun = hoveredObj && hoveredObj.name === 'Sun';
                ctx.fillStyle = hovSun ? '#fff' : '#ccc';
                ctx.font = `${hovSun ? 16/zoom : 14/zoom}px Inter`;
                ctx.textAlign = 'center';
                ctx.fillText('Sun', 0, -sun.r*2 - 10/zoom);
            }
            for(const p of planets) {
                // Kepler's Second Law approximation: angular velocity depends inversely on distance squared
                const r = p.d * (1 - p.e * p.e) / (1 + p.e * Math.cos(p.a));
                const angularV = (p.v * (p.d * p.d) / (r * r));
                p.a -= angularV * timeSpeed;

                const px = Math.cos(p.a) * r;
                const py = Math.sin(p.a) * r;
                
                ctx.save(); ctx.translate(px,py);
                const isHoveredP = hoveredObj && hoveredObj.name === p.name;
                if(p.hasRings) {
                    ctx.strokeStyle='rgba(200,200,180,0.5)'; ctx.lineWidth=4/zoom;
                    ctx.beginPath(); ctx.ellipse(0,0,p.s+18,p.s+6,Math.PI/4,0,Math.PI*2); ctx.stroke();
                }
                ctx.fillStyle = p.c;
                ctx.beginPath(); ctx.arc(0,0,isHoveredP ? p.s*1.2 : p.s,0,Math.PI*2); ctx.fill();
                
                // Draw Moons — show labels at zoom > 1 (was > 8)
                if(zoom > 0.5 && p.moons && p.moons.length > 0) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                    ctx.lineWidth = 0.3/zoom;
                    for(const m of p.moons) {
                        m.a -= m.v;
                        const mmx = Math.cos(m.a)*m.d, mmy = Math.sin(m.a)*m.d;
                        ctx.beginPath(); ctx.arc(0,0,m.d,0,Math.PI*2); ctx.stroke();
                        const hoverM = hoveredObj && hoveredObj.name === m.name;
                        ctx.fillStyle = m.c;
                        ctx.beginPath(); ctx.arc(mmx, mmy, hoverM ? m.s*1.5 : m.s, 0, Math.PI*2); ctx.fill();
                        
                        // Moon names visible at zoom > 1 (was > 8)
                        if(zoom > 1) {
                            ctx.fillStyle = hoverM ? '#fff' : 'rgba(200,200,200,0.7)';
                            ctx.font = `${hoverM ? 1.8/Math.min(zoom/5,1) : 1.2/Math.min(zoom/5,1)}px Inter`;
                            ctx.textAlign = 'left';
                            ctx.fillText(m.name, mmx + m.s + 1, mmy);
                        }
                    }
                }
                if(zoom > 0.5) {
                    ctx.fillStyle= isHoveredP ? '#fff' : 'rgba(255,255,255,0.7)'; 
                    ctx.font=`${isHoveredP ? 16/zoom : 14/zoom}px Inter`; 
                    ctx.textAlign='center';
                    ctx.shadowColor='#000'; ctx.shadowBlur=3;
                    ctx.fillText(p.name, 0, -p.s - 15/zoom);
                    ctx.shadowBlur=0;
                    if(p.moons.length > 0 && zoom > 0.8 && zoom < 5) {
                        ctx.fillStyle = 'rgba(180,200,255,0.5)';
                        ctx.font = `${10/zoom}px Inter`;
                        ctx.fillText(`${p.moons.length} moons`, 0, p.s + 20/zoom);
                    }
                }
                ctx.restore();
            }
        }

        ctx.restore();

        // HUD Overlay
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(0, 0, w, 1);
        ctx.fillRect(0, h-1, w, 1);

        requestAnimationFrame(draw);
    }

    setTimeout(() => { zoomTarget = 0.02; }, 500);
    requestAnimationFrame(draw);
})();
