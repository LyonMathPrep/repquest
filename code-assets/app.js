const S={currentUser:null,currentWorkout:null,reps:0,xp:0,cameraOn:false,paused:false,startXp:0,startRank:0,shownRank:0,lastFrame:0,fps:0,firstResult:true,mode:null,activeChallenge:null};
let pose=null,stream=null,raf=null,det=null,lastRep=0,audioCtx=null,pendingDel=null,delTimer=null;
const AC={history:[],maxHist:15,yDirChangesL:0,yDirChangesR:0,prevDirL:0,prevDirR:0,prevLY:null,prevRY:null,smoothMovement:0};
const WU={phases:[],idx:0,elapsed:0,lastTick:0,pausedByForm:false,noForm:0,goodForm:0,done:false,prevKneeY:{l:null,r:null},movement:0};

const CLOUD_URL='https://my-python-worker.lyonmathprep.workers.dev/';

function todayStr(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function yesterdayStr(){
    const d=new Date();
    d.setDate(d.getDate()-1);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function getDaily(user){
    const today=todayStr();
    if(!user.daily||user.daily.date!==today){
        user.daily={date:today,repsByWorkout:{},totalReps:0,totalXp:0,workoutsCompleted:[],claimed:false};
        if(!user.guest)DB.upd(user);
    }
    return user.daily;
}

function getChallengeProgress(user){
    const daily=getDaily(user);
    const day=new Date().getDay();
    const ch=CHALLENGES[day];
    if(!ch)return null;
    let progress=0;
    switch(ch.type){
        case'totalReps':progress=daily.totalReps;break;
        case'workoutReps':progress=daily.repsByWorkout[ch.workout]||0;break;
        case'uniqueWorkouts':progress=daily.workoutsCompleted.length;break;
        case'totalXp':progress=daily.totalXp;break;
    }
    return{challenge:ch,progress,completed:progress>=ch.goal,claimed:daily.claimed};
}

function claimDaily(){
    const u=S.currentUser;
    if(!u)return;
    if(u.guest){toast('Create an account to claim daily rewards!','error');return;}
    const info=getChallengeProgress(u);
    if(!info||!info.completed||info.claimed)return;
    u.daily.claimed=true;
    u.xp+=info.challenge.xp;
    DB.upd(u);
    fetch(CLOUD_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.name,totalXP:u.xp})}).catch(()=>{});
    rTopRank(u.xp);
    rSelect();
    toast('Daily challenge complete! +'+info.challenge.xp+' XP!','success');
}

function startDailyChallenge(){
    const info=getChallengeProgress(S.currentUser);
    if(!info||info.completed)return;
    const ch=info.challenge;
    if(!ch.launch)return;
    const w=WK.find(x=>x.id===ch.launch);
    if(w){S.currentWorkout=w;S.activeChallenge=ch;showP('ask');}
}

function rDaily(){
    const u=S.currentUser;
    if(!u){$('dailyChallengeCard').hidden=true;return;}
    if(u.guest){
        $('dailyChallengeCard').hidden=false;
        $('dcName').textContent='Daily Challenge';
        $('dcDesc').textContent='Create an account to access daily challenges and earn bonus XP!';
        $('dcXpBadge').textContent='+XP';
        $('dcBarFill').style.width='0%';
        $('dcBarFill').classList.remove('complete');
        $('dcProgressText').textContent='0 / ?';
        $('dcStartBtn').hidden=true;
        const btn=$('dcClaimBtn');
        btn.disabled=true;btn.classList.remove('claimed');
        $('dcClaimTxt').textContent='Sign in to earn daily rewards';
        return;
    }
    const info=getChallengeProgress(u);
    if(!info){$('dailyChallengeCard').hidden=true;return;}
    $('dailyChallengeCard').hidden=false;
    const ch=info.challenge;
    $('dcName').textContent=ch.name;
    $('dcDesc').textContent=ch.desc;
    $('dcXpBadge').textContent='+'+ch.xp+' XP';
    $('dcProgressText').textContent=Math.min(info.progress,ch.goal)+' / '+ch.goal;
    const pct=Math.min(100,(info.progress/ch.goal)*100);
    const fill=$('dcBarFill');
    fill.style.width=pct+'%';
    fill.classList.toggle('complete',info.completed);
    const btn=$('dcClaimBtn'),txt=$('dcClaimTxt'),startBtn=$('dcStartBtn');
    if(info.claimed){
        startBtn.hidden=true;btn.disabled=true;btn.classList.add('claimed');
        txt.textContent='✓ Claimed — Come back tomorrow!';
    }else if(info.completed){
        startBtn.hidden=true;btn.disabled=false;btn.classList.remove('claimed');
        txt.textContent='Claim '+ch.xp+' XP Bonus!';
    }else{
        btn.disabled=true;btn.classList.remove('claimed');
        txt.textContent='Complete challenge to claim';
        if(ch.launch){startBtn.hidden=false;startBtn.textContent='Start Challenge';}
        else{startBtn.hidden=true;}
    }
}

