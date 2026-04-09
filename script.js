'use strict';
(function(){
const $=s=>document.querySelector(s);
const canvas=$('#spaceCanvas'), ctx=canvas.getContext('2d');
let w,h, centerX, centerY;
let time=0, speed=(20/50)**3, scale=1;
let camX=0, camY=0, isDragging=false, startX, startY;
let targetObj = null;

// Scale factors for visual representation (not physically accurate)
const DIST_MULT = 60;

const DATA = {
    name: 'Sun', color: '#fbbf24', radius: 35, type: 'Star',
    desc: 'The star at the center of the Solar System.',
    stats: { Type: 'G-Type Main Sequence', Mass: '1.989 × 10^30 kg', Radius: '696,340 km', Temp: '5,500 °C' },
    children: [
        { name: 'Mercury', color: '#9ca3af', radius: 4, dist: 1, period: 0.24, type: 'Planet', desc: 'The smallest and innermost planet in the Solar System.', stats: { Moons: '0', 'Day Length': '58d 15h', 'Year Length': '88 Earth Days', Temp: '430°C to -180°C' } },
        { name: 'Venus', color: '#fcd34d', radius: 7, dist: 1.5, period: 0.615, type: 'Planet', desc: 'Second planet from the Sun, named after the Roman goddess of love and beauty.', stats: { Moons: '0', 'Day Length': '243d', 'Year Length': '225 Earth Days', Temp: '471 °C' } },
        { name: 'Earth', color: '#3b82f6', radius: 8, dist: 2.2, period: 1, type: 'Planet', desc: 'Our home planet, the only known place in the universe with life.', stats: { Moons: '1', 'Day Length': '24h', 'Year Length': '365.25 Days', Temp: '15 °C' }, 
            children: [ { name: 'Moon', color: '#d1d5db', radius: 2, dist: 0.25, period: 0.074, type: 'Moon' } ]
        },
        { name: 'Mars', color: '#ef4444', radius: 5, dist: 3.0, period: 1.88, type: 'Planet', desc: 'The Red Planet, home to the largest volcano in the solar system, Olympus Mons.', stats: { Moons: '2', 'Day Length': '24h 37m', 'Year Length': '687 Earth Days', Temp: '-60 °C' },
            children: [ { name: 'Phobos', color: '#9ca3af', radius: 1.5, dist: 0.15, period: 0.02, type: 'Moon' }, { name: 'Deimos', color: '#9ca3af', radius: 1, dist: 0.25, period: 0.04, type: 'Moon' } ]
        },
        { name: 'Ceres', color: '#d1d5db', radius: 2, dist: 3.8, period: 4.6, type: 'Dwarf Planet', desc: 'The largest object in the asteroid belt between Mars and Jupiter.', stats: { Moons: '0', 'Day Length': '9h', 'Year Length': '4.6 Earth Years', Temp: '-105 °C' } },
        { name: 'Jupiter', color: '#f59e0b', radius: 20, dist: 5.5, period: 11.86, type: 'Planet', desc: 'The largest planet in the solar system, a gas giant with a Great Red Spot.', stats: { Moons: '95', 'Day Length': '9h 56m', 'Year Length': '11.86 Earth Years', Temp: '-110 °C' },
            children: [
                { name: 'Io', color: '#fcd34d', radius: 3, dist: 0.4, period: 0.05, type: 'Moon' },
                { name: 'Europa', color: '#e5e7eb', radius: 2.5, dist: 0.7, period: 0.1, type: 'Moon' },
                { name: 'Ganymede', color: '#9ca3af', radius: 4, dist: 1.0, period: 0.2, type: 'Moon' },
                { name: 'Callisto', color: '#6b7280', radius: 3.5, dist: 1.4, period: 0.4, type: 'Moon' }
            ]
        },
        { name: 'Saturn', color: '#fde68a', radius: 17, dist: 8.5, period: 29.46, type: 'Planet', desc: 'The ringed planet, the second-largest in the solar system.', stats: { Moons: '146', 'Day Length': '10h 34m', 'Year Length': '29.4 Earth Years', Temp: '-140 °C' }, hasRings: true,
            children: [
                { name: 'Titan', color: '#f59e0b', radius: 4, dist: 0.6, period: 0.1, type: 'Moon' },
                { name: 'Enceladus', color: '#e5e7eb', radius: 2, dist: 0.9, period: 0.15, type: 'Moon' }
            ]
        },
        { name: 'Uranus', color: '#6ee7b7', radius: 12, dist: 12, period: 84, type: 'Planet', desc: 'An ice giant that rotates on its side.', stats: { Moons: '28', 'Day Length': '17h 14m', 'Year Length': '84 Earth Years', Temp: '-195 °C' }, hasRings: true,
            children: [{ name: 'Titania', color: '#d1d5db', radius: 2, dist: 0.5, period: 0.2, type: 'Moon'}, { name: 'Oberon', color: '#9ca3af', radius: 2, dist: 0.7, period: 0.3, type: 'Moon'}]
        },
        { name: 'Neptune', color: '#3b82f6', radius: 11, dist: 15.5, period: 164.8, type: 'Planet', desc: 'The furthest known planet from the Sun, an ice giant with dark storms.', stats: { Moons: '16', 'Day Length': '16h 6m', 'Year Length': '165 Earth Years', Temp: '-200 °C' },
            children: [{ name: 'Triton', color: '#e5e7eb', radius: 3, dist: 0.5, period: 0.1, type: 'Moon'}]
        },
        { name: 'Pluto', color: '#f3f4f6', radius: 3, dist: 18.5, period: 248, type: 'Dwarf Planet', desc: 'A dwarf planet in the Kuiper belt, famously demoted from planet status.', stats: { Moons: '5', 'Day Length': '153h 17m', 'Year Length': '248 Earth Years', Temp: '-225 °C' },
            children: [{ name: 'Charon', color: '#d1d5db', radius: 1.5, dist: 0.15, period: 0.05, type: 'Moon'}]
        },
        { name: 'Haumea', color: '#d1d5db', radius: 2.5, dist: 21, period: 284, type: 'Dwarf Planet', desc: 'An elongated dwarf planet in the Kuiper belt with two moons.', stats: { Moons: '2', 'Day Length': '4h', 'Year Length': '284 Earth Years', Temp: '-241 °C' } },
        { name: 'Makemake', color: '#fca5a5', radius: 2.5, dist: 23, period: 306, type: 'Dwarf Planet', desc: 'A dwarf planet in the Kuiper belt, responsible for the creation of the dwarf planet category.', stats: { Moons: '1', 'Day Length': '22.5h', 'Year Length': '306 Earth Years', Temp: '-239 °C' } },
        { name: 'Eris', color: '#e5e7eb', radius: 3, dist: 26, period: 558, type: 'Dwarf Planet', desc: 'The most massive and second-largest known dwarf planet in the Solar System.', stats: { Moons: '1', 'Day Length': '25.9h', 'Year Length': '558 Earth Years', Temp: '-231 °C' },
            children: [{ name: 'Dysnomia', color: '#9ca3af', radius: 1, dist: 0.2, period: 0.05, type: 'Moon'}]
        }
    ]
};

function resize(){
    const rect = canvas.parentElement.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    if(camX===0 && camY===0){
        camX = w/2; camY = h/2;
    }
}
window.addEventListener('resize', resize);
resize();

// Interaction
$('#speedSlider').addEventListener('input', e=>speed=(e.target.value/50)**3);

canvas.addEventListener('mousedown', e=>{
    isDragging=true; startX=e.clientX-camX; startY=e.clientY-camY;
    canvas.style.cursor='grabbing';
});
window.addEventListener('mouseup', ()=>{isDragging=false;canvas.style.cursor='grab';});
window.addEventListener('mousemove', e=>{
    if(!isDragging)return;
    camX = e.clientX-startX; camY = e.clientY-startY;
    targetObj = null; // Break track
});

canvas.addEventListener('wheel', e=>{
    e.preventDefault();
    const zoomPointX = (e.clientX - camX) / scale;
    const zoomPointY = (e.clientY - camY) / scale;
    const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1;
    scale = Math.max(0.1, Math.min(10, scale * zoomAmount));
    camX = e.clientX - zoomPointX * scale;
    camY = e.clientY - zoomPointY * scale;
});

// Calculate positions recursive
function updatePositions(obj, dt) {
    if(obj.dist !== undefined && obj.period !== undefined) {
        if(!obj.angle) obj.angle = Math.random() * Math.PI * 2;
        obj.angle += (dt / obj.period) * 0.01 * speed;
        const d = obj.type === 'Moon' ? obj.dist * DIST_MULT * 0.5 : obj.dist * DIST_MULT;
        obj.x = Math.cos(obj.angle) * d;
        obj.y = Math.sin(obj.angle) * d;
    } else {
        obj.x = 0; obj.y = 0;
    }
    obj.absX = obj.x + (obj.parent ? obj.parent.absX : 0);
    obj.absY = obj.y + (obj.parent ? obj.parent.absY : 0);

    if(obj.children) {
        obj.children.forEach(c => {
            c.parent = obj;
            updatePositions(c, dt);
        });
    }
}

function processClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - camX)/scale;
    const my = (e.clientY - rect.top - camY)/scale;

    let clicked = null;
    function check(obj) {
        const dx = mx - obj.absX, dy = my - obj.absY;
        if(Math.sqrt(dx*dx + dy*dy) <= obj.radius * 2) {
            clicked = obj;
        }
        if(obj.children) obj.children.forEach(check);
    }
    check(DATA);

    if(clicked) {
        targetObj = clicked;
        showInfo(clicked);
        $('#uiOverlay').classList.remove('pointer-none');
    }
}
canvas.addEventListener('click', processClick);

