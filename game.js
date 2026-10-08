(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const mapGeometry=window.GeoRushGeometry;
  const backgrounds=window.GeoRushBackgrounds;
  const ui = Object.fromEntries([
    'menuScreen','hud','pauseScreen','gameOverScreen','settingsScreen','editorScreen','editorFrame','editorButton','pauseEditorButton','startButton','settingsButton','settingsCloseButton','settingsSound','soundVolumeSlider','soundVolumeValue',
    'resumeButton','pauseMenuButton','restartButton','overMenuButton','overKicker','overQuestion','finalBestLabel','restartLabel',
    'best','currentDistance','menuBest','runStatus','hudRecord','hudLevel','levelName','levelProgress',
    'levelsButton','levelsScreen','levelsCloseButton','levelList',
    'finalDistance','finalCrystals','finalBest','finalRecord'
  ].map(id => [id, document.getElementById(id)]));

  const H = 720, GROUND = 560, SIZE = 42, CHUNK = 1500, WAVE_TOP = 150;
  const GRAVITY = 1950, JUMP = -810, WAVE_UP_FACTOR = .88 * 1.15, WAVE_DOWN_FACTOR = .88;
  let W = 1280, playerScreen = 290;
  const worlds = [
    {name:'СТАРТОВЫЙ ГОРОД',sub:'ПРЫЖКИ И БЛОКИ',sky:'#374ba2',sky2:'#283b82',accent:'#e4eaff',danger:'#f98792',ground:'#1b2b68',hill:'#6473bb'},
    {name:'ЗАВОД МЕХАНИЗМОВ',sub:'ШЕСТЕРНИ И ПРУЖИНЫ',sky:'#317f80',sky2:'#246266',accent:'#e3f5e4',danger:'#f8bb7e',ground:'#184c53',hill:'#5d9e9a'},
    {name:'ЗЕРКАЛЬНЫЙ ЗАЛ',sub:'КОЛЬЦА И ПЛАТФОРМЫ',sky:'#65458a',sky2:'#483171',accent:'#f6e6ff',danger:'#f69aaf',ground:'#37275b',hill:'#9271a9'},
    {name:'ОГНЕННАЯ КРЕПОСТЬ',sub:'БАШНИ И ПРОПАСТИ',sky:'#a65c43',sky2:'#7d3f34',accent:'#fff1d3',danger:'#ffd17d',ground:'#59312e',hill:'#bf775e'},
    {name:'ПУСТОТА',sub:'ТОЧНОСТЬ И СКОРОСТЬ',sky:'#653b7e',sky2:'#392b66',accent:'#f7e6fa',danger:'#f9b08d',ground:'#29224f',hill:'#8764a6'}
  ];

  // Hand-built short sections are shuffled and slightly shifted; each zone has its own obstacle vocabulary.
  const patterns = [
    [
      [['spike',170,1],['spike',255,1],['block',690,105,66],['pit',1170,140]],
      [['block',175,100,70],['spike',690,2],['saw',1170,28]],
      [['pad',170],['spike',690,3],['block',1170,135,78]],
      [['pit',170,145],['spike',690,1],['spike',770,2],['platform',1170,150,95]],
      [['miniSpike',170,2],['block',690,110,72],['spikeBlock',1170,95,58]],
      [['spike',170,2],['miniSpike',650,3],['gate',1170,135]],
      [['roller',170,25],['block',690,90,75],['sawPair',1170,23]]
    ],
    [
      [['movingSaw',170,30],['block',690,72,108],['spike',1170,3]],
      [['pad',170],['pit',690,165],['saw',1170,30]],
      [['spike',170,2],['ceilingSpike',400,415],['movingSaw',690,29],['block',1170,75,112]],
      [['block',170,90,64],['block',310,90,91],['saw',770,29],['pit',1170,155]],
      [['miniSpike',170,3],['swingSaw',690,28],['block',1170,80,110]],
      [['pad',170],['hangingBlock',690,105,385],['spikeBlock',1170,90,60]],
      [['sawPair',170,23],['pad',690],['roller',1170,28]]
    ],
    [
      [['spike',170,2],['orb',350,418],['platform',690,150,105],['pit',1170,150]],
      [['highSaw',170,29],['spike',690,3],['ceilingSpike',900,418],['pit',1170,155]],
      [['block',170,130,78],['movingSaw',690,30],['orb',875,405],['pit',1170,150]],
      [['pit',170,150],['spike',690,4],['orb',905,410],['block',1170,115,78]],
      [['hangingBlock',170,105,378],['miniSpike',690,3],['swingSaw',1170,28]],
      [['platform',170,150,105],['gate',690,140],['spikeBlock',1170,100,56]],
      [['fortress',160,0],['saw',1240,40]],
      [['fortress',160,1],['movingSaw',1240,34]],
      [['roller',170,27],['orb',420,410],['spike',690,2],['sawPair',1170,24]]
    ],
    [
      [['pit',170,165],['block',690,70,118],['saw',1170,32]],
      [['spike',170,3],['movingSaw',690,30],['block',1170,120,100]],
      [['block',170,140,88],['pit',690,180],['pad',1170]],
      [['movingSaw',170,32],['spike',690,3],['block',1170,70,115]],
      [['spikeBlock',170,105,60],['pit',690,175],['swingSaw',1170,32]],
      [['block',170,75,115],['miniSpike',690,4],['gate',1170,145]],
      [['fortress',160,1],['swingSaw',1240,33]],
      [['sawPair',170,24],['pit',690,160],['roller',1170,29]]
    ],
    [
      [['block',170,75,112],['pit',690,170],['highSaw',1170,32]],
      [['spike',170,4],['movingSaw',690,31],['platform',1170,150,105]],
      [['pad',170],['block',690,70,120],['saw',1170,32]],
      [['pit',170,165],['spike',690,2],['ceilingSpike',925,415],['block',1170,110,90]],
      [['swingSaw',170,32],['spikeBlock',690,95,68],['pit',1170,170]],
      [['miniSpike',170,4],['gate',690,150],['hangingBlock',1170,115,380]],
      [['fortress',160,0],['gate',1240,140]],
      [['roller',170,29],['block',690,95,110],['sawPair',1170,25]]
    ]
  ];
  const wavePatterns = [
    [['waveFloor',220,185,110],['waveCeil',390,120,90],['waveGate',535,310,88],['waveSaw',840,335,30],['waveFloor',990,110,90],['waveTunnel',1150,395,84,140]],
    [['waveCeil',220,185,110],['waveFloor',390,115,90],['waveTunnel',555,390,90,135],['wavePulse',890,330,29],['waveCeil',1030,105,85],['waveGate',1200,295,88]],
    [['waveSaw',230,425,30],['waveCeil',390,115,95],['waveGate',525,305,86],['waveFloor',825,190,112],['waveSaw',1000,310,26],['waveTunnel',1150,390,84,135]],
    [['waveFloor',220,175,105],['waveCeil',390,120,90],['waveGate',535,385,90],['waveCeil',845,195,112],['waveFloor',1010,105,85],['waveTunnel',1160,305,86,130]],
    [['waveGate',240,365,96],['waveFloor',455,120,95],['waveSaw',680,300,31],['waveCeil',855,125,95],['waveTunnel',1050,285,84,150],['waveFloor',1330,120,90]],
    [['waveFloor',220,190,105],['waveCeil',390,110,85],['waveTunnel',555,315,90,140],['wavePulse',890,350,29],['waveFloor',1035,100,85],['waveGate',1220,400,88]],
    [['waveCeil',220,190,108],['waveFloor',390,105,85],['waveGate',545,390,90],['waveTwin',860,350,27],['waveCeil',1030,115,95],['waveTunnel',1170,300,86,130]],
    [['waveSaw',220,400,27],['waveFloor',390,110,90],['waveTunnel',540,300,90,135],['waveBlock',860,320,92],['waveCeil',1030,110,85],['waveGate',1190,390,88]],
    [['waveFloor',220,170,100],['waveCeil',390,110,85],['waveGate',540,380,86],['waveBlock',850,270,88],['waveFloor',1010,110,90],['waveTunnel',1150,305,86,140]],
    [['waveCeil',220,185,100],['waveFloor',390,110,85],['waveTunnel',545,315,90,140],['wavePulse',875,330,28],['waveCeil',1030,110,90],['waveGate',1200,390,86]],
    [['waveGate',220,350,95],['waveBlock',430,240,85],['waveCeil',690,175,105],['wavePulse',935,395,28],['waveTunnel',1150,310,85,135],['waveFloor',1350,90,80]],
    [['waveFloor',220,175,100],['waveSaw',405,285,26],['waveTunnel',570,380,90,140],['waveTwin',895,345,27],['waveCeil',1050,110,85],['waveGate',1240,300,90]],
    [['waveCeil',220,175,105],['waveSaw',395,445,27],['waveGate',560,305,88],['waveBlock',850,330,95],['waveFloor',1010,110,85],['waveTunnel',1170,395,84,135]],
    [['wavePulse',220,330,26],['waveFloor',405,125,100],['waveTunnel',565,345,88,135],['waveCeil',860,175,105],['waveSaw',1040,375,27],['waveGate',1230,390,88]],
    [['waveFloor',220,170,105],['waveDiamond',405,330,32],['waveGate',565,305,90],['waveOrbit',850,360,18],['waveCeil',1030,110,85],['waveTunnel',1190,395,86,130]],
    [['waveCeil',220,175,105],['waveSlider',410,400,27],['waveTunnel',560,390,88,135],['waveDiamond',865,280,30],['waveFloor',1030,110,85],['waveGate',1210,300,88]],
    [['waveGate',230,350,92],['waveOrbit',455,330,18],['waveFloor',710,145,100],['waveSlider',905,260,26],['waveTunnel',1130,305,84,140],['waveCeil',1350,95,80]],
    [['waveFloor',220,175,105],['waveDiamond',420,420,30],['waveTunnel',570,315,88,135],['waveOrbit',875,355,18],['waveCeil',1040,110,85],['waveGate',1230,390,88]]
  ];
  // Spider only occupies the two rails. Every pattern asks for several deliberate lane changes.
  const spiderPatterns = [
    [['spiderSpike',310,'bottom',92],['spiderBlock',540,'top',82],['spiderSaw',770,'bottom',27],['spiderSpike',1000,'top',108],['spiderBlock',1250,'bottom',85]],
    [['spiderBlock',310,'top',90],['spiderSpike',525,'bottom',112],['spiderSaw',760,'top',28],['spiderBlock',1000,'bottom',95],['spiderSpike',1250,'top',88]],
    [['spiderSaw',300,'bottom',27],['spiderSpike',535,'top',105],['spiderBlock',770,'bottom',80],['spiderSaw',1005,'top',29],['spiderSpike',1250,'bottom',90]],
    [['spiderSpike',300,'top',100],['spiderSaw',535,'bottom',28],['spiderBlock',770,'top',85],['spiderSpike',1010,'bottom',105],['spiderSaw',1250,'top',27]],
    [['spiderBlock',300,'bottom',88],['spiderSaw',540,'top',27],['spiderSpike',790,'bottom',92],['spiderBlock',1030,'top',90],['spiderSaw',1270,'bottom',29]],
    [['spiderSaw',310,'top',27],['spiderBlock',550,'bottom',90],['spiderSpike',790,'top',100],['spiderSaw',1020,'bottom',28],['spiderBlock',1260,'top',85]],
    [['spiderSpike',310,'bottom',90],['spiderSaw',545,'top',28],['spiderBlock',780,'bottom',82],['spiderSpike',1020,'top',100],['spiderSaw',1260,'bottom',27]],
    [['spiderBlock',300,'top',82],['spiderSaw',535,'bottom',29],['spiderSpike',775,'top',94],['spiderBlock',1015,'bottom',90],['spiderSpike',1255,'top',102]]
  ];
  let state = 'menu', worldX = 250, y = GROUND - SIZE, vy = 0, grounded = true, rotation = 0;
  let speed = 370, distance = 0, best = readBest(), collected = 0;
  let chunkIndex = 0, nextChunkX = 650, lastWavePattern = -1, lastSpiderPattern = -1, obstacles = [], portals = [], crystals = [], particles = [], trail = [];
  let held = false, jumpBuffer = 0, coyote = 0, palette = {...worlds[0]}, themeIndex = 0;
  let previousTheme = 0, motifBlend = 1;
  let themeSequence = [], lastThemeCycle = [], specialModes = [], playerMode = 'cube', spiderLane = 'bottom', modeFlash = 0;
  let customMap = null;
  let backgroundSeed=1,backgroundSequence=[],backgroundKey='',activeBackground=null,oldBackground=null,backgroundBlend=1;
  let backgroundWarmup=null;
  let cubeTurnStart=0,cubeTurnTarget=0,cubeTurnProgress=1;
  let awaitingEditorMap=new URLSearchParams(location.hash.slice(1)).has('editor-play');
  let settingsOpen = false;
  let clock = 0, lastTime = 0, shake = 0, seed = 1;
  let soundOn = readSoundOn(), soundVolume = readSoundVolume();

  function playSfx(kind){window.GeoRushAudio.play(kind)}

  function rgb(hex){
    return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  }
  function fadeColor(from,to,t){
    const a=rgb(from),b=rgb(to);
    return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('');
  }
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
  function themeForSection(section){
    while(themeSequence.length<=section){
      const next=worlds.map((_,i)=>i);
      for(let i=next.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[next[i],next[j]]=[next[j],next[i]]}
      if(!themeSequence.length&&next.every((value,i)=>value===lastThemeCycle[i]))[next[0],next[1]]=[next[1],next[0]];
      if(themeSequence.length&&next[0]===themeSequence[themeSequence.length-1]){
        const swap=1+Math.floor(random()*(next.length-1));[next[0],next[swap]]=[next[swap],next[0]];
      }
      if(!themeSequence.length)lastThemeCycle=[...next];
      themeSequence.push(...next);
    }
    return themeSequence[section];
  }
  function chunkAt(x){return Math.floor(Math.max(0,x-650)/CHUNK)}
  function modeForChunk(index){
    if(customMap)return customMap.sections[index]?.mode||customMap.sections.at(-1).mode;
    const block=Math.floor(index/6);
    const forms=['cube','wave','spider'];
    while(specialModes.length<=block){
      const previous=specialModes.at(-1);
      const choices=previous?forms.filter(form=>form!==previous):forms;
      specialModes.push(choices[Math.floor(random()*choices.length)]);
    }
    return specialModes[block];
  }
  function pad(n){return String(Math.max(0,Math.floor(n))).padStart(4,'0')}
  function readBest(){try{const value=Number(localStorage.getItem('georush-best')||0);return Number.isFinite(value)&&value>0?value:0}catch{return 0}}
  function readSoundOn(){try{return localStorage.getItem('georush-sound-on')!=='false'}catch{return true}}
  function readSoundVolume(){try{const raw=localStorage.getItem('georush-sound-volume');if(raw===null)return 1;const value=Number(raw);return Number.isFinite(value)?Math.max(0,Math.min(1,value)):1}catch{return 1}}
  function writeBest(){try{localStorage.setItem('georush-best',String(best))}catch{}}
  function camera(){return worldX-playerScreen}
  function setVisible(el,on){el.classList.toggle('is-hidden',!on)}

  function resize(){
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(innerWidth*dpr));
    canvas.height=Math.max(1,Math.round(innerHeight*dpr));
    const scale=canvas.height/H;
    W=canvas.width/scale;
    playerScreen=Math.min(290,W*.27);
    ctx.setTransform(scale,0,0,scale,0,0);
  }

  function resetWorld(){
    seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;
    backgroundSeed=seed^0x6c8e9cf5;backgroundSequence=[];
    worldX=250;y=GROUND-SIZE;vy=0;grounded=true;rotation=0;speed=370;distance=0;collected=0;
    chunkIndex=0;nextChunkX=650;lastWavePattern=-1;lastSpiderPattern=-1;obstacles=[];portals=[];crystals=[];particles=[];trail=[];
    held=false;jumpBuffer=0;coyote=0;shake=0;themeSequence=[];specialModes=[];themeIndex=customMap?.sections[0]?.theme??themeForSection(0);previousTheme=themeIndex;motifBlend=1;palette={...worlds[themeIndex]};
    playerMode=modeForChunk(0);spiderLane='bottom';
    y=playerMode==='wave'?310:GROUND-SIZE;
    grounded=playerMode==='cube';modeFlash=0;
    cubeTurnStart=0;cubeTurnTarget=0;cubeTurnProgress=1;
    backgroundKey=backgroundForChunk(0);activeBackground=backgrounds.resolve(backgroundKey,customMap?.backgrounds);oldBackground=activeBackground;backgroundBlend=1;
    if(customMap)clock=0;
    generateAhead();updateHud();prepareNextBackground(0);
  }
  function backgroundForChunk(index){
    if(customMap){const section=customMap.sections[Math.min(index,customMap.sections.length-1)];return section.background||backgrounds.defaults[section.theme??themeIndex]}
    const group=Math.floor(index/3);
    while(backgroundSequence.length<=group){
      const next=backgrounds.presets.map(bg=>bg.id);
      const nextRandom=()=>{backgroundSeed=(Math.imul(backgroundSeed,1664525)+1013904223)>>>0;return backgroundSeed/4294967296};
      for(let i=next.length-1;i>0;i--){const j=Math.floor(nextRandom()*(i+1));[next[i],next[j]]=[next[j],next[i]]}
      if(next[0]===backgroundSequence.at(-1))[next[0],next[1]]=[next[1],next[0]];
      backgroundSequence.push(...next);
    }
    return backgroundSequence[group];
  }
  function beginCubeTurn(){cubeTurnStart=rotation;cubeTurnTarget+=Math.PI/2;cubeTurnProgress=0}
  function prepareNextBackground(index){
    if(!window.GeoRushBackdropArt)return;
    if(backgroundWarmup){if(backgroundWarmup.idle)window.cancelIdleCallback(backgroundWarmup.id);else clearTimeout(backgroundWarmup.id)}
    const next=backgrounds.resolve(backgroundForChunk(index+(customMap?1:3)),customMap?.backgrounds);
    const prepare=()=>{backgroundWarmup=null;if(next.scene!=='image')window.GeoRushBackdropArt.prepare(next)};
    backgroundWarmup=window.requestIdleCallback?{idle:true,id:window.requestIdleCallback(prepare,{timeout:1500})}:{idle:false,id:setTimeout(prepare,180)};
  }
  function addObstacle(kind,x,a,b,theme,extra){
    if(kind==='fortress'){addFortress(x,a,theme);return}
    if(kind==='spiderSpike'||kind==='spiderBlock')obstacles.push({kind,x,lane:a,width:b,height:kind==='spiderBlock'?62:48,theme});
    else if(kind==='spiderSaw')obstacles.push({kind,x,lane:a,radius:b,width:b*2,theme});
    else if(kind==='waveFloor'||kind==='waveCeil')obstacles.push({kind,x,width:a,height:b,theme});
    else if(kind==='waveSaw')obstacles.push({kind,x,y:a,radius:b,width:b*2,theme});
    else if(kind==='waveDiamond')obstacles.push({kind,x,y:a,radius:b,width:b*2,theme});
    else if(kind==='waveSlider')obstacles.push({kind,x,y:a,radius:b,width:b*2+100,theme});
    else if(kind==='waveOrbit')obstacles.push({kind,x,y:a,radius:b,orbit:50,width:(b+50)*2,theme});
    else if(kind==='wavePulse'||kind==='waveTwin')obstacles.push({kind,x,y:a,radius:b,width:b*2,theme});
    else if(kind==='waveBlock')obstacles.push({kind,x,y:a,width:b,height:84,theme});
    else if(kind==='waveGate')obstacles.push({kind,x,gapY:a,gapHalf:b+12,width:50,theme});
    else if(kind==='waveTunnel')obstacles.push({kind,x,gapY:a,gapHalf:b+12,width:extra||140,theme});
    else if(kind==='spike')obstacles.push({kind,x,count:a,theme,width:a*40});
    else if(kind==='miniSpike')obstacles.push({kind,x,count:a,theme,width:a*34});
    else if(kind==='block'||kind==='platform')obstacles.push({kind,x,width:a,height:b,theme});
    else if(kind==='spikeBlock')obstacles.push({kind,x,width:a,height:b,theme});
    else if(kind==='hangingBlock')obstacles.push({kind,x,width:a,y:b,height:55,theme});
    else if(kind==='gate')obstacles.push({kind,x,width:32,height:a,theme});
    else if(kind==='pit')obstacles.push({kind,x,width:a,theme});
    else if(kind==='pad')obstacles.push({kind,x,width:72,theme,used:false});
    else if(kind==='ceilingSpike')obstacles.push({kind,x,y:a,width:42,height:48,theme});
    else if(kind==='orb')obstacles.push({kind,x,y:a,width:44,theme,used:false});
    else if(kind==='swingSaw')obstacles.push({kind,x,radius:a,theme,width:a*2+100});
    else if(kind==='roller')obstacles.push({kind,x,radius:a,theme,width:a*2+80});
    else if(kind==='sawPair')obstacles.push({kind,x,radius:a,theme,width:a*2+90});
    else obstacles.push({kind,x,radius:a,theme,width:a*2});
    return obstacles.at(-1);
  }
  function addFortress(x,variant,theme){
    const steps=variant===0
      ? [['block',0,220,55],['spikeBlock',220,80,55],['block',300,230,95],['spikeBlock',530,80,95],['block',610,220,120]]
      : [['block',0,220,100],['spikeBlock',220,80,70],['block',300,230,65],['spikeBlock',530,80,65],['block',610,220,95]];
    for(const [kind,offset,width,height] of steps){
      addObstacle(kind,x+offset,width,height,theme);
      obstacles[obstacles.length-1].fortress=true;
    }
    crystals.push({x:x+375,y:GROUND-175,phase:random()*6.28,taken:false});
    crystals.push({x:x+690,y:GROUND-205,phase:random()*6.28,taken:false});
  }
  function generateAhead(){
    if(customMap){
      while(chunkIndex<customMap.sections.length&&nextChunkX<worldX+Math.max(2400,W+700)){
        const section=customMap.sections[chunkIndex];
        if(chunkIndex>0&&section.mode!==customMap.sections[chunkIndex-1].mode)portals.push({x:nextChunkX,to:section.mode,used:false});
        const family=section.theme??themeForSection(Math.floor(chunkIndex/3));
        for(const item of section.objects)window.GeoRushMap.placeInGame(item,section.mode,nextChunkX,family,addObstacle);
        nextChunkX+=CHUNK;chunkIndex++;
      }
      obstacles.sort((a,b)=>a.x-b.x);
      return;
    }
    while(nextChunkX<worldX+Math.max(2400,W+700)){
      if(chunkIndex>0&&modeForChunk(chunkIndex)!==modeForChunk(chunkIndex-1))portals.push({x:nextChunkX,to:modeForChunk(chunkIndex),used:false});
      const family=themeForSection(Math.floor(chunkIndex/3));
      const mode=modeForChunk(chunkIndex),wave=mode==='wave',spider=mode==='spider';
      const choices=wave?wavePatterns:spider?spiderPatterns:patterns[family];
      let patternIndex=Math.floor(random()*choices.length);
      if(wave&&patternIndex===lastWavePattern)patternIndex=(patternIndex+1+Math.floor(random()*(choices.length-1)))%choices.length;
      if(spider&&patternIndex===lastSpiderPattern)patternIndex=(patternIndex+1+Math.floor(random()*(choices.length-1)))%choices.length;
      if(wave)lastWavePattern=patternIndex;
      if(spider)lastSpiderPattern=patternIndex;
      const template=choices[patternIndex];
      for(const [kind,offset,a,b,extra] of template){
        const drift=Math.round((random()-.5)*48);
        const x=nextChunkX+offset+drift;
        addObstacle(kind,x,a,b,family,extra);
        if(mode==='cube'&&!['orb','ceilingSpike','hangingBlock','gate','fortress'].includes(kind)&&random()<.56){
          const cy=kind==='block'?GROUND-b-55:kind==='platform'?GROUND-b-48:GROUND-135;
          crystals.push({x:x+Math.max(85,(a||50)*.55),y:cy,phase:random()*6.28,taken:false});
        }
      }
      if(wave){
        if(random()<.72)crystals.push({x:nextChunkX+1370,y:330+Math.round((random()-.5)*70),phase:random()*6.28,taken:false});
      }else if(spider){
        if(random()<.7)crystals.push({x:nextChunkX+1410,y:random()<.5?WAVE_TOP+SIZE/2:GROUND-SIZE/2,phase:random()*6.28,taken:false});
      }else if(random()<.6)crystals.push({x:nextChunkX+1400,y:GROUND-90,phase:random()*6.28,taken:false});
      nextChunkX+=CHUNK;chunkIndex++;
    }
  }

  function startRun(){
    document.activeElement?.blur?.();
    closeSettings();
    resetWorld();state='playing';
    setVisible(ui.menuScreen,false);setVisible(ui.levelsScreen,false);setVisible(ui.pauseScreen,false);setVisible(ui.gameOverScreen,false);setVisible(ui.hud,true);
    updateHud();
    playSfx('start');
  }
  function startCustomRun(raw){
    const map=window.GeoRushMap?.normalize(raw);
    if(!map)return;
    customMap=map;setVisible(ui.editorScreen,false);startRun();
  }
  function openEditor(){
    if(state==='playing')pause();
    if(state!=='menu'&&state!=='paused')return;
    closeSettings();setVisible(ui.editorScreen,true);
  }
  function closeEditor(){setVisible(ui.editorScreen,false);if(state==='paused')ui.resumeButton.focus();else if(state==='menu')ui.editorButton.focus()}
  function openLevels(){
    if(state!=='menu')return;
    closeSettings();state='levels';held=false;setVisible(ui.menuScreen,false);setVisible(ui.levelsScreen,true);ui.levelsCloseButton.focus();
  }
  function closeLevels(){state='menu';setVisible(ui.levelsScreen,false);setVisible(ui.menuScreen,true);ui.levelsButton.focus()}
  function buildLevelList(){
    for(const [index,level] of window.GeoRushLevels.entries()){
      const card=document.createElement('article');card.className='official-level';card.style.setProperty('--level-color',level.color);
      const number=document.createElement('div');number.className='level-number';number.textContent=String(index+1).padStart(2,'0');
      const copy=document.createElement('div');copy.className='level-copy';
      const tag=document.createElement('small');tag.textContent=level.difficulty+' · '+level.map.sections.length+' СЕКЦИЙ';
      const title=document.createElement('h3');title.textContent=level.name;
      const description=document.createElement('p');description.textContent=level.description;copy.append(tag,title,description);
      const actions=document.createElement('div');actions.className='level-actions';
      const play=document.createElement('button');play.type='button';play.className='level-play';play.dataset.uiSound='none';play.textContent='▶ ИГРАТЬ';play.addEventListener('click',()=>startCustomRun(level.map));
      const edit=document.createElement('button');edit.type='button';edit.className='level-edit';edit.textContent='✎ В РЕДАКТОР';edit.addEventListener('click',()=>{returnMenu();ui.editorFrame.src='./editor.html?embedded=1&level='+encodeURIComponent(level.id);openEditor()});
      actions.append(play,edit);card.append(number,copy,actions);ui.levelList.append(card);
    }
  }
  function returnMenu(){
    state='menu';held=false;customMap=null;closeEditor();closeSettings();resetWorld();
    setVisible(ui.menuScreen,true);setVisible(ui.levelsScreen,false);setVisible(ui.pauseScreen,false);setVisible(ui.gameOverScreen,false);setVisible(ui.hud,false);
    ui.menuBest.innerHTML=Math.floor(best)+' <small>м</small>';
  }
  function pause(){if(state!=='playing')return;state='paused';held=false;setVisible(ui.pauseScreen,true)}
  function resume(){if(state!=='paused')return;document.activeElement?.blur?.();state='playing';setVisible(ui.pauseScreen,false)}
  function gameOver(){
    if(state!=='playing')return;
    state='over';held=false;shake=18;burst(playerScreen+SIZE/2,y+SIZE/2,45,palette.accent);
    playSfx('death');
    const isNewRecord=!customMap&&distance>best;
    if(isNewRecord){best=distance;writeBest()}
    ui.finalDistance.textContent=pad(distance);ui.finalCrystals.textContent=String(collected);
    ui.finalBest.textContent=customMap?customMap.name:pad(best)+' М';ui.finalBestLabel.textContent=customMap?'КАРТА':'РЕКОРД';
    ui.overKicker.textContent=customMap?'КАРТА НЕ ПРОЙДЕНА':'ЗАБЕГ ЗАВЕРШЁН';ui.overQuestion.textContent=customMap?'Попробуешь снова?':'Ещё один раз?';
    ui.restartLabel.textContent=customMap?'ИГРАТЬ СНОВА':'НОВЫЙ ЗАБЕГ';ui.finalRecord.textContent='НОВЫЙ РЕКОРД';setVisible(ui.finalRecord,isNewRecord);
    updateHud();setVisible(ui.gameOverScreen,true);
  }
  function completeCustomMap(){
    if(state!=='playing'||!customMap)return;
    state='over';held=false;playSfx('start');
    ui.finalDistance.textContent=pad(distance);ui.finalCrystals.textContent=String(collected);
    ui.finalBest.textContent=customMap.name;ui.finalBestLabel.textContent='КАРТА';
    ui.overKicker.textContent='КАРТА ПРОЙДЕНА';ui.overQuestion.textContent='Готово!';
    ui.restartLabel.textContent='ИГРАТЬ СНОВА';setVisible(ui.finalRecord,false);setVisible(ui.gameOverScreen,true);
  }
  function updateHud(){
    setVisible(ui.hudRecord,!customMap);setVisible(ui.hudLevel,!!customMap);
    if(customMap){ui.levelName.textContent=customMap.name;ui.levelProgress.textContent=String(Math.min(100,Math.floor(Math.max(0,worldX-250)/(400+customMap.sections.length*CHUNK-56)*100)))}
    ui.best.textContent=pad(Math.max(best,distance));
    ui.currentDistance.textContent=pad(distance);
    if(playerMode==='wave'){
      ui.runStatus.textContent='ДЕРЖИ — ВВЕРХ · ОТПУСТИ — ВНИЗ';
    }else if(playerMode==='spider'){
      ui.runStatus.textContent='НАЖМИ — ПЕРЕЙТИ НА ДРУГУЮ СТОРОНУ';
    }else{
      const upcoming=obstacles.find(o=>o.x>worldX&&o.x-worldX<210&&['orb','pad','gate'].includes(o.kind));
      ui.runStatus.textContent=upcoming?.kind==='orb'?'КОЛЬЦО: НАЖМИ В ПОЛЁТЕ':upcoming?.kind==='pad'?'ПРУЖИНА ПОДБРОСИТ ТЕБЯ':upcoming?.kind==='gate'?'ВОРОТА ОТКРЫВАЮТСЯ ПО ЦИКЛУ':'ДЕРЖИ РИТМ';
    }
  }

  function syncSoundButtons(){
    window.GeoRushAudio.configure(soundOn,soundVolume);
    ui.settingsSound.checked=soundOn;
  }
  function openSettings(){
    if(state!=='menu')return;
    settingsOpen=true;ui.soundVolumeSlider.value=String(Math.round(soundVolume*100));
    ui.soundVolumeValue.textContent=Math.round(soundVolume*100)+'%';
    syncSoundButtons();setVisible(ui.settingsScreen,true);ui.settingsCloseButton.focus();
  }
  function closeSettings(){settingsOpen=false;setVisible(ui.settingsScreen,false);document.activeElement?.blur?.()}

  function inputDown(){
    if(settingsOpen)return;
    if(state==='menu'||state==='over'){startRun();return}
    if(state==='paused'){resume();return}
    if(state==='playing'){
      if(playerMode==='wave'){held=true;return}
      if(playerMode==='spider'){
        spiderLane=spiderLane==='bottom'?'top':'bottom';
        y=spiderLane==='top'?WAVE_TOP:GROUND-SIZE;
        trail=[];burst(playerScreen+SIZE/2,y+SIZE/2,12,palette.accent);playSfx('spider');
        return;
      }
      if(!grounded){
        const orb=obstacles.find(o=>!o.used&&(o.kind==='orb'&&Math.abs(o.x+22-(worldX+SIZE/2))<47&&Math.abs(o.y-(y+SIZE/2))<62||o.kind==='mapObject'&&mapParts(o).some(part=>part.role==='orb'&&mapGeometry.rectHit(part,worldX-12,y-18,SIZE+24,SIZE+36))));
        if(orb){orb.used=true;vy=-835;held=false;jumpBuffer=0;beginCubeTurn();burst(playerScreen+SIZE/2,y+SIZE/2,14,'#ffe6a4');playSfx('orb');return}
      }
      held=true;jumpBuffer=.14;
    }
  }
  function inputUp(){held=false}
  window.addEventListener('keydown',e=>{
    if(e.code==='Escape'){e.preventDefault();if(settingsOpen)closeSettings();else if(state==='levels')closeLevels();else if(state==='playing')pause();else if(state==='paused')resume();else if(state==='over')returnMenu();return}
    if(['Space','ArrowUp','KeyW'].includes(e.code)){
      if(settingsOpen)return;
      if(state!=='playing'&&e.target instanceof HTMLElement&&e.target.tagName==='BUTTON')return;
      e.preventDefault();if(!e.repeat)inputDown();
    }
  });
  window.addEventListener('keyup',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code))inputUp()});
  window.addEventListener('pointerup',inputUp);
  window.addEventListener('blur',inputUp);
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(state==='playing')inputDown()});
  ui.settingsButton.addEventListener('click',openSettings);
  ui.settingsCloseButton.addEventListener('click',closeSettings);
  ui.settingsSound.addEventListener('change',()=>{
    soundOn=ui.settingsSound.checked;syncSoundButtons();
    try{localStorage.setItem('georush-sound-on',String(soundOn))}catch{}
    if(soundOn)playSfx('menuConfirm');
  });
  ui.soundVolumeSlider.addEventListener('input',()=>{
    soundVolume=Number(ui.soundVolumeSlider.value)/100;
    window.GeoRushAudio.configure(soundOn,soundVolume);
    ui.soundVolumeValue.textContent=ui.soundVolumeSlider.value+'%';
    try{localStorage.setItem('georush-sound-volume',String(soundVolume))}catch{}
  });
  ui.soundVolumeSlider.addEventListener('change',()=>playSfx('menuChange'));
  ui.startButton.addEventListener('click',startRun);
  ui.levelsButton.addEventListener('click',openLevels);
  ui.levelsCloseButton.addEventListener('click',closeLevels);
  ui.editorButton.addEventListener('click',openEditor);
  ui.pauseEditorButton.addEventListener('click',openEditor);
  window.addEventListener('message',event=>{
    if(awaitingEditorMap&&event.source===window.opener&&event.data?.type==='georush-editor-play'){
      awaitingEditorMap=false;startCustomRun(event.data.map);window.history.replaceState(null,'',location.href.split('#')[0]);return;
    }
    if(event.source!==ui.editorFrame.contentWindow)return;
    if(event.data?.type==='georush-editor-close')closeEditor();
    if(event.data?.type==='georush-editor-play')startCustomRun(event.data.map);
  });
  ui.resumeButton.addEventListener('click',resume);
  ui.pauseMenuButton.addEventListener('click',returnMenu);
  ui.restartButton.addEventListener('click',startRun);
  ui.overMenuButton.addEventListener('click',returnMenu);

  function burst(x,py,n,color){
    for(let i=0;i<n;i++){
      const a=random()*Math.PI*2,s=50+random()*300;
      particles.push({x,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+random()*.55,max:.85,size:2+random()*5,color});
    }
  }
  function mapParts(o){
    if(o.mapClock!==clock){o.mapClock=clock;o.mapParts=mapGeometry.parts(o.mapItem,o.mapMode,o.mapBaseX,clock)}
    return o.mapParts;
  }
  function mapCubeHit(o){
    if(o.mapItem.kind==='gate'&&!gateActive(o))return false;
    return mapParts(o).some(part=>!['orb','pad'].includes(part.role)&&mapGeometry.rectHit(part,worldX+6,y+5,SIZE-12,SIZE-10));
  }
  function isPitAt(x){return obstacles.some(o=>o.kind==='pit'&&x>o.x+3&&x<o.x+o.width-3||o.kind==='mapObject'&&mapParts(o).some(part=>part.role==='pit'&&mapGeometry.inside(part.points,x,GROUND+1)))}
  function overlapX(o){return worldX+SIZE-5>o.x&&worldX+5<o.x+o.width}
  function gateActive(o){return Math.sin(clock*2.6+o.x*.012)>.15}
  function sawCenterX(o){
    if(o.kind==='swingSaw')return o.x+o.radius+50+Math.sin(clock*2.2+o.x*.01)*42;
    if(o.kind==='roller')return o.x+o.radius+40+Math.sin(clock*2.6+o.x*.009)*36;
    return o.x+o.radius;
  }
  function hazardHit(o){
    const left=worldX+6,right=worldX+SIZE-6,top=y+5,bottom=y+SIZE-4;
    if(o.kind==='spike'){
      const base=o.baseY??GROUND,step=o.step??40;
      for(let i=0;i<o.count;i++){
        const sx=o.x+i*step;
        if(right>sx+9&&left<sx+31&&bottom>base-31&&top<base-3)return true;
      }
    } else if(o.kind==='miniSpike'){
      const base=o.baseY??GROUND,step=o.step??34;
      for(let i=0;i<o.count;i++){
        const sx=o.x+i*step;
        if(right>sx+7&&left<sx+step-7&&bottom>base-22&&top<base-3)return true;
      }
    } else if(o.kind==='spikeBlock'){
      return right>o.x+5&&left<o.x+o.width-5&&bottom>GROUND-o.height-31&&top<GROUND-4;
    } else if(o.kind==='hangingBlock'){
      return right>o.x+5&&left<o.x+o.width-5&&bottom>o.y+5&&top<o.y+o.height-5;
    } else if(o.kind==='gate'){
      return gateActive(o)&&right>o.x+4&&left<o.x+o.width-4&&bottom>GROUND-o.height&&top<GROUND;
    } else if(o.kind==='ceilingSpike'){
      return right>o.x+8&&left<o.x+34&&top<o.y+o.height-7&&bottom>o.y+8;
    } else if(o.kind==='saw'||o.kind==='highSaw'||o.kind==='movingSaw'||o.kind==='swingSaw'||o.kind==='roller'||o.kind==='sawPair'){
      if(o.kind==='sawPair')return [o.x+o.radius,o.x+o.radius+90].some(cx=>{
        const nx=Math.max(left,Math.min(cx,right)),ny=Math.max(top,Math.min(GROUND-29,bottom));
        return (cx-nx)**2+(GROUND-29-ny)**2<(o.radius-5)**2;
      });
      const cx=sawCenterX(o),cy=sawY(o);
      const nx=Math.max(left,Math.min(cx,right)),ny=Math.max(top,Math.min(cy,bottom));
      return (cx-nx)**2+(cy-ny)**2<(o.radius-5)**2;
    }
    return false;
  }
  function updatePhysics(dt){
    speed=Math.min(485,400+distance*.036);
    const oldBottom=y+SIZE;
    coyote=grounded?.085:Math.max(0,coyote-dt);
    jumpBuffer=Math.max(0,jumpBuffer-dt);
    if((held||jumpBuffer>0)&&coyote>0){
      vy=JUMP;grounded=false;coyote=0;jumpBuffer=0;
      beginCubeTurn();
      burst(playerScreen+SIZE/2,oldBottom,8,palette.accent);
      playSfx('jump');
    }
    worldX+=speed*dt;
    vy+=GRAVITY*dt;
    y+=vy*dt;
    grounded=false;

    // Landing is resolved before side collisions, so block tops are safe surfaces.
    if(vy>=0){
      let landing=Infinity;
      for(const o of obstacles){
        if(o.kind==='mapObject'){
          landing=Math.min(landing,mapGeometry.landing(mapParts(o),worldX+6,worldX+SIZE-6,oldBottom,y+SIZE));
          continue;
        }
        if(o.kind!=='block'&&o.kind!=='platform')continue;
        if(!overlapX(o))continue;
        const top=o.y??GROUND-o.height;
        if(oldBottom<=top+8&&y+SIZE>=top&&top<landing)landing=top;
      }
      if(!isPitAt(worldX+SIZE/2)&&oldBottom<=GROUND+12&&y+SIZE>=GROUND)landing=Math.min(landing,GROUND);
      if(landing<Infinity){
        const impact=vy;
        y=landing-SIZE;vy=0;grounded=true;
        if(impact>260)playSfx('land');
      }
    }

    for(const o of obstacles){
      if(o.x>worldX+SIZE+50)break;
      if(o.x+o.width<worldX-50)continue;
      if(o.kind==='mapObject'){
        if(mapCubeHit(o)){gameOver();return}
        if(!o.used&&mapParts(o).some(part=>part.role==='pad'&&mapGeometry.rectHit(part,worldX,y,SIZE,SIZE))){o.used=true;vy=-930;grounded=false;beginCubeTurn();playSfx('pad');burst(playerScreen+SIZE/2,y+SIZE,18,palette.accent)}
        continue;
      }
      if(o.kind==='block'&&overlapX(o)){
        const top=o.y??GROUND-o.height,bottom=o.y===undefined?GROUND:o.y+o.height;
        if(y+SIZE>top+5&&y<bottom-3){gameOver();return}
      }
      if((o.kind==='spike'||o.kind==='miniSpike'||o.kind==='spikeBlock'||o.kind==='hangingBlock'||o.kind==='gate'||o.kind==='saw'||o.kind==='highSaw'||o.kind==='movingSaw'||o.kind==='swingSaw'||o.kind==='roller'||o.kind==='sawPair'||o.kind==='ceilingSpike')&&hazardHit(o)){gameOver();return}
      if(o.kind==='pad'&&!o.used&&grounded&&worldX+SIZE/2>o.x&&worldX+SIZE/2<o.x+o.width){
        o.used=true;vy=-930;grounded=false;burst(playerScreen+SIZE/2,GROUND-5,18,worlds[o.theme].accent);
        beginCubeTurn();
        playSfx('pad');
      }
    }
    if(y>H+90){gameOver();return}
    if(cubeTurnProgress<1){
      cubeTurnProgress=Math.min(1,cubeTurnProgress+dt/.72);
      const turn=cubeTurnProgress*cubeTurnProgress*(3-2*cubeTurnProgress);
      rotation=cubeTurnStart+(cubeTurnTarget-cubeTurnStart)*turn;
    }
    finishProgress();
  }
  function circleRectHit(cx,cy,r,rx,ry,rw,rh){
    const nx=Math.max(rx,Math.min(cx,rx+rw)),ny=Math.max(ry,Math.min(cy,ry+rh));
    return (cx-nx)**2+(cy-ny)**2<r*r;
  }
  function waveHit(o){
    const cx=worldX+SIZE/2,cy=y+SIZE/2,r=16;
    if(o.kind==='mapObject')return mapParts(o).some(part=>!['orb','pad'].includes(part.role)&&mapGeometry.circleHit(part,cx,cy,r));
    if(o.kind==='waveFloor')return circleRectHit(cx,cy,r,o.x+7,GROUND-o.height+12,o.width-14,o.height-12);
    if(o.kind==='waveCeil')return circleRectHit(cx,cy,r,o.x+7,WAVE_TOP,o.width-14,o.height-12);
    if(o.kind==='waveSaw')return (cx-(o.x+o.radius))**2+(cy-o.y)**2<(r+o.radius-4)**2;
    if(o.kind==='waveDiamond')return (cx-(o.x+o.radius))**2+(cy-o.y)**2<(r+o.radius-8)**2;
    if(o.kind==='waveSlider')return (cx-waveSliderX(o))**2+(cy-o.y)**2<(r+o.radius-4)**2;
    if(o.kind==='waveOrbit')return waveOrbitCenters(o).some(([sx,sy])=>(cx-sx)**2+(cy-sy)**2<(r+o.radius-4)**2)||(cx-(o.x+o.width/2))**2+(cy-o.y)**2<(r+12)**2;
    if(o.kind==='wavePulse')return (cx-(o.x+o.radius))**2+(cy-wavePulseY(o))**2<(r+o.radius-4)**2;
    if(o.kind==='waveTwin')return [o.y-91,o.y+91].some(sy=>(cx-(o.x+o.radius))**2+(cy-sy)**2<(r+o.radius-4)**2);
    if(o.kind==='waveBlock')return circleRectHit(cx,cy,r,o.x,o.y,o.width,o.height);
    if(o.kind==='waveGate'||o.kind==='waveTunnel')return cx+r>o.x&&cx-r<o.x+o.width&&(cy-r<o.gapY-o.gapHalf||cy+r>o.gapY+o.gapHalf);
    return false;
  }
  function updateWavePhysics(dt){
    speed=Math.min(485,400+distance*.036);
    worldX+=speed*dt;
    y=Math.max(WAVE_TOP,Math.min(GROUND-SIZE,y+speed*(held?-WAVE_UP_FACTOR:WAVE_DOWN_FACTOR)*dt));
    rotation+=dt*12;
    for(const o of obstacles){
      if(o.x>worldX+SIZE+60)break;
      if(o.x+o.width<worldX-60)continue;
      if(waveHit(o)){gameOver();return}
    }
    finishProgress();
  }
  function spiderHit(o){
    if(o.kind==='mapObject')return mapParts(o).some(part=>!['orb','pad'].includes(part.role)&&mapGeometry.rectHit(part,worldX+7,y+6,SIZE-14,SIZE-12));
    if(!o.kind.startsWith('spider')||o.lane!==spiderLane)return false;
    const left=worldX+7,right=worldX+SIZE-7;
    if(o.kind==='spiderSaw'){
      const cx=o.x+o.radius,cy=o.lane==='top'?WAVE_TOP+27:GROUND-27;
      const nx=Math.max(left,Math.min(cx,right)),ny=Math.max(y+6,Math.min(cy,y+SIZE-6));
      return (cx-nx)**2+(cy-ny)**2<(o.radius-5)**2;
    }
    return right>o.x+6&&left<o.x+o.width-6;
  }
  function updateSpiderPhysics(dt){
    speed=Math.min(485,400+distance*.036);
    worldX+=speed*dt;
    y=spiderLane==='top'?WAVE_TOP:GROUND-SIZE;
    for(const o of obstacles){
      if(o.x>worldX+SIZE+60)break;
      if(o.x+o.width<worldX-60)continue;
      if(spiderHit(o)){gameOver();return}
    }
    finishProgress();
  }
  function finishProgress(){
    for(const c of crystals){
      if(c.taken)continue;
      if(Math.abs(c.x-(worldX+SIZE/2))<29&&Math.abs(c.y-(y+SIZE/2))<32){
        c.taken=true;collected++;burst(c.x-camera(),c.y,12,'#ffe8a1');playSfx('crystal');
      }
    }
    trail.unshift({x:worldX,y:y+SIZE/2,rotation,mode:playerMode});if(trail.length>25)trail.pop();
    distance=Math.floor((worldX-250)/10);
    generateAhead();
    obstacles=obstacles.filter(o=>o.x+o.width>worldX-550);
    portals=portals.filter(p=>p.x>worldX-550);
    crystals=crystals.filter(c=>!c.taken&&c.x>worldX-500);
    updateHud();
    if(customMap&&worldX+SIZE/2>=650+customMap.sections.length*CHUNK-35)completeCustomMap();
  }
  function switchMode(next){
    playerMode=next;trail=[];rotation=0;vy=0;grounded=next==='cube';modeFlash=1;
    cubeTurnStart=0;cubeTurnTarget=0;cubeTurnProgress=1;
    if(next==='spider')spiderLane='bottom';
    y=next==='wave'?Math.max(WAVE_TOP,Math.min(GROUND-SIZE,y)):GROUND-SIZE;
    updateHud();playSfx('transform');
  }
  function crossPortals(){
    for(const portal of portals){
      if(!portal.used&&worldX+SIZE/2>=portal.x){portal.used=true;if(playerMode!==portal.to)switchMode(portal.to)}
    }
  }
  function update(dt){
    if(state==='paused')return;
    clock+=dt;
    if(state==='menu'){
      worldX+=115*dt;
      const preview=modeForChunk(chunkAt(worldX));
      if(preview!==playerMode){playerMode=preview;trail=[]}
      if(playerMode==='spider')spiderLane=Math.sin(clock*1.6)>0?'top':'bottom';
      y=playerMode==='wave'?310+Math.sin(clock*1.6)*75:playerMode==='spider'?(spiderLane==='top'?WAVE_TOP:GROUND-SIZE):GROUND-SIZE+Math.sin(clock*2.3)*3;
      rotation=Math.sin(clock*1.3)*.09;
      generateAhead();
      obstacles=obstacles.filter(o=>o.x+o.width>worldX-550);
      crystals=crystals.filter(c=>c.x>worldX-500);
    }
    const nextTheme=customMap?.sections[Math.min(chunkAt(worldX),customMap.sections.length-1)]?.theme??themeForSection(Math.floor(Math.max(0,worldX-650)/(CHUNK*3)));
    if(nextTheme!==themeIndex){previousTheme=themeIndex;themeIndex=nextTheme;motifBlend=0;updateHud()}
    motifBlend=Math.min(1,motifBlend+dt*.6);
    const nextBackground=backgroundForChunk(chunkAt(worldX));
    if(nextBackground!==backgroundKey){oldBackground=activeBackground;backgroundKey=nextBackground;activeBackground=backgrounds.resolve(backgroundKey,customMap?.backgrounds);backgroundBlend=0;prepareNextBackground(chunkAt(worldX))}
    backgroundBlend=Math.min(1,backgroundBlend+dt*.7);
    modeFlash=Math.max(0,modeFlash-dt*3);
    const target=worlds[themeIndex],blend=Math.min(1,dt*1.25);
    for(const key of ['sky','sky2','accent','danger','ground','hill'])palette[key]=fadeColor(palette[key],target[key],blend);
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=420*dt;p.life-=dt}
    particles=particles.filter(p=>p.life>0);shake=Math.max(0,shake-42*dt);
    if(state==='playing'){
      crossPortals();
      if(playerMode==='wave')updateWavePhysics(dt);else if(playerMode==='spider')updateSpiderPhysics(dt);else updatePhysics(dt);
    }
  }

  function line(x1,y1,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
  function wavePulseY(o){return o.y+Math.sin(clock*2.3+o.x*.01)*56}
  function waveSliderX(o){return o.x+o.radius+50+Math.sin(clock*2.4+o.x*.012)*45}
  function waveOrbitCenters(o){
    const angle=clock*2.5+o.x*.009,cx=o.x+o.width/2;
    return [[cx+Math.cos(angle)*o.orbit,o.y+Math.sin(angle)*o.orbit],[cx-Math.cos(angle)*o.orbit,o.y-Math.sin(angle)*o.orbit]];
  }
  function sawY(o){return o.kind==='highSaw'?GROUND-145:o.kind==='movingSaw'?GROUND-58+Math.sin(clock*2.7+o.x*.013)*30:o.kind==='swingSaw'?GROUND-59+Math.sin(clock*2.2+o.x*.01)*24:GROUND-29}
  function polygon(points,fill,stroke,width=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
  function drawBackground(){
    backgrounds.draw(ctx,activeBackground,W,H,worldX,clock);
    if(backgroundBlend<1){ctx.save();ctx.globalAlpha=1-backgroundBlend;backgrounds.draw(ctx,oldBackground,W,H,worldX,clock);ctx.restore()}
  }
  function drawGround(){
    ctx.fillStyle=palette.ground;ctx.fillRect(0,GROUND,W,H-GROUND);
    ctx.fillStyle='#ffffffd9';ctx.fillRect(0,GROUND,W,5);
    ctx.fillStyle='#0d17464d';ctx.fillRect(0,GROUND+6,W,10);
    const offset=worldX%56;
    for(let x=-offset;x<W+56;x+=56){
      ctx.strokeStyle='#ffffff37';ctx.lineWidth=2;ctx.strokeRect(x,GROUND+16,56,56);
      polygon([[x+8,GROUND+71],[x+28,GROUND+45],[x+48,GROUND+71]],'#ffffff12');
    }
    const cam=camera();
    for(const o of obstacles){
      if(o.kind!=='pit')continue;
      const x=o.x-cam;if(x>W+10||x+o.width<-10)continue;
      ctx.fillStyle='#111535';ctx.fillRect(x,GROUND-2,o.width,H-GROUND+3);
      line(x,GROUND-2,x,H,'#ffffffdd',4);line(x+o.width,GROUND-2,x+o.width,H,'#ffffffdd',4);
      for(let i=0;i<5;i++)polygon([[x+9+i*32,GROUND+23],[x+21+i*32,GROUND+48],[x+33+i*32,GROUND+23]],palette.danger+'88');
    }
  }
  function drawWaveArena(){
    ctx.fillStyle=palette.ground;ctx.fillRect(0,WAVE_TOP-44,W,44);
    ctx.fillStyle='#fff9e8';ctx.fillRect(0,WAVE_TOP-3,W,5);
    const offset=worldX%56;
    for(let x=-offset;x<W+56;x+=56){
      ctx.strokeStyle='#ffffff43';ctx.lineWidth=2;ctx.strokeRect(x,WAVE_TOP-43,56,40);
      polygon([[x+8,WAVE_TOP-17],[x+28,WAVE_TOP-37],[x+48,WAVE_TOP-17]],'#ffffff20');
    }
  }
  function drawSpiderArena(){
    drawWaveArena();
    for(let x=-(worldX%116);x<W+116;x+=116){
      ctx.fillStyle='#fff9e877';ctx.fillRect(x,WAVE_TOP-13,8,8);
      ctx.fillRect(x+58,GROUND+12,8,8);
    }
  }
  function drawSpike(x,theme,base=GROUND){
    const c=worlds[theme].danger;
    polygon([[x+1,base-2],[x+20,base-49],[x+39,base-2]],c,'#fffaf1',3);
    line(x+20,base-39,x+11,base-9,'#ffffffaa',2);
  }
  function drawBlock(o,x){
    const c=worlds[o.theme].accent,top=o.y??GROUND-o.height;
    if(o.fortress){
      const rim=o.theme===2?'#f1a5f9':o.theme===3?'#ffe0a4':'#ead0ff';
      ctx.fillStyle=o.theme===2?'#211047':o.theme===3?'#492437':'#27194d';
      ctx.fillRect(x,top,o.width,H-top);
      ctx.strokeStyle=rim;ctx.lineWidth=3;ctx.strokeRect(x+1.5,top+1.5,o.width-3,H-top);
      for(let row=0,yy=top+17;yy<H;row++,yy+=24){
        line(x,yy,x+o.width,yy,'#7661aa93',2);
        const start=row%2?21:0;
        for(let xx=x+start;xx<x+o.width;xx+=42)line(xx,yy,xx,Math.min(yy+24,H),'#7661aa93',2);
      }
      ctx.fillStyle=rim;ctx.fillRect(x,top,o.width,5);
      return;
    }
    ctx.fillStyle=palette.ground;ctx.fillRect(x,top,o.width,o.height);
    ctx.fillStyle=c+'55';ctx.fillRect(x+6,top+6,o.width-12,o.height-12);
    ctx.strokeStyle='#fff9ef';ctx.lineWidth=4;ctx.strokeRect(x+2,top+2,o.width-4,o.height-4);
    ctx.fillStyle='#fff9ef';ctx.fillRect(x+5,top+5,o.width-10,6);
    for(let i=14;i<o.width-12;i+=28){ctx.strokeStyle='#ffffff9c';ctx.lineWidth=2;ctx.strokeRect(x+i,top+23,16,16)}
  }
  function drawPlatform(o,x){
    const c=worlds[o.theme].accent,top=GROUND-o.height;
    ctx.fillStyle=palette.ground;ctx.fillRect(x,top,o.width,23);
    ctx.strokeStyle='#fff9ef';ctx.lineWidth=4;ctx.strokeRect(x+2,top+2,o.width-4,19);
    ctx.fillStyle=c;ctx.fillRect(x+9,top+7,o.width-18,5);
    for(let i=13;i<o.width-12;i+=28)polygon([[x+i,top+24],[x+i+9,top+34],[x+i+18,top+24]],c+'aa');
  }
  function drawSaw(o,x){
    const c=worlds[o.theme].danger,r=o.radius,cy=o.kind==='waveSaw'||o.kind==='waveSlider'?o.y:o.kind==='wavePulse'?wavePulseY(o):sawY(o);
    const cx=(o.kind==='waveSaw'||o.kind==='wavePulse'?o.x+o.radius:o.kind==='waveSlider'?waveSliderX(o):sawCenterX(o))-camera();
    if(o.kind==='swingSaw'){
      line(o.x-camera()+r+50,190,cx,cy,'#fff9e7bb',3);
      ctx.beginPath();ctx.arc(o.x-camera()+r+50,190,7,0,Math.PI*2);ctx.fillStyle='#fff9e7';ctx.fill();
    }
    ctx.save();ctx.translate(cx,cy);ctx.rotate(clock*(o.kind==='highSaw'?-2.7:3.1));
    const teeth=[];for(let i=0;i<24;i++){const a=i*Math.PI/12,rr=i%2?r*.76:r;teeth.push([Math.cos(a)*rr,Math.sin(a)*rr])}
    polygon(teeth,c,'#fff9ee',3);
    ctx.beginPath();ctx.arc(0,0,r*.47,0,Math.PI*2);ctx.fillStyle=palette.ground;ctx.fill();ctx.strokeStyle='#fff8f0';ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,r*.19,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();ctx.restore();
  }
  function drawWaveDiamond(o){
    const cx=o.x+o.radius-camera(),cy=o.y,r=o.radius;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(clock*1.6);
    polygon([[0,-r],[r,0],[0,r],[-r,0]],worlds[o.theme].danger,'#fff9ec',3);
    polygon([[0,-r*.54],[r*.54,0],[0,r*.54],[-r*.54,0]],palette.ground,'#fff9ec',2);
    ctx.restore();
  }
  function drawWaveOrbit(o){
    const centers=waveOrbitCenters(o),cx=o.x+o.width/2-camera();
    for(const [sx,sy] of centers)line(cx,o.y,sx-camera(),sy,'#fff9ecb5',4);
    ctx.beginPath();ctx.arc(cx,o.y,12,0,Math.PI*2);ctx.fillStyle=worlds[o.theme].danger;ctx.fill();ctx.strokeStyle='#fff9ec';ctx.lineWidth=3;ctx.stroke();
    for(const [sx,sy] of centers)drawSaw({kind:'waveSaw',x:sx-o.radius,y:sy,radius:o.radius,theme:o.theme},sx-camera());
  }
  function drawPad(o,x){
    ctx.fillStyle='#e0bc64';ctx.fillRect(x,GROUND-14,o.width,14);ctx.strokeStyle='#fff9ed';ctx.lineWidth=3;ctx.strokeRect(x,GROUND-14,o.width,14);
    for(let i=0;i<3;i++)polygon([[x+15+i*19,GROUND-7],[x+21+i*19,GROUND-24-Math.sin(clock*8)*2],[x+27+i*19,GROUND-7]],'#fff7de');
  }
  function drawMiniSpike(x,theme,base=GROUND,width=34){
    polygon([[x+1,base-2],[x+width/2,base-32],[x+width-1,base-2]],worlds[theme].danger,'#fff9ef',3);
    line(x+width/2,base-25,x+width/2-5,base-8,'#ffffffad',2);
  }
  function drawSpikeBlock(o,x){
    drawBlock(o,x);
    const top=GROUND-o.height,count=Math.floor(o.width/30),step=o.width/count;
    for(let i=0;i<count;i++)polygon([[x+i*step,top+2],[x+(i+.5)*step,top-30],[x+(i+1)*step,top+2]],worlds[o.theme].danger,'#fff9ef',2);
  }
  function drawHangingBlock(o,x){
    const top=o.y;
    line(x+o.width*.25,0,x+o.width*.25,top,'#fff9e78c',3);
    line(x+o.width*.75,0,x+o.width*.75,top,'#fff9e78c',3);
    ctx.fillStyle=palette.ground;ctx.fillRect(x,top,o.width,o.height);
    ctx.strokeStyle='#fff9ed';ctx.lineWidth=4;ctx.strokeRect(x+2,top+2,o.width-4,o.height-4);
    for(let i=10;i<o.width-10;i+=26){ctx.fillStyle=worlds[o.theme].danger+'99';ctx.fillRect(x+i,top+13,14,14)}
  }
  function drawGate(o,x){
    const active=gateActive(o),top=GROUND-o.height;
    ctx.strokeStyle='#fff9eb';ctx.lineWidth=3;ctx.strokeRect(x-7,top-12,o.width+14,o.height+12);
    if(active){
      ctx.fillStyle=worlds[o.theme].danger;ctx.fillRect(x,top,o.width,o.height);
      for(let yy=top+10;yy<GROUND;yy+=23)line(x+4,yy,x+o.width-4,yy+12,'#fff9dfb3',3);
    }else{
      ctx.fillStyle='#ffffff28';ctx.fillRect(x,top,o.width,o.height);
    }
    ctx.fillStyle=active?'#ffeaa7':'#9ddf9c';ctx.fillRect(x-3,top-22,9,9);
  }
  function drawCeilingSpike(o,x){
    const c=worlds[o.theme].danger;
    polygon([[x,o.y],[x+42,o.y],[x+21,o.y+o.height]],c,'#fff9ef',3);
    line(x+21,o.y+8,x+21,o.y+30,'#ffffffa0',2);
  }
  function drawOrb(o,x){
    const yy=o.y+Math.sin(clock*3+o.x*.01)*4;
    ctx.beginPath();ctx.arc(x+22,yy,22,0,Math.PI*2);ctx.fillStyle=o.used?'#ffffff33':'#f6d873';ctx.fill();ctx.strokeStyle='#fffaf0';ctx.lineWidth=4;ctx.stroke();
    ctx.beginPath();ctx.arc(x+22,yy,9,0,Math.PI*2);ctx.fillStyle=palette.sky;ctx.fill();
    if(!o.used){ctx.fillStyle='#fff';ctx.fillRect(x+20,yy-32,4,8)}
  }
  function drawWaveStrip(o,x){
    const bottom=o.kind==='waveFloor',edge=bottom?GROUND:WAVE_TOP,tip=bottom?GROUND-o.height:WAVE_TOP+o.height;
    ctx.fillStyle=palette.ground;ctx.fillRect(x,bottom?GROUND-12:WAVE_TOP,o.width,12);
    ctx.fillStyle='#fff9e8';ctx.fillRect(x,bottom?GROUND-12:WAVE_TOP,o.width,4);
    const count=Math.max(2,Math.round(o.width/39)),step=o.width/count;
    for(let i=0;i<count;i++){
      polygon([[x+i*step,edge],[x+(i+.5)*step,tip],[x+(i+1)*step,edge]],worlds[o.theme].danger,'#fff9ec',3);
    }
  }
  function drawWaveGate(o,x){
    const upper=o.gapY-o.gapHalf,lower=o.gapY+o.gapHalf;
    ctx.fillStyle=palette.ground;ctx.fillRect(x,WAVE_TOP,o.width,upper-WAVE_TOP);ctx.fillRect(x,lower,o.width,GROUND-lower);
    ctx.strokeStyle='#fff9ec';ctx.lineWidth=3;ctx.strokeRect(x,WAVE_TOP,o.width,upper-WAVE_TOP);ctx.strokeRect(x,lower,o.width,GROUND-lower);
    for(let yy=WAVE_TOP+12;yy<upper-12;yy+=27)line(x+5,yy,x+o.width-5,yy,'#ffffff70',2);
    for(let yy=lower+12;yy<GROUND-12;yy+=27)line(x+5,yy,x+o.width-5,yy,'#ffffff70',2);
    ctx.fillStyle=worlds[o.theme].danger;ctx.fillRect(x,upper-6,o.width,6);ctx.fillRect(x,lower,o.width,6);
  }
  function drawWaveBlock(o,x){
    ctx.fillStyle=palette.ground;ctx.fillRect(x,o.y,o.width,o.height);
    ctx.strokeStyle='#fff9ec';ctx.lineWidth=4;ctx.strokeRect(x+2,o.y+2,o.width-4,o.height-4);
    ctx.fillStyle=worlds[o.theme].danger+'88';ctx.fillRect(x+12,o.y+12,o.width-24,o.height-24);
    for(let i=0;i<3;i++)line(x+12,o.y+25+i*20,x+o.width-12,o.y+25+i*20,'#fff9ec99',2);
  }
  function drawSpiderObstacle(o,x){
    const top=o.lane==='top',edge=top?WAVE_TOP:GROUND,dir=top?1:-1,c=worlds[o.theme].danger;
    if(o.kind==='spiderSaw'){
      drawSaw({kind:'waveSaw',x:o.x,y:edge+dir*27,radius:o.radius,theme:o.theme},x);
      return;
    }
    if(o.kind==='spiderBlock'){
      const yy=top?edge:edge-o.height;
      ctx.fillStyle=palette.ground;ctx.fillRect(x,yy,o.width,o.height);
      ctx.strokeStyle='#fff9ec';ctx.lineWidth=4;ctx.strokeRect(x+2,yy+2,o.width-4,o.height-4);
      for(let i=12;i<o.width-10;i+=24){ctx.fillStyle=c+'b8';ctx.fillRect(x+i,yy+17,12,27)}
      return;
    }
    const count=Math.max(2,Math.round(o.width/36)),step=o.width/count;
    for(let i=0;i<count;i++)polygon([[x+i*step,edge],[x+(i+.5)*step,edge+dir*o.height],[x+(i+1)*step,edge]],c,'#fff9ec',3);
  }
  function drawPortals(){
    const cam=camera();
    for(const p of portals){
      const x=p.x-cam;if(x<-80||x>W+80)continue;
      const color=p.to==='wave'?'#e693d1':p.to==='spider'?'#a7df8d':'#83d6e0';
      const atFloor=p.to==='wave';
      const cy=atFloor?GROUND-57:(WAVE_TOP+GROUND)/2,ry=atFloor?55:187;
      ctx.beginPath();ctx.ellipse(x,cy,24,ry,0,0,Math.PI*2);ctx.fillStyle=palette.ground+'dd';ctx.fill();ctx.strokeStyle='#fff9ed';ctx.lineWidth=5;ctx.stroke();
      ctx.beginPath();ctx.ellipse(x,cy,15,ry-10,0,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.stroke();
      ctx.fillStyle='#fff9ed';ctx.font='800 12px Manrope, Arial, sans-serif';ctx.textAlign='center';
      ctx.fillText(p.to==='wave'?'ПИЛА':p.to==='spider'?'ПАУК':'КУБ',x,atFloor?GROUND-127:134);
    }
  }
  function drawObstacles(){
    const cam=camera();
    for(const o of obstacles){
      const x=o.x-cam;if(x>W+100||x+o.width<-100)continue;
      if(o.kind==='mapObject'){
        ctx.save();ctx.translate(-cam,0);if(o.used)ctx.globalAlpha=.4;
        if(o.mapItem.kind==='gate'&&!gateActive(o))ctx.globalAlpha=.2;
        mapGeometry.draw(ctx,mapParts(o),{solid:worlds[o.theme].ground,danger:worlds[o.theme].danger});
        ctx.restore();continue;
      }
      if(!['orb','platform','ceilingSpike','hangingBlock','waveFloor','waveCeil','waveSaw','wavePulse','waveTwin','waveSlider','waveOrbit','waveDiamond','waveBlock','waveGate','waveTunnel','spiderSpike','spiderBlock','spiderSaw'].includes(o.kind)){
        for(let i=0;i<3;i++)polygon([[x-58+i*12,GROUND+3],[x-51+i*12,GROUND+12],[x-58+i*12,GROUND+21]],'#fff9e780');
      }
      if(o.kind==='spike')for(let i=0;i<o.count;i++)drawSpike(x+i*(o.step??40),o.theme,o.baseY??GROUND);
      else if(o.kind==='miniSpike')for(let i=0;i<o.count;i++)drawMiniSpike(x+i*(o.step??34),o.theme,o.baseY??GROUND,o.step??34);
      else if(o.kind==='block')drawBlock(o,x);
      else if(o.kind==='spikeBlock')drawSpikeBlock(o,x);
      else if(o.kind==='hangingBlock')drawHangingBlock(o,x);
      else if(o.kind==='gate')drawGate(o,x);
      else if(o.kind==='platform')drawPlatform(o,x);
      else if(o.kind==='saw'||o.kind==='highSaw'||o.kind==='movingSaw'||o.kind==='swingSaw'||o.kind==='roller')drawSaw(o,x);
      else if(o.kind==='sawPair'){
        line(x+o.radius,GROUND-29,x+o.radius+90,GROUND-29,'#fff9ec8c',4);
        drawSaw({...o,kind:'saw',width:o.radius*2},x);
        drawSaw({...o,kind:'saw',x:o.x+90,width:o.radius*2},x+90);
      }
      else if(o.kind==='pad')drawPad(o,x);
      else if(o.kind==='ceilingSpike')drawCeilingSpike(o,x);
      else if(o.kind==='orb')drawOrb(o,x);
      else if(o.kind==='waveFloor'||o.kind==='waveCeil')drawWaveStrip(o,x);
      else if(o.kind==='waveSaw')drawSaw(o,x);
      else if(o.kind==='waveSlider')drawSaw(o,x);
      else if(o.kind==='waveOrbit')drawWaveOrbit(o);
      else if(o.kind==='waveDiamond')drawWaveDiamond(o);
      else if(o.kind==='wavePulse')drawSaw(o,x);
      else if(o.kind==='waveTwin'){
        drawSaw({...o,kind:'waveSaw',y:o.y-91},x);
        drawSaw({...o,kind:'waveSaw',y:o.y+91},x);
      }
      else if(o.kind==='waveBlock')drawWaveBlock(o,x);
      else if(o.kind==='waveGate'||o.kind==='waveTunnel')drawWaveGate(o,x);
      else if(o.kind.startsWith('spider'))drawSpiderObstacle(o,x);
    }
  }
  function drawCrystals(){
    const cam=camera();
    for(const c of crystals){
      if(c.taken)continue;const x=c.x-cam;if(x<-30||x>W+30)continue;
      const yy=c.y+Math.sin(clock*3+c.phase)*7;
      polygon([[x,yy-13],[x+11,yy],[x,yy+13],[x-11,yy]],'#f7d679','#fffaf0',2);
      polygon([[x,yy-8],[x+6,yy],[x,yy+8],[x-6,yy]],'#fff8db');
    }
  }
  function drawPlayer(){
    if(state==='over')return;
    const cam=camera();
    if(playerMode==='wave'){
      const path=trail.filter(t=>t.mode==='wave');
      if(path.length){
        ctx.beginPath();ctx.moveTo(playerScreen+SIZE/2,y+SIZE/2);
        for(const point of path)ctx.lineTo(point.x-cam+SIZE/2,point.y);
        ctx.strokeStyle='#fff9ecb8';ctx.lineWidth=8;ctx.lineJoin='round';ctx.stroke();
        ctx.strokeStyle=worlds[themeIndex].danger;ctx.lineWidth=3;ctx.stroke();
      }
      ctx.save();ctx.translate(playerScreen+SIZE/2,y+SIZE/2);ctx.rotate(rotation);
      const teeth=[];for(let i=0;i<24;i++){const a=i*Math.PI/12,r=i%2?16:21;teeth.push([Math.cos(a)*r,Math.sin(a)*r])}
      polygon(teeth,worlds[themeIndex].danger,'#fff9ec',3);
      ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fillStyle=palette.ground;ctx.fill();ctx.strokeStyle='#fff9ec';ctx.lineWidth=3;ctx.stroke();
      ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fillStyle='#fff9ec';ctx.fill();ctx.restore();
      return;
    }
    if(playerMode==='spider'){
      const cx=playerScreen+SIZE/2,cy=y+SIZE/2,dir=spiderLane==='top'?-1:1;
      const gait=worldX*.055;
      ctx.save();ctx.translate(cx,cy);ctx.scale(1,dir);
      ctx.lineCap='round';
      for(let side of [-1,1])for(let i=0;i<4;i++){
        const phase=gait+(i%2)*Math.PI+(side===1?Math.PI:0),swing=Math.cos(phase)*5,lift=Math.max(0,Math.sin(phase))*7;
        const yy=-12+i*8,kneeX=side*(24+i%2*4)+swing*.6,kneeY=yy+9-lift*.5,footX=side*(29+i%2*4)+swing;
        line(side*14,yy,kneeX,kneeY,'#fff9ec',4);
        line(kneeX,kneeY,footX,20-lift,'#9bd782',4);
      }
      ctx.translate(0,-Math.abs(Math.sin(gait))*1.5);
      ctx.fillStyle='#82c977';ctx.fillRect(-20,-20,40,40);
      ctx.strokeStyle='#fff9ec';ctx.lineWidth=4;ctx.strokeRect(-18,-18,36,36);
      ctx.fillStyle='#274260';ctx.fillRect(-12,-6,7,8);ctx.fillRect(5,-6,7,8);
      ctx.fillRect(-7,8,14,4);
      ctx.restore();
      return;
    }
    for(let i=trail.length-1;i>=0;i--){
      const t=trail[i],alpha=Math.floor(45*(1-i/trail.length)).toString(16).padStart(2,'0');
      ctx.save();ctx.translate(t.x-cam+SIZE/2,t.y);ctx.rotate(t.rotation);ctx.fillStyle='#ffffff'+alpha;ctx.fillRect(-SIZE/2,-SIZE/2,SIZE,SIZE);ctx.restore();
    }
    const x=playerScreen+SIZE/2,cy=y+SIZE/2;
    ctx.save();ctx.translate(x,cy);ctx.rotate(rotation);
    ctx.fillStyle='#7bc8d6';ctx.fillRect(-SIZE/2,-SIZE/2,SIZE,SIZE);
    ctx.strokeStyle='#fffaf0';ctx.lineWidth=4;ctx.strokeRect(-SIZE/2+2,-SIZE/2+2,SIZE-4,SIZE-4);
    ctx.strokeStyle='#244262';ctx.lineWidth=3;ctx.strokeRect(-SIZE/2+8,-SIZE/2+8,SIZE-16,SIZE-16);
    ctx.fillStyle='#244262';ctx.fillRect(-10,-9,7,8);ctx.fillRect(4,-9,7,8);
    ctx.fillRect(-7,5,14,4);
    ctx.restore();
    if(grounded||state==='menu'){ctx.fillStyle='#ffffff66';ctx.fillRect(playerScreen-9,y+SIZE+5,SIZE+18,3)}
  }
  function drawParticles(){for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size)}ctx.globalAlpha=1}
  function render(){
    ctx.save();if(shake)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    drawBackground();drawGround();if(playerMode==='wave')drawWaveArena();else if(playerMode==='spider')drawSpiderArena();drawCrystals();drawObstacles();drawPortals();drawPlayer();drawParticles();
    if(modeFlash>0){
      ctx.fillStyle='#ffffff'+Math.round(modeFlash*38).toString(16).padStart(2,'0');ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=modeFlash;ctx.fillStyle='#fff9ec';ctx.textAlign='center';ctx.font='700 32px Manrope, Arial, sans-serif';
      ctx.fillText(playerMode==='wave'?'ПИЛА · ВОЛНА':playerMode==='spider'?'ПАУК':'КУБ',W/2,250);ctx.globalAlpha=1;
    }
    ctx.restore();
  }
  function frame(t){const dt=Math.min(.034,(t-lastTime)/1000||0);lastTime=t;update(dt);render();requestAnimationFrame(frame)}

  window.addEventListener('resize',resize);
  buildLevelList();syncSoundButtons();resetWorld();resize();returnMenu();
  try{
    const encoded=new URLSearchParams(location.hash.slice(1)).get('map');
    if(encoded)startCustomRun(JSON.parse(encoded));
    if(awaitingEditorMap)window.opener?.postMessage({type:'georush-game-ready'},'*');
  }catch{}
  requestAnimationFrame(frame);
})();