const DB={
    K:'repquest_v1',
    get(){try{return JSON.parse(localStorage.getItem(this.K)||'[]')}catch{return[]}},
    save(u){localStorage.setItem(this.K,JSON.stringify(u))},
    add(n){const u=this.get(),o={id:'u_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:n.trim(),xp:0,created:Date.now(),stats:{},friends:[],streak:0,lastWorkoutDate:null};u.push(o);this.save(u);return o},
    upd(o){const u=this.get(),i=u.findIndex(x=>x.id===o.id);if(i>=0){u[i]=o;this.save(u)}else{u.push(o);this.save(u);}},
    del(id){this.save(this.get().filter(x=>x.id!==id))}
};

function mb(){return window.innerWidth<=600}
function ri(x){let i=0;RANKS.forEach((r,j)=>{if(x>=r.min)i=j});return i}
function rp(x){const i=ri(x),c=RANKS[i],n=RANKS[i+1];if(!n)return{i,name:c.name,color:c.color,bg:c.bg,xp:x,min:c.min,max:c.min,pct:1,next:null};const range=n.min-c.min,into=x-c.min;return{i,name:c.name,color:c.color,bg:c.bg,xp:x,min:c.min,max:n.min,pct:Math.max(0,Math.min(1,into/range)),next:n.name}}
const $=id=>document.getElementById(id);
function show(n){['Account','Select','Warmup','Active','Complete'].forEach(s=>{$('scr'+s).hidden=s.toLowerCase()!==n})}
function toast(msg,t='info'){const e=$('toast');e.textContent=msg;e.className='toast show'+(t==='error'?' error':t==='success'?' success':'');e.hidden=false;clearTimeout(e._t);e._t=setTimeout(()=>{e.classList.remove('show');setTimeout(()=>{e.hidden=true},300)},2800)}
function esc(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function ang(a,b,c){const r=Math.atan2(c.y-b.y,c.x-b.x)-Math.atan2(a.y-b.y,a.x-b.x);let d=Math.abs(r*180/Math.PI);if(d>180)d=360-d;return d}
function fmtTime(s){return Math.floor(s/60)+':'+(Math.floor(s%60)<10?'0':'')+Math.floor(s%60)}
function playTone(f){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=f;o.type='sine';g.gain.setValueAtTime(0,audioCtx.currentTime);g.gain.linearRampToValueAtTime(.06,audioCtx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.12);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.15)}catch(e){}}
function resetAC(){AC.history=[];AC.yDirChangesL=0;AC.yDirChangesR=0;AC.prevDirL=0;AC.prevDirR=0;AC.prevLY=null;AC.prevRY=null;AC.smoothMovement=0}
function detectArmCircles(lm){const lw=lm[15],rw=lm[16],ls=lm[11],rs=lm[12],le=lm[13],re=lm[14];const lV=(ls.visibility||0)>.5&&(lw.visibility||0)>.5&&(le.visibility||0)>.5;const rV=(rs.visibility||0)>.5&&(rw.visibility||0)>.5&&(re.visibility||0)>.5;if(!lV&&!rV)return{ok:false,msg:'STEP INTO FRAME'};let st=false;if(lV&&ang(ls,le,lw)>140)st=true;if(rV&&ang(rs,re,rw)>140)st=true;if(!st)return{ok:false,msg:'STRAIGHTEN ARMS'};let ext=false;if(lV&&Math.hypot(lw.x-ls.x,lw.y-ls.y)>.13)ext=true;if(rV&&Math.hypot(rw.x-rs.x,rw.y-rs.y)>.13)ext=true;if(!ext)return{ok:false,msg:'EXTEND ARMS OUT'};const ly=lV?lw.y:null,ry=rV?rw.y:null;if(ly!==null&&AC.prevLY!==null){const d=ly-AC.prevLY;if(Math.abs(d)>.003){const dir=d>0?1:-1;if(AC.prevDirL&&dir!==AC.prevDirL)AC.yDirChangesL++;AC.prevDirL=dir}}if(ry!==null&&AC.prevRY!==null){const d=ry-AC.prevRY;if(Math.abs(d)>.003){const dir=d>0?1:-1;if(AC.prevDirR&&dir!==AC.prevDirR)AC.yDirChangesR++;AC.prevDirR=dir}}AC.prevLY=ly;AC.prevRY=ry;AC.history.push({ly,ry});if(AC.history.length>AC.maxHist)AC.history.shift();if(AC.history.length>=AC.maxHist){let lY=[],rY=[];AC.history.forEach(h=>{if(h.ly!==null)lY.push(h.ly);if(h.ry!==null)rY.push(h.ry)});let lR=lY.length>3?Math.max(...lY)-Math.min(...lY):0,rR=rY.length>3?Math.max(...rY)-Math.min(...rY):0;AC.smoothMovement=AC.smoothMovement*.6+Math.max(lR,rR)*.4}const dc=Math.max(AC.yDirChangesL,AC.yDirChangesR),amp=AC.smoothMovement;if(dc<2)return{ok:false,msg:'START CIRCLING'};if(amp<.06)return{ok:false,msg:'BIGGER CIRCLES'};if(Math.random()<.03){if(AC.yDirChangesL>0)AC.yDirChangesL--;if(AC.yDirChangesR>0)AC.yDirChangesR--}if(amp<.10)return{ok:true,msg:'GOOD - BIGGER'};return{ok:true,msg:'GREAT - KEEP GOING'}}
function detectHighKnees(lm){const lh=lm[23],rh=lm[24],lk=lm[25],rk=lm[26],la=lm[27],ra=lm[28];if(!((lh.visibility||0)>.3&&(rh.visibility||0)>.3&&(lk.visibility||0)>.3&&(rk.visibility||0)>.3))return{ok:false,msg:'SHOW FULL BODY'};if((lh.y+rh.y)/2>(la.y+ra.y)/2-.05)return{ok:false,msg:'STAND UPRIGHT'};const lky=lk.y,rky=rk.y;if(WU.prevKneeY.l!==null){const mv=Math.abs(lky-WU.prevKneeY.l)+Math.abs(rky-WU.prevKneeY.r);WU.movement=WU.movement*.7+mv*.3}WU.prevKneeY.l=lky;WU.prevKneeY.r=rky;if(WU.movement<.003)return{ok:false,msg:'RUN IN PLACE'};if(WU.movement<.008)return{ok:true,msg:'GOOD - FASTER'};return{ok:true,msg:'GREAT - KEEP RUNNING'}}
const WD={arm_circles:detectArmCircles,high_knees:detectHighKnees};

function mkSquat(){return{s:'up',lm:false,smoothA:180,update(l){const lVis=(l[23].visibility||0)>.3&&(l[25].visibility||0)>.3&&(l[27].visibility||0)>.3,rVis=(l[24].visibility||0)>.3&&(l[26].visibility||0)>.3&&(l[28].visibility||0)>.3;let rawA=180;if(lVis&&rVis)rawA=(ang(l[23],l[25],l[27])+ang(l[24],l[26],l[28]))/2;else if(lVis)rawA=ang(l[23],l[25],l[27]);else if(rVis)rawA=ang(l[24],l[26],l[28]);this.smoothA=this.smoothA*.6+rawA*.4;const a=this.smoothA;let r=false;if(this.s==='up'&&a<100)this.s='down';else if(this.s==='down'&&a>160){this.s='up';if(this.lm)r=true;this.lm=false}if(this.s==='down'&&a<90)this.lm=true;let f;if(this.s==='up'&&a<130)f='SQUAT DOWN';else if(this.s==='down'&&a<90)f='STAND UP';else if(this.s==='down'&&a<120)f='GO LOWER';else f='TRACKING...';return{r,a:Math.round(a),st:this.s.toUpperCase(),f}}}}
function mkCurl(){return{s:'down',cm:false,update(l){const lv=(l[11].visibility||0)+(l[13].visibility||0)+(l[15].visibility||0),rv=(l[12].visibility||0)+(l[14].visibility||0)+(l[16].visibility||0),u=rv>=lv;const sh=u?l[12]:l[11],el=u?l[14]:l[13],wr=u?l[16]:l[15];const a=ang(sh,el,wr);let r=false;if(this.s==='down'&&a<50){this.s='up';this.cm=true}else if(this.s==='up'&&a>150){this.s='down';if(this.cm)r=true;this.cm=false}let f;if(this.s==='down')f='CURL UP';else if(a<50)f='EXTEND DOWN';else if(a<100)f='CURL HIGHER';else f='TRACKING...';return{r,a,st:this.s.toUpperCase()+(u?' R':' L'),f}}}}
function mkJack(){return{s:'closed',update(l){const sw=Math.max(.05,Math.abs(l[11].x-l[12].x)),hu=l[15].y<l[11].y&&l[16].y<l[12].y,fa=Math.abs(l[27].x-l[28].x)>sw*1.3;let r=false;if(this.s==='closed'&&hu&&fa)this.s='open';else if(this.s==='open'&&!hu&&!fa){this.s='closed';r=true}return{r,a:((hu?.5:0)+(fa?.5:0))*180,st:this.s.toUpperCase(),f:this.s==='closed'?'JUMP OUT':'RETURN'}}}}
function mkPushup(){return{s:'up',lm:false,update(l){const lv=(l[11].visibility||0)+(l[13].visibility||0)+(l[15].visibility||0),rv=(l[12].visibility||0)+(l[14].visibility||0)+(l[16].visibility||0),u=rv>=lv;const sh=u?l[12]:l[11],el=u?l[14]:l[13],wr=u?l[16]:l[15];const a=ang(sh,el,wr);let r=false;if(this.s==='up'&&a<90)this.s='down';else if(this.s==='down'&&a>150){this.s='up';if(this.lm)r=true;this.lm=false}if(this.s==='down'&&a<80)this.lm=true;let f;if(this.s==='up')f='GO DOWN';else if(a<80)f='PUSH UP';else if(a<110)f='LOWER';else f='TRACKING...';return{r,a,st:this.s.toUpperCase(),f}}}}
function mkLunge(){return{s:'up',lm:false,update(l){const la=ang(l[23],l[25],l[27]),ra=ang(l[24],l[26],l[28]);const a=Math.min(la,ra);let r=false;if(this.s==='up'&&a<110)this.s='down';else if(this.s==='down'&&a>160){this.s='up';if(this.lm)r=true;this.lm=false}if(this.s==='down'&&a<90)this.lm=true;let f;if(this.s==='up')f='LUNGE DOWN';else if(a<90)f='STAND UP';else if(a<120)f='GO LOWER';else f='TRACKING...';return{r,a,st:this.s.toUpperCase(),f}}}}
function mkPress(){return{s:'down',lm:false,update(l){const lv=(l[11].visibility||0)+(l[13].visibility||0)+(l[15].visibility||0),rv=(l[12].visibility||0)+(l[14].visibility||0)+(l[16].visibility||0),u=rv>=lv;const sh=u?l[12]:l[11],el=u?l[14]:l[13],wr=u?l[16]:l[15];const a=ang(sh,el,wr);let r=false;if(this.s==='down'&&a>150){this.s='up';if(this.lm)r=true;this.lm=false}else if(this.s==='up'&&a<90){this.s='down';this.lm=true}let f;if(this.s==='down')f='PRESS UP';else if(a>160)f='LOWER DOWN';else if(a<120)f='PRESS HIGHER';else f='TRACKING...';return{r,a,st:this.s.toUpperCase()+(u?' R':' L'),f}}}}
function mkLegRaise(){return{s:'down',lm:false,update(l){const la=ang(l[11],l[23],l[25]),ra=ang(l[12],l[24],l[26]);const a=Math.min(la,ra);let r=false;if(this.s==='down'&&a<130)this.s='up';else if(this.s==='up'&&a>160){this.s='down';if(this.lm)r=true;this.lm=false}if(this.s==='up'&&a<110)this.lm=true;let f;if(this.s==='down')f='RAISE LEG';else if(a>160)f='LOWER LEG';else if(a<110)f='HOLD';else f='TRACKING...';return{r,a,st:this.s.toUpperCase(),f}}}}

const DETS={squats:mkSquat,curls:mkCurl,jacks:mkJack,pushups:mkPushup,lunges:mkLunge,press:mkPress,legraises:mkLegRaise};

async function initPose(){if(pose)return;if(typeof Pose==='undefined')throw new Error('missing');pose=new Pose({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`});pose.setOptions({modelComplexity:1,smoothLandmarks:true,enableSegmentation:false,minDetectionConfidence:.5,minTrackingConfidence:.5});pose.onResults(onR)}
function gV(){if(S.mode==='warmup')return mb()?$('wuVideoM'):$('wuVideo');return $('video')}
function gC(){if(S.mode==='warmup')return mb()?$('wuCanvasM'):$('wuCanvas');return $('canvas')}
function gL(){if(S.mode==='warmup')return mb()?$('wuLoaderM'):$('wuLoader');return $('loader')}
function gF(){if(S.mode==='warmup')return mb()?$('wuFeedbackM'):$('wuFeedback');return $('feedbackPill')}
function gB(){if(S.mode==='warmup')return mb()?$('wuBorderM'):$('wuBorder');return $('videoBorder')}
async function camStart(){try{stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'},audio:false});const v=gV();v.srcObject=stream;await v.play();S.cameraOn=true;S.paused=false;S.firstResult=true;await initPose();loop()}catch(e){let m='Camera failed.';if(e.name==='NotAllowedError')m='Camera denied.';else if(e.name==='NotFoundError')m='No camera.';toast(m,'error');camStop();show('select');throw e}}
async function loop(){if(!S.cameraOn)return;const v=gV();if(!S.paused&&v.readyState>=2&&pose){try{await pose.send({image:v});const now=performance.now();if(S.lastFrame){const d=now-S.lastFrame;if(d>0){const f=1000/d;S.fps=S.fps>0?S.fps*.85+f*.15:f;if(S.mode==='active')$('vFps').textContent=Math.round(S.fps)}}S.lastFrame=now}catch(e){}}raf=requestAnimationFrame(loop)}
function camStop(){S.cameraOn=false;S.paused=false;if(raf){cancelAnimationFrame(raf);raf=null}if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}['video','wuVideo','wuVideoM'].forEach(id=>{const v=$(id);if(v)v.srcObject=null});['canvas','wuCanvas','wuCanvasM'].forEach(id=>{const c=$(id);if(c)c.getContext('2d').clearRect(0,0,c.width,c.height)})}

function drawKnight(ctx,lm,w,h){
    if(!lm)return;
    const dk = document.body.classList.contains('dark-mode');
    const c1 = dk ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)';
    const c2 = dk ? 'rgba(71,85,105,0.85)' : 'rgba(40,40,50,0.85)';
    const c3 = dk ? '#94a3b8' : '#374151';
    const c4 = dk ? '#cbd5e1' : '#9ca3af';
    const c5 = dk ? '#e2e8f0' : '#d1d5db';
    const c6 = dk ? '#1e293b' : '#1f2937';
    const c7 = dk ? '#f87171' : '#dc2626';
    const c8 = dk ? '#475569' : '#4b5563';

    const P=i=>lm[i]?{x:lm[i].x*w,y:lm[i].y*h,v:lm[i].visibility}:null;
    const n=P(0),l=P(7),h2=P(8),s=P(11),o=P(12),c=P(13),u=P(14),d=P(15),p=P(16),g=P(23),m=P(24),f=P(25),b=P(26),x2=P(27),y2=P(28);
    ctx.fillStyle=c1;ctx.fillRect(0,0,w,h);
    if(s&&o&&g&&m&&s.v>.3&&o.v>.3&&g.v>.3&&m.v>.3){ctx.fillStyle=c2;ctx.beginPath();ctx.moveTo(s.x,s.y);for(let pt of [o,m,g])ctx.lineTo(pt.x,pt.y);ctx.closePath();ctx.fill()}
    const drawSegment=(p1,p2,w1,w2)=>{if(!p1||!p2||p1.v<0.3||p2.v<0.3)return;const dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.max(1,Math.hypot(dx,dy)),nx=-dy/len,ny=dx/len;ctx.fillStyle=c3;ctx.strokeStyle=c4;ctx.lineWidth=2;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(p1.x+nx*w1,p1.y+ny*w1);ctx.lineTo(p2.x+nx*w2,p2.y+ny*w2);ctx.lineTo(p2.x-nx*w2,p2.y-ny*w2);ctx.lineTo(p1.x-nx*w1,p1.y-ny*w1);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle=c5;ctx.lineWidth=Math.min(w1,w2)*0.4;ctx.beginPath();ctx.moveTo(p1.x+nx*w1*0.3,p1.y+ny*w1*0.3);ctx.lineTo(p2.x+nx*w2*0.3,p2.y+ny*w2*0.3);ctx.stroke()};
    const J=(t,r)=>{if(t&&t.v>.3){ctx.fillStyle=c6;ctx.strokeStyle=c4;ctx.lineWidth=3;ctx.beginPath();ctx.arc(t.x,t.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=c5;ctx.beginPath();ctx.arc(t.x,t.y,r*0.4,0,Math.PI*2);ctx.fill()}};
    drawSegment(g,f,18,14);drawSegment(m,b,18,14);drawSegment(f,x2,14,10);drawSegment(b,y2,14,10);
    const drawFoot=(t,p1,p2)=>{if(!t||!p1||!p2||t.v<.3||p1.v<.3||p2.v<.3)return;const dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.max(1,Math.hypot(dx,dy)),ex=t.x+(dx/len)*25,ey=t.y+(dy/len)*25;ctx.fillStyle=c6;ctx.strokeStyle=c4;ctx.lineWidth=2;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(t.x+(-dy/len)*8,t.y+(dx/len)*8);ctx.lineTo(ex,ey);ctx.lineTo(t.x-(-dy/len)*8,t.y-(dx/len)*8);ctx.closePath();ctx.fill();ctx.stroke()};
    drawFoot(x2,f,x2);drawFoot(y2,b,y2);
    drawSegment(s,c,14,10);drawSegment(o,u,14,10);drawSegment(c,d,10,8);drawSegment(u,p,10,8);
    if(s&&o&&g&&m&&s.v>.3&&o.v>.3&&g.v>.3&&m.v>.3){ctx.fillStyle=c3;ctx.strokeStyle=c5;ctx.lineWidth=3;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(o.x,o.y);ctx.lineTo(m.x,m.y);ctx.lineTo(g.x,g.y);ctx.closePath();ctx.fill();ctx.stroke();const cx=(s.x+o.x)/2,topY=Math.min(s.y,o.y),botY=(g.y+m.y)/2+Math.abs(g.y-m.y)*0.6,halfW=Math.abs(s.x-o.x)*0.35;ctx.fillStyle='#991b1b';ctx.strokeStyle='#fbbf24';ctx.lineWidth=3;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(cx-halfW,topY);ctx.lineTo(cx+halfW,topY);ctx.lineTo(cx+halfW*0.7,botY);ctx.lineTo(cx-halfW*0.7,botY);ctx.closePath();ctx.fill();ctx.stroke()}
    J(s,16);J(o,16);J(c,12);J(u,12);J(g,16);J(m,16);J(f,14);J(b,14);
    if(c&&d&&c.v>.3&&d.v>.3){const mx=(c.x+d.x)/2,my=(c.y+d.y)/2,armAngle=Math.atan2(d.y-c.y,d.x-c.x);ctx.save();ctx.translate(mx,my);ctx.rotate(armAngle-Math.PI/2);ctx.fillStyle='#7c2d12';ctx.strokeStyle='#e5e7eb';ctx.lineWidth=4;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-30,-45);ctx.lineTo(30,-45);ctx.quadraticCurveTo(30,20,0,60);ctx.quadraticCurveTo(-30,20,-30,-45);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#d1d5db';ctx.strokeStyle='#374151';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-10,12,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore()}
    if(u&&p&&u.v>.3&&p.v>.3){const dx=p.x-u.x,dy=p.y-u.y,len=Math.max(1,Math.hypot(dx,dy)),ex=p.x+(dx/len)*100,ey=p.y+(dy/len)*100,gx=-dy/len,gy=dx/len;ctx.strokeStyle='#fbbf24';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x+gx*25,p.y+gy*25);ctx.lineTo(p.x-gx*25,p.y-gy*25);ctx.stroke();ctx.strokeStyle='#e5e7eb';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(ex,ey);ctx.stroke();ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(ex,ey);ctx.stroke();ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(p.x-(dx/len)*10,p.y-(dy/len)*10,5,0,Math.PI*2);ctx.fill()}
    J(d,10);J(p,10);
    if(n&&l&&h2&&l.v>.3&&h2.v>.3){const cx=n.x,cy=n.y,hw=Math.max(60,Math.abs(l.x-h2.x)*1.6),hh=hw*1.1;ctx.fillStyle=c7;ctx.strokeStyle='#991b1b';ctx.lineWidth=2;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(cx,cy-hh*0.5);ctx.quadraticCurveTo(cx+hw*0.5,cy-hh*1.3,cx,cy-hh*1.6);ctx.quadraticCurveTo(cx-hw*0.5,cy-hh*1.3,cx,cy-hh*0.5);ctx.fill();ctx.stroke();ctx.fillStyle=c8;ctx.strokeStyle=c6;ctx.lineWidth=4;ctx.lineJoin='round';ctx.beginPath();ctx.ellipse(cx,cy,hw/2,hh/2,0,Math.PI,0);ctx.lineTo(cx+hw/2,cy+hh*0.2);ctx.lineTo(cx-hw/2,cy+hh*0.2);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=c3;ctx.fillRect(cx-hw/2,cy-hh*0.1,hw,hh*0.4);ctx.strokeRect(cx-hw/2,cy-hh*0.1,hw,hh*0.4);ctx.shadowColor='#fbbf24';ctx.shadowBlur=15;ctx.fillStyle='#fbbf24';ctx.fillRect(cx-hw*0.35,cy,hw*0.7,5);ctx.shadowBlur=0;ctx.fillStyle='#000';for(let i=-1;i<=1;i++){ctx.fillRect(cx+i*10-2,cy+15,4,8)}ctx.strokeStyle=c5;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx-5,cy-5,hw*0.3,hh*0.2,-0.5,0,Math.PI*2);ctx.stroke()}
}

function onR(res){
    const isW=S.mode==='warmup';
    const cv=gC(),ctx=cv.getContext('2d');
    if(S.firstResult){S.firstResult=false;gL().hidden=true}
    cv.width=res.image.width;cv.height=res.image.height;
    ctx.save();ctx.clearRect(0,0,cv.width,cv.height);ctx.scale(-1,1);ctx.translate(-cv.width,0);
    ctx.drawImage(res.image,0,0,cv.width,cv.height);
    if(res.poseLandmarks){
        drawKnight(ctx,res.poseLandmarks,cv.width,cv.height);
        if(isW)pWU(res.poseLandmarks);else if(det)pAct(res.poseLandmarks);
    }else{
        gF().textContent='STEP INTO FRAME';gF().className='feedback-pill danger';
        if(isW){WU.noForm++;WU.goodForm=0;if(WU.noForm>15)sWuP(true)}
    }
    ctx.restore();
}

function pWU(lm){if(WU.done)return;const ph=WU.phases[WU.idx];if(!ph)return;const d=WD[ph.type],r=d(lm),fp=gF();if(r.ok){fp.textContent=r.msg;fp.className='feedback-pill good';WU.goodForm++;WU.noForm=0;if(WU.goodForm>4)sWuP(false)}else{fp.textContent=r.msg;fp.className='feedback-pill warn';WU.noForm++;WU.goodForm=0;if(WU.noForm>25)sWuP(true)}tWU()}
function sWuP(p){if(WU.pausedByForm===p)return;WU.pausedByForm=p;const tb=$('wmTimerBox');if(p){$('wpStatus').textContent='PAUSED - FIX FORM';$('wpStatus').className='wp-status paused';const ms=$('wmtStatus');if(ms){ms.textContent='PAUSED';ms.className='wmt-status paused'}if(tb)tb.classList.add('timer-paused');$('wuCamGroup').classList.add('paused');gB().classList.add('paused');$('wuCamLabel').textContent='PAUSED';WU.lastTick=0}else{$('wpStatus').textContent='GOOD FORM';$('wpStatus').className='wp-status active';const ms=$('wmtStatus');if(ms){ms.textContent='GOOD';ms.className='wmt-status active'}if(tb)tb.classList.remove('timer-paused');$('wuCamGroup').classList.remove('paused');gB().classList.remove('paused');$('wuCamLabel').textContent='ANALYZING';WU.lastTick=performance.now()}}
function updateTimerFill(pct){$('wpBar').style.width=pct+'%';$('wmTimerBg').style.height=pct+'%';$('wmTimerFg').style.height=pct+'%'}
function tWU(){if(WU.pausedByForm||WU.done)return;const now=performance.now();if(WU.lastTick>0)WU.elapsed+=(now-WU.lastTick)/1000;WU.lastTick=now;const ph=WU.phases[WU.idx],rem=Math.max(0,ph.duration-WU.elapsed);const ts=fmtTime(rem);const pct=(WU.elapsed/ph.duration)*100;$('wpTimer').textContent=ts;$('wmtTime').textContent=ts;updateTimerFill(pct);if(rem<=0){WU.idx++;WU.elapsed=0;WU.lastTick=performance.now();WU.noForm=0;WU.goodForm=0;WU.prevKneeY={l:null,r:null};WU.movement=0;resetAC();if(WU.idx>=WU.phases.length){WU.done=true;wuDone();return}rWuPh();playTone(660)}}

function pAct(lm){
    const d=det.update(lm);
    $('vAngle').textContent=Math.round(d.a)+'°';$('vState').textContent=d.st;
    const fp=$('feedbackPill');fp.textContent=d.f;fp.className='feedback-pill';
    if(d.f.includes('LOWER')||d.f.includes('HIGHER'))fp.classList.add('warn');
    if(d.r){
        const now=performance.now();
        if(now-lastRep>400){
            lastRep=now;S.reps++;S.xp+=S.currentWorkout.xp;
            uAct();flashRep();xpFloat(S.currentWorkout.xp);playTone(880);
            if(S.activeChallenge){
                const info=getChallengeProgress(S.currentUser);
                if(info.progress+S.reps>=S.activeChallenge.goal){
                    toast('Challenge Complete! Ending session...','success');
                    setTimeout(endSession,1200);
                }
            }
        }
    }
}

function flashRep(){const e=$('repCount');e.classList.remove('flash');void e.offsetWidth;e.classList.add('flash')}
function xpFloat(n){const f=document.createElement('div');f.className='xp-float';f.textContent='+'+n+' XP';$('repCount').parentElement.appendChild(f);setTimeout(()=>f.remove(),1000)}
function rTopRank(xp){const p=rp(xp),r=RANKS[p.i],el=$('topbarRankArea');el.innerHTML=`<div class="rank-pill" style="color:${r.color};background:${r.bg}">${p.name.toUpperCase()}<div class="rank-pill-bar"><div class="rank-pill-bar-fill" style="width:${p.pct*100}%;background:${r.color}"></div></div><span class="rank-pill-xp">${p.next?p.xp+'/'+p.max:'MAX'}</span></div>`;el.hidden=false}
function updateMobileWuRank(){if(!S.currentUser)return;const p=rp(S.currentUser.xp),r=RANKS[p.i];$('wmRankName').textContent=p.name.toUpperCase();$('wmRankName').style.color=r.color;$('wmRankBarFill').style.cssText=`width:${p.pct*100}%;background:${r.color}`;$('wmRankXp').textContent=p.next?`${S.currentUser.xp}/${p.max}`:'MAX'}

function rAccounts(){
    const el=$('accountList'),users=DB.get();
    el.innerHTML='';
    if(!users.length){el.innerHTML='<div class="account-empty">No local accounts yet. Create one above!</div>';return}
    users.forEach(u=>{
        const p=rp(u.xp),r=RANKS[p.i],tr=Object.values(u.stats||{}).reduce((s,v)=>s+(v.reps||0),0);
        const d=document.createElement('div');
        d.className='account-card';d.setAttribute('role','button');d.tabIndex=0;
        d.innerHTML=`<div class="account-avatar" style="background:${r.bg};color:${r.color}">${esc(u.name[0].toUpperCase())}</div><div class="account-info"><div class="account-name">${esc(u.name)}${u.guest?' <span style="color:var(--gray-400);font-size:11px;font-weight:500">(Guest)</span>':''}</div><div class="account-meta">${tr} reps · ${u.xp} XP · ${p.name} · 🔥 ${u.streak||0} day streak</div></div><div class="rank-pill" style="color:${r.color};background:${r.bg};font-size:10px;padding:3px 8px">${p.name.toUpperCase()}</div><button class="account-x" data-id="${u.id}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`;
        d.addEventListener('click',e=>{if(e.target.closest('.account-x')){e.stopPropagation();delU(u);return}pickU(u)});
        d.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pickU(u)}});
        el.appendChild(d);
    });
}

