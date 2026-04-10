/* script.js for solar-system */
'use strict';
(function(){
    const $ = s => document.querySelector(s);
    if(typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });

    const canvas = $('#solarCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let w, h;
    function resize() {
        if(!canvas.parentElement) return;
        w = canvas.width = canvas.parentElement.clientWidth;
        h = canvas.height = Math.max(500, window.innerHeight - 200);
    }
    window.addEventListener('resize', resize);
    resize();

    // -- State & Camera --
    let zoom = 0.05;      // 0.01 = galaxy, 1 = solar system, 10+ = planets
    let zoomTarget = 1;
    let cx = 0, cy = 0;   // camera focus
    let isDragging = false;
    let dragStart = {x:0, y:0}, camStart = {x:0, y:0};

    // Deep zoom scale bounds
    const MIN_ZOOM = 0.005; // Macro galaxy view
    const MAX_ZOOM = 50.0;  // Planetary surface view

    // -- Controls --
    const controls = document.createElement('div');
    controls.innerHTML = `
        <div style="position:absolute; top:20px; left:20px; background:rgba(0,0,0,0.6); padding:10px; border-radius:8px; border:1px solid #333; z-index:10;">
            <p style="margin:0 0 5px 0; color:#fff; font-weight:bold;">Space Explorer</p>
            <div style="display:flex; gap:10px; margin-bottom: 10px;">
                <button id="z1" class="btn btn-secondary btn-sm">Galaxy</button>
                <button id="z2" class="btn btn-secondary btn-sm">Constellations</button>
                <button id="z3" class="btn btn-secondary btn-sm">System</button>
            </div>
            <p style="margin:0; font-size:12px; color:#aaa;">Scroll to pan/zoom deeper</p>
        </div>
    `;
    canvas.parentElement.style.position = 'relative';
    canvas.parentElement.appendChild(controls);

    $('#z1').onclick = () => zoomTarget = 0.005;
    $('#z2').onclick = () => zoomTarget = 0.05;
    $('#z3').onclick = () => zoomTarget = 1.0;

    canvas.addEventListener('mousedown', e => {
        isDragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
        camStart = { x: cx, y: cy };
    });
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', e => {
        if(!isDragging) return;
        cx = camStart.x - (e.clientX - dragStart.x) / zoom;
        cy = camStart.y - (e.clientY - dragStart.y) / zoom;
    });
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const zFactor = e.deltaY > 0 ? 0.8 : 1.25;
        zoomTarget = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomTarget * zFactor));
    });

    // -- Generate Universe Database --
    // 10,000 background stars
    const backgroundStars = [];
    for(let i=0; i<10000; i++) {
        // Galaxy shape (Gaussian spread around center)
        const a = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 3) * 60000; // spread radius
        backgroundStars.push({
            x: Math.cos(a) * r + (Math.random()-0.5)*5000,
            y: Math.sin(a) * r * 0.4 + (Math.random()-0.5)*5000, // elliptical
            size: Math.random() * 2 + 0.5,
            c: `hsla(${Math.random()*60+200}, 100%, ${Math.random()*50+50}%, ${Math.random()})`
        });
    }

    // Constellations (Major structural stars)
    const constellations = [];
    const numConstellations = 15;
    for(let c=0; c<numConstellations; c++) {
        const cx = (Math.random()-0.5)*20000;
        const cy = (Math.random()-0.5)*20000;
        const points = [];
        const numPoints = 4 + Math.floor(Math.random()*5);
        for(let p=0; p<numPoints; p++) {
            points.push({
                x: cx + (Math.random()-0.5)*3000,
                y: cy + (Math.random()-0.5)*3000,
                size: Math.random()*5 + 3
            });
        }
        const lines = [];
        for(let p=0; p<numPoints-1; p++) {
            lines.push([p, p+1]);
            if(p>1 && Math.random()>0.5) lines.push([p, Math.floor(Math.random()*p)]);
        }
        const colorH = Math.random()*360;
        constitems = { 
            name: `Sector ${String.fromCharCode(65+c)}-${Math.floor(Math.random()*999)}`,
            points, lines, color: `hsla(${colorH}, 80%, 70%, 0.6)` 
        };
        constellations.push(constitems);
    }

    // Central Solar System (Sun at 0,0)
    const sun = { r: 50, color: '#facc15', glow: '#fef08a' };
    const planets = [
        { name: 'Mercury', d: 80, s: 3, c: '#a8a29e', v: 0.04, a: 0 },
        { name: 'Venus', d: 130, s: 6, c: '#fcd34d', v: 0.015, a: 1 },
        { name: 'Earth', d: 190, s: 7, c: '#3b82f6', v: 0.01, a: 2 },
        { name: 'Mars', d: 250, s: 5, c: '#ef4444', v: 0.008, a: -1 },
        { name: 'Jupiter', d: 450, s: 22, c: '#fdba74', v: 0.002, a: 3 },
        { name: 'Saturn', d: 650, s: 18, c: '#fde047', v: 0.001, a: 5, hasRings: true },
        { name: 'Uranus', d: 850, s: 14, c: '#67e8f9', v: 0.0005, a: 0 },
        { name: 'Neptune', d: 1050, s: 13, c: '#3b82f6', v: 0.0004, a: Math.PI }
    ];

    // -- Render Loop --
    let time = 0;
    
    function draw() {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0,0,w,h);
        
        time += 1;
        zoom += (zoomTarget - zoom) * 0.1;

        ctx.save();
        ctx.translate(w/2, h/2);
        ctx.scale(zoom, zoom);
        ctx.translate(-cx, -cy);

        // 1. Draw Nebulae (Visible far away)
        if (zoom < 0.2) {
            ctx.globalCompositeOperation = 'screen';
            const nebg = ctx.createRadialGradient(0,0,0, 0,0, 30000);
            nebg.addColorStop(0, `rgba(60, 20, 100, ${0.4 * (0.2-zoom)/0.2})`);
            nebg.addColorStop(1, 'transparent');
            ctx.fillStyle = nebg;
            ctx.fillRect(-30000,-30000,60000,60000);
            ctx.globalCompositeOperation = 'source-over';
        }

        // 2. Draw 10,000 Background stars
        // Only draw those in camera view for performance
        const vw = w/zoom; const vh = h/zoom;
        const left = cx - vw/2, right = cx + vw/2;
        const top = cy - vh/2, bottom = cy + vh/2;
        
        ctx.beginPath();
        for(let i=0; i<backgroundStars.length; i++) {
            const s = backgroundStars[i];
            if(s.x > left-100 && s.x < right+100 && s.y > top-100 && s.y < bottom+100) {
                ctx.fillStyle = s.c;
                ctx.fillRect(s.x, s.y, s.size, s.size);
            }
        }

        // 3. Draw Constellations (Visible mid-high zoom)
        if (zoom > 0.005 && zoom < 1.0) {
            ctx.lineWidth = 2 / zoom;
            for(const c of constellations) {
                ctx.strokeStyle = c.color;
                ctx.beginPath();
                for(const line of c.lines) {
                    const p1 = c.points[line[0]];
                    const p2 = c.points[line[1]];
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                }
                ctx.stroke();

                for(const p of c.points) {
                    ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size / Math.sqrt(zoom), 0, Math.PI*2); ctx.fill();
                    ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
                    ctx.fill(); ctx.shadowBlur = 0;
                }
                
                // Name
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = `${20/zoom}px Inter`;
                ctx.fillText(c.name, c.points[0].x + 20/zoom, c.points[0].y);
            }
        }

        // 4. Draw Solar System
        // Orbital paths
        if (zoom > 0.05) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1/zoom;
            for(const p of planets) {
                ctx.beginPath(); ctx.arc(0, 0, p.d, 0, Math.PI*2); ctx.stroke();
            }

            // Sun
            const rg = ctx.createRadialGradient(0,0,sun.r*0.1, 0,0,sun.r*2);
            rg.addColorStop(0, '#fff');
            rg.addColorStop(0.5, sun.color);
            rg.addColorStop(1, 'transparent');
            ctx.fillStyle = rg;
            ctx.beginPath(); ctx.arc(0, 0, sun.r*2, 0, Math.PI*2); ctx.fill();

            // Planets
            for(let i=0; i<planets.length; i++) {
                const p = planets[i];
                p.a -= p.v; // Rotate
                const px = Math.cos(p.a) * p.d;
                const py = Math.sin(p.a) * p.d;
                
                ctx.save();
                ctx.translate(px, py);
                
                // Rings
                if (p.hasRings) {
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(200, 200, 180, 0.4)';
                    ctx.lineWidth = 3/zoom;
                    ctx.ellipse(0, 0, p.s + 15, p.s + 5, Math.PI/4, 0, Math.PI*2);
                    ctx.stroke();
                }

                ctx.fillStyle = p.c;
                ctx.beginPath(); ctx.arc(0, 0, p.s, 0, Math.PI*2); ctx.fill();
                
                // Labels (show at certain zooms)
                if (zoom > 0.5) {
                    ctx.fillStyle = '#fff';
                    ctx.font = `${14/zoom}px Inter`;
                    ctx.fillText(p.name, p.s + 10/zoom, 5/zoom);
                }
                ctx.restore();
            }
        }

        ctx.restore();

        // UI text
        ctx.fillStyle = '#fff';
        ctx.font = '14px Inter';
        ctx.fillText(`Zoom Level: ${(zoom*100).toFixed(1)}x`, w - 150, 30);
        ctx.fillText(`Camera: [${Math.round(cx)}, ${Math.round(cy)}]`, w - 150, 50);

        requestAnimationFrame(draw);
    }
    
    // Start deep zoom auto animation at start
    setTimeout(() => { zoomTarget = 1.0; }, 1000);

    requestAnimationFrame(draw);
})();
