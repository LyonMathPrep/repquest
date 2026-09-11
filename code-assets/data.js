const RANKS=[
    {name:'Rookie',min:0,color:'#6b7280',bg:'#f3f4f6'},
    {name:'Cadet',min:100,color:'#3b82f6',bg:'#eff6ff'},
    {name:'Athlete',min:300,color:'#22c55e',bg:'#f0fdf4'},
    {name:'Warrior',min:700,color:'#f97316',bg:'#fff7ed'},
    {name:'Champion',min:1500,color:'#ef4444',bg:'#fef2f2'},
    {name:'Legend',min:3000,color:'#a855f7',bg:'#faf5ff'},
    {name:'Mythic',min:6000,color:'#eab308',bg:'#fefce8'},
    {name:'Titan',min:12000,color:'#06b6d4',bg:'#ecfeff'},
    {name:'Olympus',min:25000,color:'#6366f1',bg:'#eef2ff'},
    {name:'Demigod',min:50000,color:'#ec4899',bg:'#fdf2f8'},
    {name:'Ascended',min:100000,color:'#10b981',bg:'#ecfdf5'}
];

// AMOLED Dark Mode Adjustments for Rank Badges
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    RANKS.forEach(r => {
        if(r.bg === '#f3f4f6') r.bg = '#1f1f1f';
        else if(r.bg === '#eff6ff') r.bg = '#0a1f35';
        else if(r.bg === '#f0fdf4') r.bg = '#0a2e1a';
        else if(r.bg === '#fff7ed') r.bg = '#2a1a0a';
        else if(r.bg === '#fef2f2') r.bg = '#2a0a0a';
        else if(r.bg === '#faf5ff') r.bg = '#1a0a2a';
        else if(r.bg === '#fefce8') r.bg = '#2a2a0a';
        else if(r.bg === '#ecfeff') r.bg = '#0a2a2a';
        else if(r.bg === '#eef2ff') r.bg = '#0a1a2a';
        else if(r.bg === '#fdf2f8') r.bg = '#2a0a1a';
        else if(r.bg === '#ecfdf5') r.bg = '#0a2a1a';
    });
}

const WK=[
    {id:'squats',name:'Squats',desc:'Lower-body strength',xp:10,tip:'Stand side-on, full body visible',icon:`<svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><path d="M9 9h6"/><path d="M12 9v3"/><path d="M8 12h8"/><path d="M8 12l-2 6"/><path d="M16 12l2 6"/></svg>`},
    {id:'curls',name:'Bicep Curls',desc:'Arm isolation',xp:8,tip:'Face camera, keep elbows still',icon:`<svg viewBox="0 0 24 24"><rect x="2" y="9" width="3" height="6"