function delU(u){if(pendingDel===u.id){DB.del(u.id);rAccounts();pendingDel=null;clearTimeout(delTimer);toast(`Deleted ${u.name}.`);if(S.currentUser&&S.currentUser.id===u.id){S.currentUser=null;$('topbarRankArea').hidden=true}}else{pendingDel=u.id;toast('Tap X again to confirm.');clearTimeout(delTimer);delTimer=setTimeout(()=>{pendingDel=null},3000)}}

/* ===== pickU: sync cloud XP on every login ===== */
async function pickU(u){
    if(!u.friends)u.friends=[];
    if(!u.streak) u.streak = 0;
    if(u.lastWorkoutDate && u.lastWorkoutDate !== todayStr() && u.lastWorkoutDate !== yesterdayStr()){
        u.streak = 0;
        u.lastWorkoutDate = null;
        DB.upd(u);
    }
    S.currentUser=u;
    rTopRank(u.xp);
    rSelect();
    show('select');
    if(u.guest)return;
    try{
        const res=await fetch(`${CLOUD_URL}?username=${encodeURIComponent(u.name)}`);
        const data=await res.json();
        if(data.found&&typeof data.xp==='number'&&data.xp>u.xp){
            u.xp=data.xp;
            DB.upd(u);
            S.currentUser=u;
            rTopRank(u.xp);
            rSelect();
            toast('XP synced from cloud!','success');
        }
    }catch(e){}
}

