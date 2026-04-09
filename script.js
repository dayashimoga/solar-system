'use strict';
(function(){
const $=s=>document.querySelector(s);
const canvas=$('#spaceCanvas'), ctx=canvas.getContext('2d');
let w,h;
let time=0, speed=(20/50)**3, scale=1;
let camX=0, camY=0, isDragging=false, startX, startY;
let targetObj = null;
const DIST_MULT = 60;

// Generate massive deep-space starfield
// Expanded radius for unlimited zoom out, increased count to 4000
const STARS = [];
const STAR_SPREAD = 30000;
for(let i=0;i<4000;i++) {
    STARS.push({
        x:(Math.random()-0.5)*STAR_SPREAD,
        y:(Math.random()-0.5)*STAR_SPREAD,
        r:Math.random()*1.8+0.5,
        b:Math.random()*0.6+0.4,
        tw:Math.random()*Math.PI*2,
        color: Math.random() > 0.85 ? ['#93c5fd','#fca5a5','#fde68a'][Math.floor(Math.random()*3)] : '#ffffff'
    });
}

// Deep-space objects (visible at extreme zoom-out)
const GALAXIES = [
  {name:'Andromeda Galaxy (M31)',x:5000,y:-4500,r:250,color:'rgba(180,160,255,0.15)'},
  {name:'Triangulum Galaxy',x:-5500,y:-4000,r:150,color:'rgba(160,200,255,0.08)'},
  {name:'Large Magellanic Cloud',x:4800,y:4200,r:120,color:'rgba(200,180,255,0.08)'},
  {name:'Centaurus A',x:-6000,y:3000,r:100,color:'rgba(255,180,160,0.06)'}
];

// Interactive Constellations Map
const CONSTELLATIONS = [
    { name: 'Ursa Major', points: [[-4000,-2000], [-3500,-1800], [-3200,-1400], [-3000,-1000], [-2500,-900], [-2200,-1200], [-2000,-800]], color: 'rgba(255, 255, 255, 0.4)' },
    { name: 'Orion', points: [[2000,1500], [2200,1300], [2500,1200], [2300,1800], [1800,2200], [2500,2500], [2900,2200], [2200,1300]], color: 'rgba(147, 197, 253, 0.4)' },
    { name: 'Cassiopeia', points: [[-1000,-4000], [-500,-3500], [0,-3800], [500,-3200], [1000,-3600]], color: 'rgba(253, 164, 175, 0.4)' },
    { name: 'Cygnus', points: [[1000,-2000], [1200,-1500], [1400,-1000], [600,-1200], [1800,-800]], color: 'rgba(216, 180, 254, 0.4)' },
    { name: 'Scorpius', points: [[-2000,4000], [-1500,4200], [-1000,4600], [-800,5000], [-1200,5300], [-1600,5500]], color: 'rgba(110, 231, 183, 0.4)' }
];

const DATA = {
    name: 'Sun', color: '#fbbf24', radius: 35, type: 'Star',
    desc: 'The star at the center of the Solar System.',
    stats: { Type: 'G-Type Main Sequence', Mass: '1.989 × 10^30 kg', Radius: '696,340 km', Temp: '5,500 °C' },
    children: [
        { name: 'Mercury', color: '#9ca3af', radius: 4, dist: 1, period: 0.24, type: 'Planet', desc: 'The smallest and innermost planet.', stats: { Moons:'0','Day':'58d 15h','Year':'88 Days',Temp:'430°C to -180°C' } },
        { name: 'Venus', color: '#fcd34d', radius: 7, dist: 1.5, period: 0.615, type: 'Planet', desc: 'Second planet, named after the goddess of love.', stats: { Moons:'0','Day':'243d','Year':'225 Days',Temp:'471°C' }, atmosphere:'rgba(252,211,77,0.15)' },
        { name: 'Earth', color: '#3b82f6', radius: 8, dist: 2.2, period: 1, type: 'Planet', desc: 'Our home planet, the only known place with life.', stats: { Moons:'1','Day':'24h','Year':'365 Days',Temp:'15°C' }, atmosphere:'rgba(59,130,246,0.12)',
            children: [ { name: 'Moon', color: '#d1d5db', radius: 2, dist: 0.25, period: 0.074, type: 'Moon' } ]
        },
        { name: 'Mars', color: '#ef4444', radius: 5, dist: 3.0, period: 1.88, type: 'Planet', desc: 'The Red Planet with Olympus Mons.', stats: { Moons:'2','Day':'24h 37m','Year':'687 Days',Temp:'-60°C' }, atmosphere:'rgba(239,68,68,0.08)',
            children: [ { name: 'Phobos', color: '#9ca3af', radius: 1.5, dist: 0.15, period: 0.02, type: 'Moon' }, { name: 'Deimos', color: '#9ca3af', radius: 1, dist: 0.25, period: 0.04, type: 'Moon' } ]
        },
        { name: 'Ceres', color: '#d1d5db', radius: 2, dist: 3.8, period: 4.6, type: 'Dwarf Planet', desc: 'Largest object in the asteroid belt.', stats: { Moons:'0','Day':'9h','Year':'4.6 Years',Temp:'-105°C' } },
        { name: 'Jupiter', color: '#f59e0b', radius: 20, dist: 5.5, period: 11.86, type: 'Planet', desc: 'Largest planet with the Great Red Spot.', stats: { Moons:'95','Day':'9h 56m','Year':'11.86 Years',Temp:'-110°C' }, atmosphere:'rgba(245,158,11,0.1)',
            children: [
                { name: 'Io', color: '#fcd34d', radius: 3, dist: 0.4, period: 0.05, type: 'Moon' },
                { name: 'Europa', color: '#e5e7eb', radius: 2.5, dist: 0.7, period: 0.1, type: 'Moon' },
                { name: 'Ganymede', color: '#9ca3af', radius: 4, dist: 1.0, period: 0.2, type: 'Moon' },
                { name: 'Callisto', color: '#6b7280', radius: 3.5, dist: 1.4, period: 0.4, type: 'Moon' }
            ]
        },
        { name: 'Saturn', color: '#fde68a', radius: 17, dist: 8.5, period: 29.46, type: 'Planet', desc: 'The ringed planet.', stats: { Moons:'146','Day':'10h 34m','Year':'29.4 Years',Temp:'-140°C' }, hasRings: true, atmosphere:'rgba(253,230,138,0.08)',
            children: [
                { name: 'Titan', color: '#f59e0b', radius: 4, dist: 0.6, period: 0.1, type: 'Moon' },
                { name: 'Enceladus', color: '#e5e7eb', radius: 2, dist: 0.9, period: 0.15, type: 'Moon' }
            ]
        },
        { name: 'Uranus', color: '#6ee7b7', radius: 12, dist: 12, period: 84, type: 'Planet', desc: 'An ice giant rotating on its side.', stats: { Moons:'28','Day':'17h 14m','Year':'84 Years',Temp:'-195°C' }, hasRings: true, atmosphere:'rgba(110,231,183,0.06)',
            children: [{name:'Titania',color:'#d1d5db',radius:2,dist:0.5,period:0.2,type:'Moon'},{name:'Oberon',color:'#9ca3af',radius:2,dist:0.7,period:0.3,type:'Moon'}]
        },
        { name: 'Neptune', color: '#3b82f6', radius: 11, dist: 15.5, period: 164.8, type: 'Planet', desc: 'Furthest known planet, an ice giant.', stats: { Moons:'16','Day':'16h 6m','Year':'165 Years',Temp:'-200°C' }, atmosphere:'rgba(59,130,246,0.08)',
            children: [{name:'Triton',color:'#e5e7eb',radius:3,dist:0.5,period:0.1,type:'Moon'}]
        },
        { name: 'Pluto', color: '#f3f4f6', radius: 3, dist: 18.5, period: 248, type: 'Dwarf Planet', desc: 'A dwarf planet in the Kuiper belt.', stats: { Moons:'5','Day':'153h','Year':'248 Years',Temp:'-225°C' },
            children: [{name:'Charon',color:'#d1d5db',radius:1.5,dist:0.15,period:0.05,type:'Moon'}]
        },
        { name: 'Haumea', color: '#d1d5db', radius: 2.5, dist: 21, period: 284, type: 'Dwarf Planet', desc: 'An elongated dwarf planet.', stats: { Moons:'2','Day':'4h','Year':'284 Years',Temp:'-241°C' } },
        { name: 'Makemake', color: '#fca5a5', radius: 2.5, dist: 23, period: 306, type: 'Dwarf Planet', desc: 'A dwarf planet in the Kuiper belt.', stats: { Moons:'1','Day':'22.5h','Year':'306 Years',Temp:'-239°C' } },
        { name: 'Eris', color: '#e5e7eb', radius: 3, dist: 26, period: 558, type: 'Dwarf Planet', desc: 'Most massive known dwarf planet.', stats: { Moons:'1','Day':'25.9h','Year':'558 Years',Temp:'-231°C' },
            children: [{name:'Dysnomia',color:'#9ca3af',radius:1,dist:0.2,period:0.05,type:'Moon'}]
        }
    ]
};

function resize(){
    const rect = canvas.parentElement.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    if(camX===0 && camY===0){ camX = w/2; camY = h/2; }
}
window.addEventListener('resize', resize);
resize();

$('#speedSlider').addEventListener('input', e=>speed=(e.target.value/50)**3);

canvas.addEventListener('mousedown', e=>{isDragging=true;startX=e.clientX-camX;startY=e.clientY-camY;canvas.style.cursor='grabbing';});
window.addEventListener('mouseup', ()=>{isDragging=false;canvas.style.cursor='grab';});
window.addEventListener('mousemove', e=>{if(!isDragging)return;camX=e.clientX-startX;camY=e.clientY-startY;targetObj=null;});

// Extended zoom range for galaxy view
canvas.addEventListener('wheel', e=>{
    e.preventDefault();
    const zX=(e.clientX-camX)/scale, zY=(e.clientY-camY)/scale;
    const amt=e.deltaY>0?0.9:1.1;
    scale=Math.max(0.005, Math.min(15, scale*amt));
    camX=e.clientX-zX*scale; camY=e.clientY-zY*scale;
});

// Touch support
let lastTouchDist=0;
canvas.addEventListener('touchstart',e=>{
    if(e.touches.length===1){isDragging=true;startX=e.touches[0].clientX-camX;startY=e.touches[0].clientY-camY;}
    if(e.touches.length===2){lastTouchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);}
},{passive:true});
canvas.addEventListener('touchmove',e=>{
    e.preventDefault();
    if(e.touches.length===1&&isDragging){camX=e.touches[0].clientX-startX;camY=e.touches[0].clientY-startY;targetObj=null;}
    if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);scale=Math.max(0.005,Math.min(15,scale*(d/lastTouchDist)));lastTouchDist=d;}
},{passive:false});
canvas.addEventListener('touchend',()=>{isDragging=false;});