$('#closeInfo').addEventListener('click', ()=>{
    $('#infoPanel').style.display='none';
    $('#uiOverlay').classList.add('pointer-none');
    targetObj = null;
});

$('#resetViewBtn').addEventListener('click', ()=>{
    targetObj = null;
    camX = w/2; camY = h/2;
    scale = 1;
    $('#infoPanel').style.display='none';
    $('#uiOverlay').classList.add('pointer-none');
});

$('#zoomInBtn').addEventListener('click', ()=>{
    if(targetObj) scale = targetObj.type==='Planet'? 5 : 2;
});

function showInfo(obj) {
    $('#infoPanel').style.display='block';
    $('#sysTitle').innerHTML = `${obj.color?'<span style="color:'+obj.color+'">●</span>':''} ${obj.name} <span style="font-size:0.8rem;color:#a1a1aa;font-weight:normal ml-2">${obj.type}</span>`;
    $('#sysDesc').textContent = obj.desc || '';
    const statsDOM = $('#sysStats');
    statsDOM.innerHTML = '';
    if(obj.stats) {
        Object.entries(obj.stats).forEach(([k,v])=>{
            statsDOM.innerHTML += `<div class="stat-item"><span class="stat-label">${k}</span><span class="stat-value">${v}</span></div>`;
        });
    }
    $('#zoomInBtn').style.display = obj.children ? 'block' : 'none';
}