function rSelect(){
    const u=S.currentUser;if(!u)return;
    const p=rp(u.xp),r=RANKS[p.i];
    $('selectRankIcon').textContent=p.name[0].toUpperCase();
    $('selectRankIcon').style.cssText=`background:${r.bg};color:${r.color}`;
    $('selectRankName').textContent=p.name.toUpperCase();
    $('selectRankName').style.color=r.color;
    $('selectRankBarFill').style.cssText=`width:${p.pct*100}%;background:${r.color}`;
    $('selectRankXp').textContent=p.next?`${u.xp} / ${p.max} XP`:`${u.xp} XP · MAX`;
    
    $('streakNum').textContent = u.streak || 0;
    $('streakCard').hidden = false;
    
    setCtx(null);
    const g=$('workoutGrid');g.innerHTML='';
    const isMb=mb();
    WK.forEach(w=>{
        const st=(u.stats||{})[w.id]||{reps:0};
        const c=document.createElement('button');c.className='workout-card';
        if(isMb){c.innerHTML=`<div class="wc-top"><div class="wc-icon">${w.icon}</div></div><div class="wc-body"><div class="wc-name">${w.name}</div><div class="wc-desc">${w.desc}</div><div class="wc-footer"><div class="wc-xp">+${w.xp} XP/rep</div><div class="wc-total">${st.reps} total</div></div></div><div class="wc-chevron"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></div>`}
        else{c.innerHTML=`<div class="wc-top"><div class="wc-icon">${w.icon}</div><div><div class="wc-name">${w.name}</div><div class="wc-desc">${w.desc}</div></div></div><div class="wc-footer"><div class="wc-xp">+${w.xp} XP/rep</div><div class="wc-total">${st.reps} total</div></div>`}
        c.addEventListener('click',()=>{S.currentWorkout=w;S.activeChallenge=null;showP('ask')});
        g.appendChild(c);
    });
    rDaily();
}