function updatePositions(obj, dt) {
    if(obj.dist!==undefined && obj.period!==undefined) {
        if(!obj.angle) obj.angle = Math.random()*Math.PI*2;
        obj.angle += (dt/obj.period)*0.01*speed;
        const d = obj.type==='Moon' ? obj.dist*DIST_MULT*0.5 : obj.dist*DIST_MULT;
        obj.x = Math.cos(obj.angle)*d;
        obj.y = Math.sin(obj.angle)*d;
    } else { obj.x=0; obj.y=0; }
    obj.absX = obj.x + (obj.parent ? obj.parent.absX : 0);
    obj.absY = obj.y + (obj.parent ? obj.parent.absY : 0);
    if(obj.children) obj.children.forEach(c=>{ c.parent=obj; updatePositions(c,dt); });
}

function processClick(e) {
    const rect=canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left-camX)/scale, my=(e.clientY-rect.top-camY)/scale;
    let clicked=null;
    function check(obj){const dx=mx-obj.absX,dy=my-obj.absY;if(Math.sqrt(dx*dx+dy*dy)<=obj.radius*2)clicked=obj;if(obj.children)obj.children.forEach(check);}
    check(DATA);
    if(clicked){targetObj=clicked;showInfo(clicked);$('#uiOverlay').classList.remove('pointer-none');}
}
canvas.addEventListener('click', processClick);
$('#closeInfo').addEventListener('click', ()=>{$('#infoPanel').style.display='none';$('#uiOverlay').classList.add('pointer-none');targetObj=null;});
$('#resetViewBtn').addEventListener('click', ()=>{targetObj=null;camX=w/2;camY=h/2;scale=1;$('#infoPanel').style.display='none';$('#uiOverlay').classList.add('pointer-none');});
$('#zoomInBtn').addEventListener('click', ()=>{if(targetObj)scale=targetObj.type==='Planet'?5:2;});