function drawGrid(){
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1/scale;
    const step = 50;
    const startX = -camX/scale;
    const startY = -camY/scale;
    const endX = startX + w/scale;
    const endY = startY + h/scale;
    ctx.beginPath();
    for(let x = Math.floor(startX/step)*step; x < endX; x+=step) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
    for(let y = Math.floor(startY/step)*step; y < endY; y+=step) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
    ctx.stroke();
}

function drawOrbit(obj) {
    if(obj.dist !== undefined) {
        ctx.beginPath();
        const pd = obj.type === 'Moon' ? obj.dist * DIST_MULT * 0.5 : obj.dist * DIST_MULT;
        ctx.arc(obj.parent.absX, obj.parent.absY, pd, 0, Math.PI*2);
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        ctx.strokeStyle = obj.type === 'Moon' ? (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)') : (isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)');
        ctx.lineWidth = 1/scale;
        ctx.stroke();
    }
    if(obj.children) obj.children.forEach(drawOrbit);
}

function drawBody(obj) {
    ctx.beginPath();
    ctx.arc(obj.absX, obj.absY, obj.radius, 0, Math.PI*2);
    ctx.fillStyle = obj.color;
    ctx.fill();
    
    // Draw rings (Saturn/Uranus)
    if(obj.hasRings) {
        ctx.beginPath();
        ctx.ellipse(obj.absX, obj.absY, obj.radius*2.2, obj.radius*0.8, obj.angle || 0.5, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(253, 230, 138, 0.4)';
        ctx.lineWidth = obj.radius*0.3;
        ctx.stroke();
    }

    // Glow effect for Sun
    if(obj.name === 'Sun') {
        const grd = ctx.createRadialGradient(obj.absX, obj.absY, obj.radius, obj.absX, obj.absY, obj.radius*3);
        grd.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
        grd.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(obj.absX, obj.absY, obj.radius*3, 0, Math.PI*2); ctx.fill();
    }

    // Draw label
    if((scale > 0.4 || obj.type === 'Planet' || obj.type === 'Star' || obj.type === 'Dwarf Planet') && (obj.type!=='Moon' || scale > 2.5)) {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        ctx.fillStyle = obj === targetObj ? (isLight ? '#000' : '#fff') : (isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)');
        ctx.font = `${Math.max(10/scale, 3)}px var(--font-sans)`;
        ctx.textAlign = 'center';
        ctx.fillText(obj.name, obj.absX, obj.absY - obj.radius - (4/scale));
    }

    if(obj.children) obj.children.forEach(drawBody);
}

let lastTime=0;
function animate(t) {
    requestAnimationFrame(animate);
    const dt = t - lastTime;
    lastTime = t;
    
    updatePositions(DATA, 16);

    if(targetObj && !isDragging) {
        const tx = -targetObj.absX * scale + w/2;
        const ty = -targetObj.absY * scale + h/2;
        camX += (tx - camX) * 0.1;
        camY += (ty - camY) * 0.1;
    }

    
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.fillStyle = isLight ? '#f8fafc' : '#050510';
    ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(camX, camY);
    ctx.scale(scale, scale);
    
    drawGrid();
    drawOrbit(DATA);
    drawBody(DATA);
    
    ctx.restore();
}
requestAnimationFrame(animate);

if(typeof QU!=='undefined')QU.init({kofi:true,discover:true});
})();