function setCtx(data){const el=$('topbarCtx');if(!data){el.classList.remove('active','mobile-active');return}$('topbarCtxName').textContent=data.name;$('topbarCtxSub').textContent=data.sub;el.classList.add('active');if(mb())el.classList.add('mobile-active');else el.classList.remove('mobile-active')}
function showP(mode){$('privModal').hidden=false;if(mode==='ask'){$('privCancel').hidden=false;$('privAccept').hidden=false;$('privClose').hidden=true;$('privTitle').textContent='Camera & Privacy'}else{$('privCancel').hidden=true;$('privAccept').hidden=true;$('privClose').hidden=false;$('privTitle').textContent='Privacy Info'}}

async function startWU(w){
    S.mode='warmup';S.paused=false;S.fps=0;S.firstResult=true;
    WU.phases=WARMUP_PLANS[w.id].map(p=>({...p}));
    WU.idx=0;WU.elapsed=0;WU.lastTick=0;WU.pausedByForm=false;WU.noForm=0;WU.goodForm=0;WU.done=false;WU.prevKneeY={l:null,r:null};WU.movement=0;resetAC();
    $('wuName').textContent=w.name+' Warm-up';$('wuTip').textContent='Get ready for '+w.name.toLowerCase();
    ['wuLoader','wuLoaderM'].forEach(id=>{const e=$(id);if(e)e.hidden=false});
    ['wuFeedback','wuFeedbackM'].forEach(id=>{const e=$(id);if(e){e.textContent='STARTING...';e.className='feedback-pill'}});
    $('wuCamGroup').classList.remove('paused');$('wuCamGroup').classList.add('warmup-cam');
    ['wuBorder','wuBorderM'].forEach(id=>{const e=$(id);if(e)e.classList.remove('paused')});
    $('wuCamLabel').textContent='ANALYZING';$('wmTimerBox').classList.remove('timer-paused');
    setCtx({name:w.name+' Warm-up',sub:'Get ready'});
    updateMobileWuRank();rWuPh();rWuSt();show('warmup');
    try{await camStart()}catch(e){show('select');setCtx(null)}
}

