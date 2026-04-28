/* Solar System Explorer Utilities — Pure Functions Module */

export function getZoomDepthLabel(z) {
    if (z < 0.000005) return 'Supercluster Scale';
    if (z < 0.00005) return 'Galaxy Cluster';
    if (z < 0.0005) return 'Local Group';
    if (z < 0.003) return 'Galactic View';
    if (z < 0.01) return 'Constellation Field';
    if (z < 0.1) return 'Star Field';
    if (z < 2) return 'Solar System';
    if (z < 50) return 'Planet View';
    return 'Moon Detail';
}

export function getStarTile(tx, ty) {
    let seed = Math.abs(tx * 73856093 ^ ty * 19349663) % 2147483647;
    const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const stars = [], TILE_SIZE = 4000;
    for (let i = 0; i < 150; i++) {
        stars.push({ x:tx*TILE_SIZE+rng()*TILE_SIZE, y:ty*TILE_SIZE+rng()*TILE_SIZE,
            s:rng()*2+0.3, b:rng()*0.6+0.4, h:rng()*60+200 });
    }
    return stars;
}

export const PLANETS = [
    { name:'Mercury', d:80, s:3, v:0.04, color:'#a0a0a0', moons:0, mass:'3.30×10²³ kg', diameter:'4,879 km', temp:'167°C (avg)', atmosphere:'Minimal' },
    { name:'Venus', d:130, s:6, v:0.015, color:'#e8cda0', moons:0, mass:'4.87×10²⁴ kg', diameter:'12,104 km', temp:'464°C', atmosphere:'CO₂, N₂' },
    { name:'Earth', d:190, s:7, v:0.01, color:'#4a90d9', moons:1, mass:'5.97×10²⁴ kg', diameter:'12,742 km', temp:'15°C (avg)', atmosphere:'N₂, O₂' },
    { name:'Mars', d:250, s:5, v:0.008, color:'#c1440e', moons:2, mass:'6.42×10²³ kg', diameter:'6,779 km', temp:'-65°C (avg)', atmosphere:'CO₂' },
    { name:'Jupiter', d:450, s:22, v:0.002, color:'#c88b3a', moons:95, mass:'1.90×10²⁷ kg', diameter:'139,820 km', temp:'-110°C', atmosphere:'H₂, He' },
    { name:'Saturn', d:650, s:18, v:0.001, color:'#ead6a6', moons:146, mass:'5.68×10²⁶ kg', diameter:'116,460 km', temp:'-140°C', atmosphere:'H₂, He', hasRings:true },
    { name:'Uranus', d:850, s:14, v:0.0005, color:'#72b5c4', moons:28, mass:'8.68×10²⁵ kg', diameter:'50,724 km', temp:'-195°C', atmosphere:'H₂, He, CH₄' },
    { name:'Neptune', d:1050, s:13, v:0.0004, color:'#3b5dc9', moons:16, mass:'1.02×10²⁶ kg', diameter:'49,244 km', temp:'-200°C', atmosphere:'H₂, He, CH₄' },
    { name:'Pluto', d:1250, s:2.5, v:0.0002, color:'#c9b69c', moons:5, mass:'1.31×10²² kg', diameter:'2,376 km', temp:'-230°C', atmosphere:'N₂, CH₄' },
];

export const GALAXIES = [
    { name:'Milky Way', x:-100000, y:50000, r:8000, type:'Barred Spiral Galaxy' },
    { name:'Andromeda (M31)', x:800000, y:-500000, r:10000, type:'Spiral Galaxy' },
    { name:'Triangulum (M33)', x:600000, y:-400000, r:4000, type:'Spiral Galaxy' },
    { name:'Large Magellanic Cloud', x:-200000, y:150000, r:2000, type:'Irregular Galaxy' },
    { name:'Small Magellanic Cloud', x:-250000, y:200000, r:1000, type:'Dwarf Galaxy' },
    { name:'Centaurus A', x:1200000, y:-800000, r:7000, type:'Elliptical Galaxy' },
];

export const CONSTELLATIONS = [
    'Orion','Ursa Major','Cassiopeia','Scorpius','Leo','Lyra','Cygnus','Draco',
    'Pegasus','Centaurus','Crux','Gemini','Taurus','Canis Major','Aquila',
    'Virgo','Sagittarius','Aquarius','Pisces',
];

export function orbitalPeriod(distance) { return Math.sqrt(Math.pow(distance, 3)); }

export function orbitalPosition(distance, velocity, time) {
    const angle = velocity * time;
    return { x: distance * Math.cos(angle), y: distance * Math.sin(angle) };
}

export function distanceBetween(obj1, obj2) {
    const dx = obj1.x - obj2.x, dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function genExoSystem(seed) {
    let s = Math.abs(seed) % 2147483647;
    const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const count = Math.floor(rng() * 5) + 2;
    const planets = [];
    for (let i = 0; i < count; i++) {
        planets.push({ name:`Exo-${seed}-${i+1}`, d:40+rng()*200, s:rng()*15+2, v:rng()*0.03+0.001,
            color:`hsl(${Math.floor(rng()*360)},${40+Math.floor(rng()*30)}%,${40+Math.floor(rng()*30)}%)` });
    }
    return planets;
}

export function searchCatalog(query) {
    if (!query || typeof query !== 'string') return [];
    const q = query.toLowerCase().trim();
    const results = [];
    PLANETS.forEach(p => { if (p.name.toLowerCase().includes(q)) results.push({ type:'planet', ...p }); });
    GALAXIES.forEach(g => { if (g.name.toLowerCase().includes(q)) results.push({ type:'galaxy', ...g }); });
    CONSTELLATIONS.forEach(c => { if (c.toLowerCase().includes(q)) results.push({ type:'constellation', name:c }); });
    return results;
}

export function formatDistance(au) {
    if (au >= 63241) return (au / 63241).toFixed(2) + ' ly';
    if (au >= 1) return au.toFixed(2) + ' AU';
    return (au * 149597870.7).toFixed(0) + ' km';
}

export function calcTimeScale(speedMultiplier) {
    if (speedMultiplier <= 0) return 'Paused';
    if (speedMultiplier < 60) return `${speedMultiplier.toFixed(1)}x real-time`;
    if (speedMultiplier < 3600) return `${(speedMultiplier/60).toFixed(1)} min/s`;
    if (speedMultiplier < 86400) return `${(speedMultiplier/3600).toFixed(1)} hr/s`;
    return `${(speedMultiplier/86400).toFixed(1)} day/s`;
}