function showInfo(obj) {
    $('#infoPanel').style.display='block';
    $('#sysTitle').innerHTML = `<span style="color:${obj.color}">●</span> ${obj.name} <span style="font-size:0.8rem;color:#a1a1aa;font-weight:normal">${obj.type}</span>`;
    $('#sysDesc').textContent = obj.desc || '';
    const s=$('#sysStats'); s.innerHTML='';
    if(obj.stats) Object.entries(obj.stats).forEach(([k,v])=>s.innerHTML+=`<div class="stat-item"><span class="stat-label">${k}</span><span class="stat-value">${v}</span></div>`);
    $('#zoomInBtn').style.display = obj.children ? 'block' : 'none';
}

function drawStars(t){
    const isLight=document.documentElement.getAttribute('data-theme')==='light';
    if(isLight) return;
    for(const s of STARS){
        const sx=s.x*scale+camX, sy=s.y*scale+camY;
        if(sx<-5||sx>w+5||sy<-5||sy>h+5) continue;
        const twinkle=0.6+0.4*Math.sin(t*0.001+s.tw);
        ctx.globalAlpha=s.b*twinkle;
        ctx.fillStyle=s.color || '#fff';
        ctx.beginPath();ctx.arc(sx,sy,s.r*Math.min(1,scale*0.1+0.9),0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
}

function drawMilkyWay(){
    if(scale>0.15) return;
    const isLight=document.documentElement.getAttribute('data-theme')==='light';
    if(isLight) return;
    ctx.save();ctx.translate(camX,camY);ctx.scale(scale,scale);
    const grd=ctx.createLinearGradient(-4000,-800,4000,800);
    grd.addColorStop(0,'rgba(100,80,160,0)');
    grd.addColorStop(0.3,'rgba(120,100,180,0.04)');
    grd.addColorStop(0.5,'rgba(140,120,200,0.08)');
    grd.addColorStop(0.7,'rgba(120,100,180,0.04)');
    grd.addColorStop(1,'rgba(100,80,160,0)');
    ctx.fillStyle=grd;
    ctx.beginPath();ctx.ellipse(0,0,4000,600,0.3,0,Math.PI*2);ctx.fill();
    ctx.restore();
}

function drawGalaxies(t){
    if(scale>0.05) return;
    const isLight=document.documentElement.getAttribute('data-theme')==='light';
    if(isLight) return;
    ctx.save();ctx.translate(camX,camY);ctx.scale(scale,scale);
    for(const g of GALAXIES){
        const grd=ctx.createRadialGradient(g.x,g.y,0,g.x,g.y,g.r);
        grd.addColorStop(0,g.color.replace(/[\d.]+\)$/,'0.15)'));
        grd.addColorStop(0.5,g.color);
        grd.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=grd;
        ctx.beginPath();ctx.ellipse(g.x,g.y,g.r,g.r*0.6,0.5,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.4)';
        ctx.font='14px var(--font-sans)';ctx.textAlign='center';
        ctx.fillText(g.name,g.x,g.y+g.r+20);
    }
    
    // Draw Constellations
    if(scale > 0.005 && scale < 0.1) {
        for(const c of CONSTELLATIONS) {
            ctx.beginPath();
            for(let i=0; i<c.points.length; i++) {
                const pt = c.points[i];
                if(i===0) ctx.moveTo(pt[0], pt[1]);
                else ctx.lineTo(pt[0], pt[1]);
            }
            ctx.strokeStyle = c.color;
            ctx.lineWidth = 1/scale;
            ctx.stroke();
            
            // Constellation Label
            const mid = c.points[Math.floor(c.points.length/2)];
            ctx.fillStyle = c.color.replace('0.4', '0.8');
            ctx.font = `${Math.max(12/scale, 4)}px var(--font-sans)`;
            ctx.fillText(c.name, mid[0], mid[1] - 30/scale);
            
            // Draw major stars inside constellation 
            ctx.fillStyle = '#fff';
            for(const pt of c.points) {
                ctx.beginPath();ctx.arc(pt[0], pt[1], 3/scale, 0, Math.PI*2);ctx.fill();
            }
        }
    }
    ctx.restore();
}

function drawOrbit(obj) {
    if(obj.dist!==undefined) {
        ctx.beginPath();
        const pd = obj.type==='Moon' ? obj.dist*DIST_MULT*0.5 : obj.dist*DIST_MULT;
        ctx.arc(obj.parent.absX, obj.parent.absY, pd, 0, Math.PI*2);
        const isLight=document.documentElement.getAttribute('data-theme')==='light';
        ctx.strokeStyle = obj.type==='Moon'?(isLight?'rgba(0,0,0,0.05)':'rgba(255,255,255,0.05)'):(isLight?'rgba(0,0,0,0.15)':'rgba(255,255,255,0.12)');
        ctx.lineWidth = 1/scale;
        ctx.setLineDash([4/scale, 4/scale]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    if(obj.children) obj.children.forEach(drawOrbit);
}

function drawBody(obj, t) {
    // Atmosphere glow
    if(obj.atmosphere && scale > 0.3) {
        const grd=ctx.createRadialGradient(obj.absX,obj.absY,obj.radius,obj.absX,obj.absY,obj.radius*2.5);
        grd.addColorStop(0,obj.atmosphere);grd.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=grd;ctx.beginPath();ctx.arc(obj.absX,obj.absY,obj.radius*2.5,0,Math.PI*2);ctx.fill();
    }
    // Gradient body
    const grd=ctx.createRadialGradient(obj.absX-obj.radius*0.3,obj.absY-obj.radius*0.3,obj.radius*0.1,obj.absX,obj.absY,obj.radius);
    grd.addColorStop(0,'rgba(255,255,255,0.3)');grd.addColorStop(0.5,obj.color);grd.addColorStop(1,obj.color);
    ctx.beginPath();ctx.arc(obj.absX,obj.absY,obj.radius,0,Math.PI*2);ctx.fillStyle=grd;ctx.fill();

    if(obj.hasRings) {
        ctx.beginPath();ctx.ellipse(obj.absX,obj.absY,obj.radius*2.2,obj.radius*0.6,0.3,0,Math.PI*2);
        ctx.strokeStyle='rgba(253,230,138,0.35)';ctx.lineWidth=obj.radius*0.25;ctx.stroke();
        ctx.beginPath();ctx.ellipse(obj.absX,obj.absY,obj.radius*1.8,obj.radius*0.45,0.3,0,Math.PI*2);
        ctx.strokeStyle='rgba(253,230,138,0.2)';ctx.lineWidth=obj.radius*0.15;ctx.stroke();
    }
    if(obj.name==='Sun') {
        const pulse=1+0.05*Math.sin(t*0.003);
        const sg=ctx.createRadialGradient(obj.absX,obj.absY,obj.radius,obj.absX,obj.absY,obj.radius*4*pulse);
        sg.addColorStop(0,'rgba(251,191,36,0.5)');sg.addColorStop(0.4,'rgba(251,191,36,0.15)');sg.addColorStop(1,'rgba(251,191,36,0)');
        ctx.fillStyle=sg;ctx.beginPath();ctx.arc(obj.absX,obj.absY,obj.radius*4*pulse,0,Math.PI*2);ctx.fill();
    }
    // Labels
    if((scale>0.3||obj.type==='Planet'||obj.type==='Star'||obj.type==='Dwarf Planet')&&(obj.type!=='Moon'||scale>2)) {
        const isLight=document.documentElement.getAttribute('data-theme')==='light';
        ctx.fillStyle=obj===targetObj?(isLight?'#000':'#fff'):(isLight?'rgba(0,0,0,0.7)':'rgba(255,255,255,0.7)');
        ctx.font=`${Math.max(10/scale,3)}px var(--font-sans)`;ctx.textAlign='center';
        ctx.fillText(obj.name,obj.absX,obj.absY-obj.radius-(4/scale));
    }
    if(obj.children) obj.children.forEach(c=>drawBody(c,t));
}

let lastTime=0;
function animate(t) {
    requestAnimationFrame(animate);
    updatePositions(DATA, 16);
    if(targetObj && !isDragging){ const tx=-targetObj.absX*scale+w/2,ty=-targetObj.absY*scale+h/2;camX+=(tx-camX)*0.1;camY+=(ty-camY)*0.1; }

    const isLight=document.documentElement.getAttribute('data-theme')==='light';
    ctx.fillStyle=isLight?'#f8fafc':'#030308';
    ctx.fillRect(0,0,w,h);

    drawStars(t);
    drawMilkyWay();
    drawGalaxies(t);

    ctx.save();ctx.translate(camX,camY);ctx.scale(scale,scale);
    drawOrbit(DATA);
    drawBody(DATA, t);
    ctx.restore();

    // Zoom indicator
    ctx.fillStyle='rgba(255,255,255,0.25)';ctx.font='11px var(--font-sans)';ctx.textAlign='left';
    const zoomLabel=scale<0.01?'Galaxy View':scale<0.1?'Deep Space':scale<0.5?'Outer System':'Solar System';
    ctx.fillText(`${zoomLabel} (${(scale*100).toFixed(0)}%)`,10,h-10);

    lastTime=t;
}
requestAnimationFrame(animate);
if(typeof QU!=='undefined')QU.init({kofi:true,discover:true});
})();