function rWuPh(){const p=WU.phases[WU.idx];const lbl=`PHASE ${WU.idx+1} OF ${WU.phases.length}`;const t=fmtTime(p.duration);$('wpLabel').textContent=lbl;$('wpName').textContent=p.name;$('wpDetail').textContent=p.detail;$('wpTimer').textContent=t;$('wpBar').style.width='0%';$('wpStatus').textContent='WAITING...';$('wpStatus').className='wp-status waiting';$('wmPhaseName').textContent=p.name;$('wmPhaseDetail').textContent=p.detail;$('wmtTime').textContent=t;updateTimerFill(0);$('wmtStatus').textContent='WAITING';$('wmtStatus').className='wmt-status waiting';rWuSt()}
function rWuSt(){['wsList','wsListM'].forEach(listId=>{const list=$(listId);if(!list)return;list.innerHTML='';WU.phases.forEach((p,i)=>{const cls=i<WU.idx?'ws-item done':i===WU.idx?'ws-item current':'ws-item';const el=document.createElement('div');el.className=cls;el.innerHTML=`<div class="ws-check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div><div><div class="ws-name">${p.name}</div><div class="ws-dur">${p.duration}s</div></div>`;list.appendChild(el)})})}
function wuDone(){camStop();toast('Warm-up done! Starting workout...','success');setTimeout(()=>startMain(S.currentWorkout),800)}

