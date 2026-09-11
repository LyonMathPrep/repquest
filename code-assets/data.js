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
    {id:'curls',name:'Bicep Curls',desc:'Arm isolation',xp:8,tip:'Face camera, keep elbows still',icon:`<svg viewBox="0 0 24 24"><rect x="2" y="9" width="3" height="6" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><path d="M5 11h14M5 13h14"/></svg>`},
    {id:'jacks',name:'Jumping Jacks',desc:'Full-body cardio',xp:5,tip:'Step back, full body in frame',icon:`<svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><path d="M12 6v6"/><path d="M6 9l6 3 6-3"/><path d="M9 18l3-6 3 6"/></svg>`},
    {id:'pushups',name:'Push-ups',desc:'Upper-body strength',xp:12,tip:'Side-on, body horizontal',icon:`<svg viewBox="0 0 24 24"><circle cx="5" cy="9" r="2"/><path d="M7 10h14"/><path d="M3 15h18"/><path d="M5 15v3M19 15v3"/></svg>`},
    {id:'lunges',name:'Lunges',desc:'Legs & Glutes',xp:11,tip:'Stand side-on, step forward',icon:`<svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><path d="M9 9h6"/><path d="M12 9l-4 5"/><path d="M8 14h6"/><path d="M8 14v4"/><path d="M16 14v4"/></svg>`},
    {id:'press',name:'Shoulder Press',desc:'Shoulders & Arms',xp:9,tip:'Face camera, press overhead',icon:`<svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><path d="M12 6v4"/><path d="M7 10l5 2 5-2"/><path d="M12 12v4"/><path d="M8 18h8"/></svg>`},
    {id:'legraises',name:'Side Leg Raises',desc:'Outer Thighs',xp:7,tip:'Stand side-on, lift leg out',icon:`<svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><path d="M12 6v8"/><path d="M8 14h8"/><path d="M12 14l5 3"/></svg>`}
];

const CHALLENGES=[
    {day:0,name:'Sunday Sweat',desc:'Complete 100 reps total today',xp:1500,type:'totalReps',goal:100,launch:'jacks'},
    {day:1,name:'Monday Motivation',desc:'Do 100 squats today',xp:1500,type:'workoutReps',workout:'squats',goal:100,launch:'squats'},
    {day:2,name:'Triple Tuesday',desc:'Complete 3 different workouts today',xp:1500,type:'uniqueWorkouts',goal:3},
    {day:3,name:'Wednesday Grind',desc:'Earn 500 XP today',xp:1000,type:'totalXp',goal:500,launch:'jacks'},
    {day:4,name:'Threshold Thursday',desc:'Do 60 push-ups today',xp:1500,type:'workoutReps',workout:'pushups',goal:60,launch:'pushups'},
    {day:5,name:'Friday Fire',desc:'Complete 150 total reps today',xp:2000,type:'totalReps',goal:150,launch:'jacks'},
    {day:6,name:'Saturday Sprint',desc:'Complete 4 different workouts today',xp:2000,type:'uniqueWorkouts',goal:4}
];

const WARMUP_PLANS={
    curls:[{name:'Arm Circles (Forward)',detail:'Rotate arms forward in wide circles',duration:15,type:'arm_circles'},{name:'Arm Circles (Backward)',detail:'Reverse direction',duration:15,type:'arm_circles'},{name:'High Knees',detail:'Run in place, drive knees up',duration:30,type:'high_knees'}],
    squats:[{name:'High Knees',detail:'Run in place, open hips and knees',duration:50,type:'high_knees'},{name:'Arm Circles (Forward)',detail:'Loosen shoulders',duration:15,type:'arm_circles'},{name:'Arm Circles (Backward)',detail:'Reverse direction',duration:15,type:'arm_circles'}],
    pushups:[{name:'Arm Circles (Forward)',detail:'Mobilize shoulder girdle',duration:22,type:'arm_circles'},{name:'Arm Circles (Backward)',detail:'Full range of motion',duration:23,type:'arm_circles'},{name:'High Knees',detail:'Run in place, engage core',duration:45,type:'high_knees'}],
    jacks:[{name:'Arm Circles (Forward)',detail:'Loosen up shoulders',duration:15,type:'arm_circles'},{name:'Arm Circles (Backward)',detail:'Reverse direction',duration:15,type:'arm_circles'},{name:'High Knees',detail:'Run in place, build intensity',duration:55,type:'high_knees'}],
    lunges:[{name:'High Knees',detail:'Run in place, open hips and knees',duration:40,type:'high_knees'},{name:'Arm Circles (Forward)',detail:'Loosen shoulders',duration:15,type:'arm_circles'},{name:'Arm Circles (Backward)',detail:'Reverse direction',duration:15,type:'arm_circles'}],
    press:[{name:'Arm Circles (Forward)',detail:'Mobilize shoulder girdle',duration:20,type:'arm_circles'},{name:'Arm Circles (Backward)',detail:'Full range of motion',duration:20,type:'arm_circles'},{name:'High Knees',detail:'Run in place, engage core',duration:30,type:'high_knees'}],
    legraises:[{name:'High Knees',detail:'Run in place, open hips',duration:45,type:'high_knees'},{name:'Arm Circles (Forward)',detail:'Loosen up',duration:15,type:'arm_circles'},{name:'Arm Circles (Backward)',detail:'Reverse direction',duration:15,type:'arm_circles'}]
};
