(() => {
  'use strict';
  const canvas=document.getElementById('stage'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id);
  const activities=[
    {icon:'🦴',buddy:'🐶',text:'แอบให้อาหารหมา หมางับขนมไปไลฟ์ด้วย',motion:'feed'},
    {icon:'🛏️',buddy:'😴',text:'ขอนอนแป๊บเดียว… กรนคร่อก!',motion:'sleep'},
    {icon:'🍜',buddy:'🥢',text:'ต้มบะหมี่แบบ 47 ขั้นตอน',motion:'cook'},
    {icon:'💃',buddy:'🕺',text:'ซ้อมเต้นท่าที่คิดขึ้นเมื่อกี้',motion:'dance'},
    {icon:'🧦',buddy:'🧺',text:'ตามหาถุงเท้าที่หายไปหนึ่งข้าง',motion:'search'},
    {icon:'🪴',buddy:'💧',text:'รดน้ำต้นไม้แล้วคุยกับต้นไม้ต่อ',motion:'water'},
    {icon:'📦',buddy:'🤏',text:'ไลฟ์ขายกล่องเปล่าพร้อมส่งอากาศ',motion:'sell'},
    {icon:'🎮',buddy:'👾',text:'เล่นเกมแพ้แล้วโทษปุ่มทุกปุ่ม',motion:'game'},
    {icon:'🧼',buddy:'🫧',text:'รีวิวสบู่จนฟองเต็มห้องน้ำ',motion:'wash'},
    {icon:'🛒',buddy:'🐈',text:'ซื้อของให้แมว แต่แมวไม่จ่าย',motion:'shop'},
    {icon:'🍳',buddy:'🔥',text:'ทอดไข่หนึ่งฟองแต่เล่าเป็นสารคดี',motion:'fry'},
    {icon:'📸',buddy:'🤳',text:'ถ่ายเซลฟี่ 88 รูป เลือกไม่เสร็จ',motion:'selfie'},
    {icon:'🧹',buddy:'🧸',text:'กวาดบ้านแล้วเจอของเล่นตั้งแต่ปีที่แล้ว',motion:'sweep'},
    {icon:'🧘',buddy:'🧘‍♀️',text:'นั่งสมาธิ… แต่คอยอ่านคอมเมนต์',motion:'meditate'}
  ];
  const skins=['#ffd1ac','#efb98c','#d89467','#f6c69a','#be7958','#e8a97d'];
  const names=['พี่ไลฟ์ยาว','เจ๊พูดไม่พัก','อาจารย์ปากไว','พ่อค้าหน้าจอ','นักรีวิวมือหนึ่ง','คุณครูข้างบ้าน'];
  let W=1,H=1,dpr=1,phase='ready',actor=null,phaseTime=0,talkLeft=5,score=0,combo=0,misses=0,toastLeft=0,audio=null,soundOn=true,talkSoundTimer=0,last=0,spawnWait=0,best=readBest(),runStartBest=best;
  let faceX=0,centerX=0,centerY=0,faceR=0;
  const db=window.MOUTH_PATROL_DB||{};
  const dbUrl=String(db.url||'').trim().replace(/\/$/,''),dbKey=String(db.publishableKey||'').trim();
  const onlineReady=()=>/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(dbUrl)&&dbKey.length>10;
  const playerNameKey='mouthPatrolPlayerName',playerIdKey='mouthPatrolPlayerId';
  function makePlayerId(){if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16);});}
  function getPlayerId(){try{let id=localStorage.getItem(playerIdKey);if(!id){id=makePlayerId();localStorage.setItem(playerIdKey,id);}return id;}catch{return makePlayerId();}}
  let playerId=getPlayerId();
  function readBest(){try{return Math.max(0,Number(localStorage.getItem('mouthPatrolBest'))||0);}catch{return 0;}}
  function saveBest(){const value=Math.floor(score);if(value<=best)return;best=value;try{localStorage.setItem('mouthPatrolBest',String(best));}catch{}}
  function resize(){const rect=canvas.getBoundingClientRect();W=Math.max(1,rect.width);H=Math.max(1,rect.height);dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);updateLayout();draw();}
  function updateLayout(){centerX=W/2;centerY=H*.51;faceR=Math.min(W*.285,H*.31,225);}
  function audioReady(){if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(A)audio=new A();}if(audio&&audio.state==='suspended')audio.resume();}
  function tone(freq=440,duration=.12,wave='sine',volume=.04,endFreq=0){if(!soundOn)return;audioReady();if(!audio)return;const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;o.type=wave;o.frequency.setValueAtTime(freq,now);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),now+duration);g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+duration);}
  function stopTalkingSound(){clearInterval(talkSoundTimer);talkSoundTimer=0;}
  function startTalkingSound(){stopTalkingSound();if(soundOn)talkSoundTimer=setInterval(()=>{if(phase==='talking'){tone(310+Math.random()*90,.11,'triangle',.018,450);setTimeout(()=>tone(260+Math.random()*80,.1,'triangle',.012,210),110);}},620);}
  function showToast(text){const node=$('toast');node.textContent=text;node.classList.add('show');toastLeft=1.25;}
  function hud(){ $('score').textContent=Math.floor(score);$('combo').textContent=`${combo}🔥`;$('misses').textContent=`${misses}/3`;$('clock').textContent=phase==='talking'?`${Math.max(0,talkLeft).toFixed(1)} วิ`:'—';$('clock').classList.toggle('urgent',phase==='talking'&&talkLeft<1.6);$('best').textContent=Math.max(best,Math.floor(score)); }
  function variedRest(){return Math.random()<.36 ? .5+Math.random()*.45 : 1.25+Math.random()*2.1;}
  function newActor(){const act=activities[Math.floor(Math.random()*activities.length)];return{name:names[Math.floor(Math.random()*names.length)],activity:act,restDuration:variedRest(),skin:skins[Math.floor(Math.random()*skins.length)],lip:['#982d51','#742e46','#aa3d57','#683448'][Math.floor(Math.random()*4)],brow:['#442c2c','#302a35','#553928'][Math.floor(Math.random()*3)],glasses:Math.random()<.3,moustache:Math.random()<.35,eye:Math.random()<.5?'big':'sleepy',side:Math.random()<.5?-1:1,blush:Math.random()<.6,voice:0};}
  function startGame(){const name=$('playerName').value.trim().slice(0,18);if(!name){$('playerName').focus();return;}try{localStorage.setItem(playerNameKey,name);}catch{}audioReady();phase='activity';actor=newActor();phaseTime=0;talkLeft=5;score=0;combo=0;misses=0;spawnWait=0;runStartBest=best;faceX=actor.side<0?-faceR*2:W+faceR*2;$('intro').classList.add('hidden');$('ending').classList.add('hidden');showToast(`${actor.activity.icon} ${actor.activity.text}…`);tone(560,.1,'sine');hud();}
  function finish(){saveBest();phase='ended';stopTalkingSound();const record=Math.floor(score)>runStartBest?'🎉 สถิติใหม่ของเครื่องนี้! ':'สถิติสูงสุดของเครื่องนี้ '+best+' คะแนน • ';$('endingFace').textContent=Math.floor(score)>runStartBest?'😲🏆':'😤🩹';$('endingText').textContent=`${record}คะแนนรอบนี้ ${Math.floor(score)} • คอมโบสูงสุด ${combo} • พลาด ${misses} ไลฟ์`;hud();if(!onlineReady()){$('onlineStatus').textContent='อันดับออนไลน์ยังไม่เชื่อม — ตั้งค่า Supabase ก่อน คะแนนรอบนี้ยังไม่ถูกส่ง';}else{$('onlineStatus').textContent='กำลังบันทึกสถิติส่วนตัว…';submitOnlineScore();}tone(210,.45,'sawtooth',.05,65);$('ending').classList.remove('hidden');}
  function renderOnlineScores(rows){const list=$('onlineScores');list.replaceChildren();const onlineBest=$('onlineBest');if(rows.length){onlineBest.textContent=`${String(rows[0].player_name||'ผู้เล่น').slice(0,10)} • ${Number(rows[0].score)||0}`;}else{onlineBest.textContent='ยังไม่มีคะแนน';}if(!rows.length){const li=document.createElement('li');li.textContent='ยังไม่มีคะแนน มาเป็นคนแรกได้เลย!';list.append(li);return;}for(const row of rows){const li=document.createElement('li'),name=document.createElement('span'),points=document.createElement('b');name.textContent=String(row.player_name||'ผู้เล่น').slice(0,18);points.textContent=`${Number(row.score)||0} แต้ม`;li.append(name,points);list.append(li);}}
  async function loadOnlineScores(){if(!onlineReady())return;try{const response=await fetch(`${dbUrl}/rest/v1/mouth_scores?select=player_name,score&order=score.desc,created_at.asc&limit=20`,{headers:{apikey:dbKey}});if(!response.ok)throw new Error(`HTTP ${response.status}`);renderOnlineScores(await response.json());$('onlineStatus').textContent='20 อันดับคะแนนดีที่สุด • คะแนนสูงสุดของแต่ละคน';}catch(error){$('onlineStatus').textContent='โหลดอันดับไม่ได้ ตรวจ URL, key และนโยบายฐานข้อมูล';const li=document.createElement('li');li.textContent='เชื่อมต่อฐานข้อมูลไม่สำเร็จ';$('onlineScores').replaceChildren(li);}}
  async function submitOnlineScore(){if(!onlineReady()||score<1)return;try{const response=await fetch(`${dbUrl}/rest/v1/rpc/submit_mouth_score`,{method:'POST',headers:{apikey:dbKey,'Content-Type':'application/json'},body:JSON.stringify({p_player_id:playerId,p_player_name:$('playerName').value.trim().slice(0,18),p_score:Math.floor(score)})});if(!response.ok)throw new Error(`HTTP ${response.status}`);$('onlineStatus').textContent='บันทึกสถิติที่ดีที่สุดของคุณแล้ว 🏆';await loadOnlineScores();}catch(error){$('onlineStatus').textContent='บันทึกไม่ได้ กรุณาตรวจการตั้งค่าฐานข้อมูล Supabase';}}
  function miss(){misses++;combo=0;phase='miss';phaseTime=0;stopTalkingSound();showToast(['เผลอฟังเพลินไปหน่อย!','อีกคนแล้ว ปากไวจริง ๆ!','เขาพูดจนแบตมือถือจะหมด!'][Math.floor(Math.random()*3)]);tone(190,.26,'square',.045,90);hud();if(misses>=3)setTimeout(finish,650);}
  function nextRound(){actor=newActor();phase='activity';phaseTime=0;talkLeft=5;faceX=actor.side<0?-faceR*2:W+faceR*2;showToast(`${actor.activity.icon} ${actor.activity.text}… ${actor.restDuration<1?'แวบเดียว!':'พักแป๊บ…'}`);}
  function patchMouth(){if(phase!=='talking')return;const mx=centerX,my=centerY+faceR*.43;const hit=Math.abs(faceX-centerX)<faceR*.6&&Math.abs(pointer.y-my)<faceR*.38&&Math.abs(pointer.x-faceX)<faceR*.6;if(!hit){showToast('แตะให้โดนปากตรง ๆ สิ! 👄');tone(250,.06,'sine',.02);return;}phase='patched';phaseTime=0;combo++;score+=100+Math.min(combo,20)*10;stopTalkingSound();showToast(['แปะ! เงียบกริบ 🤫','ติดพลาสเตอร์พอดี! 🩹','ปากพักก่อนนะจ๊ะ! 😤'][Math.floor(Math.random()*3)]);tone(740,.09,'triangle',.06,1000);setTimeout(()=>tone(980,.15,'triangle',.05,1250),70);hud();}
  const pointer={x:0,y:0};
  function update(dt){if(toastLeft>0){toastLeft-=dt;if(toastLeft<=0)$('toast').classList.remove('show');}
    if(phase==='activity'){phaseTime+=dt;if(phaseTime>=actor.restDuration){phase='enter';phaseTime=0;}}
    else if(phase==='enter'){phaseTime+=dt;const p=Math.min(1,phaseTime/.65),ease=1-Math.pow(1-p,3);faceX=actor.side<0?(-faceR*1.8)+(centerX+faceR*1.8)*ease:(W+faceR*1.8)+(centerX-W-faceR*1.8)*ease;if(p>=1){phase='talking';talkLeft=5;actor.voice=0;startTalkingSound();showToast(`${actor.name} เริ่มไลฟ์! แตะปากเลย!`);}}
    else if(phase==='talking'){talkLeft-=dt;actor.voice+=dt*12;if(talkLeft<=0){talkLeft=0;miss();}hud();}
    else if(phase==='patched'){phaseTime+=dt;score+=dt*(35+Math.min(combo,15)*3);if(phaseTime>1.1){saveBest();phase='leave';phaseTime=0;}hud();}
    else if(phase==='leave'){phaseTime+=dt;faceX+=(actor.side<0?-1:1)*dt*(W*.9);if(phaseTime>0.55){phase='waiting';spawnWait=.45+Math.random()*.75;actor=null;}}
    else if(phase==='waiting'){spawnWait-=dt;if(spawnWait<=0)nextRound();}
    else if(phase==='miss'){phaseTime+=dt;if(misses<3&&phaseTime>1.1)nextRound();}
  }
  function rounded(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function background(){const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#4b3b68');g.addColorStop(.53,'#25233c');g.addColorStop(1,'#17182e');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);for(let i=0;i<30;i++){const x=(i*137+W*.04)%W,y=(i*79+H*.07)%H;ctx.globalAlpha=.07;ctx.fillStyle=i%2?'#fff':'#ffc857';ctx.beginPath();ctx.arc(x,y,2+i%3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    // A colorful livestream frame and cheeky live status.
    const frameW=Math.min(W*.8,faceR*3.15),frameH=Math.min(H*.84,faceR*3.15),fx=centerX-frameW/2,fy=centerY-frameH*.56;rounded(fx,fy,frameW,frameH,28,'#211c34','#8e72ba');rounded(fx+8,fy+8,frameW-16,frameH-16,22,'#3a3152','#55466d');
    if(phase==='activity'){const t=phaseTime,fast=actor.restDuration<1,mainSize=Math.min(78,H*.15,W*.19),motion=actor.activity.motion;let bob=Math.sin(t*(motion==='sleep'?2:8))*Math.min(10,H*.018),tilt=Math.sin(t*5)*.08;if(motion==='sleep')bob=Math.sin(t*3)*4;if(motion==='meditate')bob=Math.sin(t*2)*2;if(motion==='dance'||motion==='search'||motion==='feed')tilt=Math.sin(t*11)*.16;
      ctx.textAlign='center';ctx.fillStyle='#fff5cf';ctx.font=`800 ${Math.max(18,Math.min(30,W*.05))}px Prompt, sans-serif`;ctx.fillText(fast?'พักแวบเดียว!':'พักไลฟ์อยู่…',centerX,H*.22);
      const iconY=centerY+faceR*.3;ctx.save();ctx.translate(centerX-mainSize*.48,iconY+bob);ctx.rotate(-tilt);ctx.font=`${mainSize}px sans-serif`;ctx.fillText(actor.activity.icon,0,0);ctx.restore();ctx.save();ctx.translate(centerX+mainSize*.52,iconY-bob*.6);ctx.rotate(tilt*.6);ctx.font=`${mainSize*.84}px sans-serif`;ctx.fillText(actor.activity.buddy,0,0);ctx.restore();
      const labelW=Math.min(W*.88,mainSize*4);rounded(centerX-labelW/2,iconY+mainSize*.27,labelW,Math.max(42,H*.075),14,'#fff5d9','#bd9e64');ctx.fillStyle='#42364e';ctx.font=`700 ${Math.max(13,Math.min(19,W*.032))}px Prompt, sans-serif`;ctx.fillText(actor.activity.text,centerX,iconY+mainSize*.27+Math.max(27,H*.047),labelW-18);
      const restPct=Math.max(0,1-t/actor.restDuration);rounded(centerX-mainSize*.95,iconY+mainSize*.27+Math.max(45,H*.073),mainSize*1.9,6,4,'#605579');rounded(centerX-mainSize*.95,iconY+mainSize*.27+Math.max(45,H*.073),mainSize*1.9*restPct,6,4,fast?'#ffb35c':'#7ee1bd');}
    if(phase==='talking'||phase==='enter'||phase==='patched'||phase==='leave'||phase==='miss'){rounded(fx+14,fy+13,73,28,14,'#ff4d66');ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='800 13px Prompt, sans-serif';ctx.fillText('● LIVE',fx+50,fy+32);ctx.fillStyle='#fceaff';ctx.textAlign='right';ctx.font='600 13px Prompt, sans-serif';ctx.fillText('คนดู 9,999+',fx+frameW-18,fy+32);}
  }
  function drawFace(){if(!actor)return;const r=faceR,cx=faceX,cy=centerY;ctx.save();ctx.translate(cx,cy);const isAngry=phase==='patched'||phase==='leave';const isSad=phase==='miss';
    // Head is completely bald and intentionally bright, so its expression reads at phone size.
    const grad=ctx.createRadialGradient(-r*.35,-r*.48,r*.08,0,0,r*1.2);grad.addColorStop(0,'#fff0cf');grad.addColorStop(.44,actor.skin);grad.addColorStop(1,'#d78a65');ctx.fillStyle=grad;ctx.beginPath();ctx.ellipse(0,0,r*.88,r*1.04,0,0,Math.PI*2);ctx.fill();ctx.lineWidth=Math.max(3,r*.025);ctx.strokeStyle='#fff1d3';ctx.stroke();
    // Bald scalp shine.
    ctx.globalAlpha=.35;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(-r*.28,-r*.68,r*.22,r*.09,-.3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    const eyeY=-r*.17,eyeX=r*.29;ctx.lineWidth=Math.max(2,r*.035);ctx.strokeStyle=actor.brow;ctx.lineCap='round';
    for(const side of [-1,1]){ctx.beginPath();if(isAngry){ctx.moveTo(side*eyeX-r*.13,eyeY-r*.13);ctx.lineTo(side*eyeX+r*.08,eyeY-r*.04);}else if(isSad){ctx.moveTo(side*eyeX-r*.11,eyeY-r*.02);ctx.lineTo(side*eyeX+r*.1,eyeY-r*.08);}else{ctx.moveTo(side*eyeX-r*.12,eyeY-r*.1);ctx.quadraticCurveTo(side*eyeX,eyeY-r*.16,side*eyeX+r*.12,eyeY-r*.08);}ctx.stroke();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(side*eyeX,eyeY,r*.115,r*(actor.eye==='big' ? .13 : .075),0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#342a30';ctx.beginPath();ctx.arc(side*eyeX+r*.01,eyeY+r*.015,r*.05,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(side*eyeX+r*.025,eyeY-r*.005,r*.018,0,Math.PI*2);ctx.fill();}
    if(actor.glasses){ctx.strokeStyle='#483c59';ctx.lineWidth=Math.max(2,r*.025);for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*eyeX,eyeY,r*.17,r*.16,0,0,Math.PI*2);ctx.stroke();}ctx.beginPath();ctx.moveTo(-r*.12,eyeY);ctx.lineTo(r*.12,eyeY);ctx.stroke();}
    // Nose and rosy cheeks.
    ctx.fillStyle='#c97962';ctx.beginPath();ctx.ellipse(0,r*.13,r*.07,r*.1,0,0,Math.PI*2);ctx.fill();if(actor.blush||isAngry){ctx.globalAlpha=isAngry ? 0.65 : 0.32;ctx.fillStyle=isAngry?'#f04454':'#f35e74';for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*r*.53,r*.22,r*.16,r*.085,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
    if(actor.moustache&&!isAngry){ctx.fillStyle='#49312f';ctx.beginPath();ctx.ellipse(0,r*.34,r*.21,r*.075,0,0,Math.PI*2);ctx.fill();}
    // Big speaking mouth target; success covers it with a bright cartoon plaster.
    const mx=0,my=r*.43,mw=r*.52,mh=r*(.25+(!isAngry?Math.abs(Math.sin(actor.voice))*0.09:0));
    if(phase==='patched'||phase==='leave'){ctx.save();ctx.translate(mx,my);ctx.rotate(-.08);rounded(-mw*.62,-mh*.45,mw*1.24,mh*.9,Math.max(5,r*.07),'#ffe36b','#bd7d27');ctx.strokeStyle='#fff8c4';ctx.lineWidth=Math.max(2,r*.025);ctx.beginPath();ctx.moveTo(-mw*.35,0);ctx.lineTo(mw*.35,0);ctx.stroke();ctx.fillStyle='#ac6d20';ctx.font=`800 ${Math.max(9,r*.09)}px Prompt, sans-serif`;ctx.textAlign='center';ctx.fillText('เงียบก่อน!',0,mh*.12);ctx.restore();
    }else if(isAngry||isSad){ctx.strokeStyle=actor.lip;ctx.lineWidth=Math.max(4,r*.055);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-mw*.38,my+mh*.08);ctx.quadraticCurveTo(0,my-mh*.48,mw*.38,my+mh*.08);ctx.stroke();}
    else{ctx.fillStyle='#501e37';ctx.beginPath();ctx.ellipse(mx,my,mw*.58,mh,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff8eb';ctx.beginPath();ctx.ellipse(mx,my-mh*.47,mw*.42,mh*.32,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e95875';ctx.beginPath();ctx.ellipse(mx,my+mh*.52,mw*.28,mh*.32,0,0,Math.PI*2);ctx.fill();}
    if(isAngry){ctx.font=`${Math.max(20,r*.23)}px sans-serif`;ctx.textAlign='center';ctx.fillText('💢',r*.72,-r*.66);}
    if(phase==='talking'){ctx.globalAlpha=.7;ctx.fillStyle='#fff';ctx.font=`800 ${Math.max(14,r*.14)}px Prompt, sans-serif`;ctx.textAlign='center';ctx.fillText('บลา บลา บลา…',0,-r*1.14);ctx.globalAlpha=1;}
    ctx.restore();
  }
  function draw(){if(!W||!H)return;ctx.setTransform(dpr,0,0,dpr,0,0);background();drawFace();if(phase==='talking'){const pct=Math.max(0,talkLeft/5);rounded(W*.22,H*.88,W*.56,12,7,'#302744','#b49bd3');rounded(W*.22,H*.88,W*.56*pct,12,7,pct<.3?'#ff5c6f':'#ffd45d');ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='700 12px Prompt, sans-serif';ctx.fillText('แตะปากก่อนครบ 5 วิ!',W/2,H*.88-9);}if(phase==='patched'){ctx.textAlign='center';ctx.fillStyle='#ffeb95';ctx.font=`800 ${Math.max(16,Math.min(28,W*.05))}px Prompt, sans-serif`;ctx.fillText(`+${Math.ceil(35+Math.min(combo,15)*3)} คะแนน/วิ`,W/2,H*.17);}if(phase==='waiting'){ctx.textAlign='center';ctx.fillStyle='#e5d9f5';ctx.font=`700 ${Math.max(15,Math.min(24,W*.04))}px Prompt, sans-serif`;ctx.fillText('ชู่ว… ไลฟ์ต่อไปกำลังมา',W/2,H*.18);}}
  function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;update(dt);draw();requestAnimationFrame(frame);}
  function onPoint(e){const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;}
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();onPoint(e);if(phase==='talking')patchMouth();else if(phase==='activity'||phase==='enter')showToast('รอให้หน้าเข้าจอก่อน แล้วแตะปาก! 👀');});
  try{$('playerName').value=localStorage.getItem(playerNameKey)||'';}catch{}
  $('profileForm').addEventListener('submit',event=>{event.preventDefault();startGame();});$('againButton').addEventListener('click',startGame);
  $('soundButton').addEventListener('click',()=>{soundOn=!soundOn;$('soundButton').textContent=soundOn?'🔊':'🔇';$('soundButton').setAttribute('aria-pressed',String(soundOn));$('soundButton').setAttribute('aria-label',soundOn?'ปิดเสียง':'เปิดเสียง');if(soundOn){audioReady();tone(650,.1,'triangle');if(phase==='talking')startTalkingSound();}else stopTalkingSound();});
  resize();window.addEventListener('resize',resize);if(window.visualViewport)window.visualViewport.addEventListener('resize',resize);hud();if(onlineReady())loadOnlineScores();else{$('onlineBest').textContent='ตั้งค่าฐานข้อมูล';$('onlineStatus').textContent='อันดับออนไลน์จะเปิดหลังตั้งค่า Supabase';}requestAnimationFrame(frame);
})();