async function startMain(w){
    S.mode='active';S.reps=0;S.xp=0;S.startXp=S.currentUser.xp;S.startRank=ri(S.currentUser.xp);S.shownRank=S.startRank;S.paused=false;S.fps=0;S.firstResult=true;
    det=DETS[w.id]();
    $('activeName').textContent=w.name.toUpperCase();
    let tipText=w.tip;
    if(S.activeChallenge){const info=getChallengeProgress(S.currentUser);const remaining=Math.max(0,S.activeChallenge.goal-info.progress);tipText='Challenge: '+remaining+' reps to go!';}
    $('activeTip').textContent=tipText;
    $('xpPerRep').textContent='+'+w.xp;$('vPerRep').textContent='+'+w.xp;
    if(mb())$('vsPerRep').style.display='';else $('vsPerRep').style.display='none';
    $('pauseIco').innerHTML='<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';
    $('pauseTxt').textContent='Pause';$('pauseBtn').classList.remove('paused');
    $('loader').hidden=false;$('feedbackPill').textContent='STARTING...';$('feedbackPill').className='feedback-pill';
    $('vAngle').textContent='--';$('vState').textContent='--';$('vFps').textContent='--';
    $('camGroup').classList.remove('paused','warmup-cam');$('videoBorder').classList.remove('paused','warmup-active');
    $('camLabel').textContent='ANALYZING';
    setCtx({name:w.name.toUpperCase(),sub:tipText});
    uAct();show('active');
    try{await camStart()}catch(e){show('select');setCtx(null)}
}

function uAct(){
    $('repCount').textContent=S.reps;$('sessionXp').textContent=S.xp;$('mRepCount').textContent=S.reps;$('mSessionXp').textContent=S.xp;
    const total=S.activeChallenge?S.startXp:(S.startXp+S.xp);
    const p=rp(total),r=RANKS[p.i];
    $('rcRankName').textContent=p.name.toUpperCase();$('rcRankName').style.color=r.color;
    $('rcBarFill').style.cssText=`width:${p.pct*100}%;background:${r.color}`;
    $('rcRankXp').textContent=p.next?`${total} / ${p.max}`:`${total} XP`;
    $('rcNext').textContent=p.next?p.next.toUpperCase():'MAX';
    $('mRankName').textContent=p.name.toUpperCase();$('mRankName').style.color=r.color;
    $('mRankBarFill').style.cssText=`width:${p.pct*100}%;background:${r.color}`;
    $('mRankXp').textContent=p.next?`${total}/${p.max}`:`${total} XP`;
    rTopRank(total);
    if(!S.activeChallenge&&p.i>S.shownRank){S.shownRank=p.i;toast(`Rank up — ${p.name}!`,'success');const b=$('rankCardSm');b.classList.remove('rankup');void b.offsetWidth;b.classList.add('rankup');setTimeout(()=>b.classList.remove('rankup'),1500)}
}

function endSession(){
    camStop();setCtx(null);S.mode=null;
    if(S.reps>0&&S.currentWorkout){
        const u=S.currentUser;
        u.xp+=S.xp;
        if(!u.stats)u.stats={};
        const st=u.stats[S.currentWorkout.id]||{reps:0,best:0};
        st.reps+=S.reps;if(S.reps>st.best)st.best=S.reps;
        u.stats[S.currentWorkout.id]=st;
        
        const today = todayStr();
        if(u.lastWorkoutDate !== today){
            if(u.lastWorkoutDate === yesterdayStr()){
                u.streak = (u.streak || 0) + 1;
            } else {
                u.streak = 1;
            }
            u.lastWorkoutDate = today;
        }
        
        const daily=getDaily(u);
        daily.repsByWorkout[S.currentWorkout.id]=(daily.repsByWorkout[S.currentWorkout.id]||0)+S.reps;
        daily.totalReps+=S.reps;daily.totalXp+=S.xp;
        if(S.reps>0&&!daily.workoutsCompleted.includes(S.currentWorkout.id))daily.workoutsCompleted.push(S.currentWorkout.id);
        
        DB.upd(u);
        
        if(!u.guest){
            fetch(CLOUD_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.name,totalXP:u.xp})}).catch(()=>{});
        }
        const ei=ri(u.xp),er=RANKS[ei];
        $('ccReps').textContent=S.reps;$('ccXp').textContent=S.xp;$('ccXp').style.color=er.color;
        if(ei>S.startRank){
            $('ccRankup').hidden=false;$('ccRankup').style.cssText=`background:${er.bg};border:1px solid ${er.bg}`;
            $('ccRankupLabel').style.color=er.color;$('ccRankupName').textContent=er.name.toUpperCase();$('ccRankupName').style.color=er.color;
        }else{$('ccRankup').hidden=true}
        const dcInfo=getChallengeProgress(u);
        if(dcInfo&&dcInfo.completed&&!dcInfo.claimed)setTimeout(()=>toast('Daily challenge ready! Claim your '+dcInfo.challenge.xp+' XP!','success'),1500);
        rTopRank(u.xp);S.activeChallenge=null;det=null;show('complete');
    }else{S.activeChallenge=null;det=null;rSelect();show('select')}
}

function togglePause(){S.paused=!S.paused;if(S.paused){$('pauseIco').innerHTML='<polygon points="5 3 19 12 5 21 5 3"/>';$('pauseTxt').textContent='Resume';$('pauseBtn').classList.add('paused');$('camGroup').classList.add('paused');$('videoBorder').classList.add('paused');$('camLabel').textContent='PAUSED';$('feedbackPill').textContent='PAUSED';$('feedbackPill').className='feedback-pill warn'}else{$('pauseIco').innerHTML='<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';$('pauseTxt').textContent='Pause';$('pauseBtn').classList.remove('paused');$('camGroup').classList.remove('paused');$('videoBorder').classList.remove('paused');$('camLabel').textContent='ANALYZING'}}
function cancelWU(){camStop();S.mode=null;S.activeChallenge=null;setCtx(null);rSelect();show('select')}
function skipWU(){camStop();S.mode=null;WU.done=true;startMain(S.currentWorkout)}

function openFriendsModal(){$('friendsModal').hidden=false;fetchAllFriendStats()}
function closeFriendsModal(){$('friendsModal').hidden=true;$('friendNameInput').value=''}

function addFriend(){
    const inp=$('friendNameInput'),name=inp.value.trim().toLowerCase();
    if(!name||name.length>16){toast('Enter a valid username.','error');return}
    if(!S.currentUser.friends)S.currentUser.friends=[];
    if(S.currentUser.friends.includes(name)){toast('Friend already added.','error');return}
    if(name===S.currentUser.name.toLowerCase()){toast('You cannot add yourself!','error');return}
    S.currentUser.friends.push(name);DB.upd(S.currentUser);inp.value='';
    toast(`Added ${name}!`,'success');fetchAllFriendStats();
}

function removeFriend(name){
    S.currentUser.friends=S.currentUser.friends.filter(f=>f!==name);
    DB.upd(S.currentUser);toast(`Removed ${name}.`);fetchAllFriendStats();
}

async function fetchAllFriendStats(){
    const listEl=$('friendsList');
    listEl.innerHTML='<div class="account-empty">Loading stats...</div>';
    const friends=S.currentUser.friends||[],stats=[];
    for(const f of friends){
        try{const res=await fetch(`${CLOUD_URL}?username=${encodeURIComponent(f)}`);const data=await res.json();if(data.found)stats.push({name:data.username,xp:data.xp});else stats.push({name:f,xp:-1})}
        catch{stats.push({name:f,xp:-1})}
    }
    stats.push({name:S.currentUser.name+' (You)',xp:S.currentUser.xp,isMe:true});
    stats.sort((a,b)=>b.xp-a.xp);
    listEl.innerHTML='';
    stats.forEach(s=>{
        const el=document.createElement('div');el.className='account-card';el.style.cursor='default';
        if(s.isMe){el.style.background='var(--blue-50)';el.style.borderColor='var(--blue-500)'}
        const p=rp(s.xp<0?0:s.xp),r=RANKS[p.i];
        el.innerHTML=`<div class="account-avatar" style="background:${r.bg};color:${r.color}">${esc(s.name[0].toUpperCase())}</div><div class="account-info"><div class="account-name">${esc(s.name)}</div><div class="account-meta">${s.xp<0?'Not found in cloud':s.xp+' XP · '+p.name}</div></div>${!s.isMe?`<button class="account-x" data-fname="${s.name.toLowerCase()}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`:''}`;
        if(!s.isMe)el.querySelector('.account-x').addEventListener('click',e=>{e.stopPropagation();removeFriend(s.name.toLowerCase())});
        listEl.appendChild(el);
    });
}

// Theme Switching Logic (Auto-detect + AMOLED)
function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        $('themeBtn').textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        $('themeBtn').textContent = '🌙';
    }
}

const savedTheme = localStorage.getItem('repquest_theme');
if (savedTheme) {
    applyTheme(savedTheme === 'dark');
} else {
    applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('repquest_theme')) {
        applyTheme(e.matches);
    }
});

$('themeBtn').addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    applyTheme(isDark);
    localStorage.setItem('repquest_theme', isDark ? 'dark' : 'light');
});

$('guestBtn').addEventListener('click',()=>{
    const users = DB.get();
    let u = users.find(x => x.guest);
    if(!u){
        u = {id:'guest_'+Date.now().toString(36), name:'Guest', xp:0, created:Date.now(), stats:{}, friends:[], guest:true, streak:0, lastWorkoutDate:null};
        DB.save([...users, u]);
    }
    if(!u.friends) u.friends=[];
    if(!u.streak) u.streak = 0;
    if(u.lastWorkoutDate && u.lastWorkoutDate !== todayStr() && u.lastWorkoutDate !== yesterdayStr()){
        u.streak = 0;
        u.lastWorkoutDate = null;
        DB.upd(u);
    }
    S.currentUser = u;
    rTopRank(u.xp);
    rSelect();
    show('select');
    toast('Playing as Guest. Create an account to sync progress to the cloud!');
});

$('toggleFormBtn').addEventListener('click',()=>{
    const wrapper=$('formWrapper'),chev=$('formChev'),txt=$('toggleFormTxt');
    if(wrapper.classList.contains('open')){wrapper.classList.remove('open');chev.classList.remove('open');txt.textContent='Create New Cloud Account'}
    else{wrapper.classList.add('open');chev.classList.add('open');txt.textContent='Hide Registration Form'}
});

$('createBtn').addEventListener('click',async()=>{
    const inp=$('newName'),n=inp.value.trim();
    if(!n){toast('Enter a name.','error');inp.focus();return}
    if(n.length>16){toast('Too long.','error');return}
    if(DB.get().some(u=>u.name.toLowerCase()===n.toLowerCase())){toast('User already exists locally! Select them above.','error');return}
    const btn=$('createBtn');btn.textContent='Checking Cloud...';btn.disabled=true;
    try{
        const res=await fetch(`${CLOUD_URL}?username=${encodeURIComponent(n)}`);
        const data=await res.json();
        const u=DB.add(n);
        if(data.found){u.xp=data.xp||0;DB.upd(u);toast(`Welcome back, ${u.name}! Cloud sync complete.`,'success')}
        else{toast(`New user created! Make sure to fill out the form above.`,'success')}
        inp.value='';rAccounts();pickU(u);
    }catch(err){
        toast('Network error. Created locally.','error');
        const u=DB.add(n);inp.value='';rAccounts();pickU(u);
    }finally{btn.textContent='Sync';btn.disabled=false}
});

$('newName').addEventListener('keydown',e=>{if(e.key==='Enter')$('createBtn').click()});
$('switchUser').addEventListener('click',()=>{setCtx(null);show('account');rAccounts()});
$('friendsBtn').addEventListener('click',openFriendsModal);
$('closeFriendsBtn').addEventListener('click',closeFriendsModal);
$('addFriendBtn').addEventListener('click',addFriend);
$('friendNameInput').addEventListener('keydown',e=>{if(e.key==='Enter')addFriend()});
$('friendsModal').addEventListener('click',e=>{if(e.target===$('friendsModal'))closeFriendsModal()});
$('dcClaimBtn').addEventListener('click',claimDaily);
$('dcStartBtn').addEventListener('click',startDailyChallenge);
$('stopBtn').addEventListener('click',endSession);
$('pauseBtn').addEventListener('click',togglePause);
$('ccBack').addEventListener('click',()=>{rSelect();show('select')});
$('ccAgain').addEventListener('click',async()=>{if(S.currentWorkout)await startWU(S.currentWorkout);else{rSelect();show('select')}});
$('privAccept').addEventListener('click',async()=>{$('privModal').hidden=true;await startWU(S.currentWorkout)});
$('privCancel').addEventListener('click',()=>{$('privModal').hidden=true;S.currentWorkout=null;S.activeChallenge=null});
$('privClose').addEventListener('click',()=>{$('privModal').hidden=true});
$('privacyBtn').addEventListener('click',()=>showP('info'));
$('topbarRankArea').addEventListener('click',()=>showP('info'));
$('privModal').addEventListener('click',e=>{if(e.target===$('privModal')){$('privModal').hidden=true;S.currentWorkout=null;S.activeChallenge=null}});
$('cancelWarmup').addEventListener('click',cancelWU);$('skipWarmup').addEventListener('click',skipWU);
$('cancelWarmupM').addEventListener('click',cancelWU);$('skipWarmupM').addEventListener('click',skipWU);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('privModal').hidden){$('privModal').hidden=true;S.currentWorkout=null;S.activeChallenge=null}else if(!$('scrActive').hidden&&!S.paused)togglePause()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.cameraOn){if(S.mode==='active'&&!S.paused)togglePause();if(S.mode==='warmup')sWuP(true)}});
window.addEventListener('beforeunload',camStop);
let rz;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(!$('scrSelect').hidden&&S.currentUser)rSelect()},250)});
rAccounts();
