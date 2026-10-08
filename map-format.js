(() => {
  'use strict';

  const catalog = {
    cube: [
      {kind:'singleSpike',label:'Шип',axis:'y',count:1,width:40,minY:160,maxY:560,defaultY:560,grid:40},
      {kind:'singleMiniSpike',label:'Малый шип',axis:'y',count:1,width:40,minY:160,maxY:560,defaultY:560,grid:40},
      {kind:'tileBlock',label:'Блок 40×40',axis:'y',width:40,height:40,minY:160,maxY:520,defaultY:520,grid:40},
      {kind:'spike',label:'Шипы',a:2,width:80,legacy:true},
      {kind:'miniSpike',label:'Малые шипы',a:3,width:102,legacy:true},
      {kind:'block',label:'Блок',a:100,b:90,width:100},
      {kind:'spikeBlock',label:'Шипованный блок',a:100,b:90,width:100},
      {kind:'platform',label:'Платформа',a:150,b:120,width:150},
      {kind:'saw',label:'Пила',a:30,width:60},
      {kind:'movingSaw',label:'Подвижная пила',a:29,width:58},
      {kind:'pit',label:'Яма',a:150,width:150},
      {kind:'pad',label:'Пружина',width:72},
      {kind:'orb',label:'Кольцо',axis:'y',width:44},
      {kind:'gate',label:'Ворота',a:135,width:32},
      {kind:'roller',label:'Катящаяся пила',a:27,width:134},
      {kind:'sawPair',label:'Парные пилы',a:23,width:136}
    ],
    wave: [
      {kind:'tileBlock',label:'Блок 40×40',axis:'y',width:40,height:40,defaultY:520},
      {kind:'singleSpike',label:'Шип',axis:'y',count:1,width:40,defaultY:560},
      {kind:'singleMiniSpike',label:'Малый шип',axis:'y',count:1,width:40,defaultY:560},
      {kind:'waveFloor',label:'Длинные шипы',a:115,b:120,width:115},
      {kind:'waveCeil',label:'Длинные шипы',a:115,b:120,width:115,legacy:true},
      {kind:'waveSaw',label:'Пила',axis:'y',b:28,width:56},
      {kind:'waveDiamond',label:'Ромб',axis:'y',b:30,width:60},
      {kind:'wavePulse',label:'Движущаяся пила',axis:'y',b:27,width:54},
      {kind:'waveBlock',label:'Блок',axis:'y',b:90,width:90},
      {kind:'waveGate',label:'Ворота',axis:'y',b:95,width:50,minY:270,maxY:440},
      {kind:'waveTunnel',label:'Туннель',axis:'y',b:95,extra:135,width:135,minY:270,maxY:440}
    ],
    spider: [
      {kind:'tileBlock',label:'Блок 40×40',axis:'y',width:40,height:40,defaultY:520},
      {kind:'singleSpike',label:'Шип',axis:'y',count:1,width:40,defaultY:560},
      {kind:'singleMiniSpike',label:'Малый шип',axis:'y',count:1,width:40,defaultY:560},
      {kind:'spiderSpike',label:'Длинные шипы',axis:'lane',b:96,width:96},
      {kind:'spiderBlock',label:'Блок',axis:'lane',b:90,width:90},
      {kind:'spiderSaw',label:'Пила',axis:'lane',b:28,width:56}
    ]
  };
  const names = {cube:'КУБ',wave:'ПИЛА',spider:'ПАУК'};
  const maxSections = 96;
  const dimensions={
    spike:{count:[1,3,2]},miniSpike:{count:[1,5,3]},
    block:{width:[40,360,100],height:[20,160,90]},spikeBlock:{width:[60,200,100],height:[20,120,90]},
    platform:{width:[60,360,150],height:[50,220,120]},pit:{width:[80,300,150]},
    waveBlock:{width:[40,320,90],height:[20,200,84]},
    waveFloor:{width:[60,360,115],height:[60,180,120]},waveCeil:{width:[60,360,115],height:[60,180,120]},
    waveGate:{width:[40,320,50],gap:[70,130,107]},waveTunnel:{width:[80,320,135],gap:[70,130,107]},
    spiderSpike:{width:[60,320,96]},spiderBlock:{width:[60,320,90]}
  };
  function shape(item,mode){
    const base=catalog[mode]?.find(spec=>spec.kind===item.kind);if(!base)return null;
    const spec={...base};
    for(const [key,[min,max,fallback]] of Object.entries(dimensions[item.kind]||{})){
      const value=Number(item[key]);spec[key]=Number.isFinite(value)?Math.max(min,Math.min(max,Math.round(value))):fallback;
    }
    if(item.kind==='spike'||item.kind==='miniSpike')spec.width=spec.count*(item.kind==='spike'?40:34);
    if(spec.gap){spec.minY=150+spec.gap;spec.maxY=560-spec.gap}
    return spec;
  }
  function normalize(raw){
    if(!raw||raw.version!==1||!Array.isArray(raw.sections)||!raw.sections.length)return null;
    const backgrounds=Object.create(null);let backgroundSize=0;
    for(const [id,value] of Object.entries(raw.backgrounds&&typeof raw.backgrounds==='object'?raw.backgrounds:{}).slice(0,16)){
      if(!/^[a-z][a-z0-9_-]{0,39}$/.test(id))continue;
      const bg=window.GeoRushBackgrounds?.normalize(value);if(!bg)continue;
      const size=JSON.stringify(bg).length;if(backgroundSize+size>10000000)continue;
      backgroundSize+=size;backgrounds[id]=bg;
    }
    const sections=[];
    for(const source of raw.sections.slice(0,maxSections)){
      if(!source||!Object.hasOwn(catalog,source.mode))return null;
      const objects=[];
      for(const item of (Array.isArray(source.objects)?source.objects:[]).slice(0,60)){
        const spec=catalog[source.mode].find(def=>def.kind===item?.kind);
        if(!spec)continue;
        const x=Number(item.x);
        if(!Number.isFinite(x))continue;
        const free=item.free===true;
        const grid=spec.grid||20;
        const object={kind:spec.kind,x:free?Math.max(-500,Math.min(1500,Math.round(x*100)/100)):Math.max(160,Math.min(1280,Math.round(x/grid)*grid))};
        for(const [key,[min,max]] of Object.entries(dimensions[spec.kind]||{})){
          if(Object.hasOwn(item,key)&&Number.isFinite(Number(item[key])))object[key]=Math.max(min,Math.min(max,Math.round(Number(item[key]))));
        }
        const geometry=shape(object,source.mode);
        if(free){
          const y=Number(item.y),angle=Number(item.rotation);
          object.free=true;object.y=Math.max(-500,Math.min(720,Number.isFinite(y)?Math.round(y*100)/100:340));
          object.rotation=Number.isFinite(angle)?(Math.round(((angle%360+360)%360)*100)/100)%360:0;
          if(Number.isFinite(Number(item.gapOffset)))object.gapOffset=Math.max(0,Math.min(410,Number(item.gapOffset)));
        }else if(spec.axis==='y'){
          const value=Number(item.y);
          object.y=Math.max(geometry.minY??190,Math.min(geometry.maxY??470,Number.isFinite(value)?Math.round(value/grid)*grid:spec.defaultY??340));
        }
        if(spec.axis==='lane')object.lane=item.lane==='top'?'top':'bottom';
        objects.push(object);
      }
      objects.sort((a,b)=>a.x-b.x);
      const section={mode:source.mode,objects};
      if(Number.isInteger(source.theme)&&source.theme>=0&&source.theme<5)section.theme=source.theme;
      if(typeof source.label==='string')section.label=source.label.trim().slice(0,40);
      if(typeof source.background==='string'&&(Object.hasOwn(backgrounds,source.background)||window.GeoRushBackgrounds?.presets.some(bg=>bg.id===source.background)))section.background=source.background;
      sections.push(section);
    }
    const map={version:1,name:(typeof raw.name==='string'?raw.name:'Моя карта').trim().slice(0,50)||'Моя карта',sections};
    if(Object.keys(backgrounds).length)map.backgrounds=backgrounds;
    return map;
  }
  function placeInGame(object,mode,baseX,theme,addObstacle){
    const spec=shape(object,mode);
    if(!spec)return;
    if(object.free){
      const parts=window.GeoRushGeometry.parts(object,mode,baseX),bounds=window.GeoRushGeometry.bounds(parts);
      const placed=addObstacle('mapObject',baseX+object.x,0,0,theme);
      if(placed)Object.assign(placed,{x:bounds.x-50,width:bounds.w+100,mapItem:object,mapMode:mode,mapBaseX:baseX,used:false});
      return;
    }
    // Editor grid pieces reuse game geometry without entering the endless generator.
    if(spec.kind==='tileBlock'){
      const placed=addObstacle('block',baseX+object.x,40,40,theme);
      if(placed)placed.y=object.y??spec.defaultY;
      return;
    }
    if(spec.kind==='singleSpike'||spec.kind==='singleMiniSpike'){
      const placed=addObstacle(spec.kind==='singleSpike'?'spike':'miniSpike',baseX+object.x,1,undefined,theme);
      if(placed){placed.baseY=object.y??spec.defaultY;placed.step=40;placed.width=40}
      return;
    }
    let a=spec.axis==='y'?object.y:spec.axis==='lane'?object.lane:spec.a,b=spec.b;
    if(spec.count)a=spec.count;
    if(['block','spikeBlock','platform'].includes(spec.kind)){a=spec.width;b=spec.height}
    if(spec.kind==='pit'||spec.kind==='waveFloor'||spec.kind==='waveCeil'){a=spec.width;if(spec.height)b=spec.height}
    if(spec.axis==='lane'&&spec.kind!=='spiderSaw')b=spec.width;
    if(spec.gap)b=spec.gap-12;
    const placed=addObstacle(spec.kind,baseX+object.x,a,b,theme,spec.kind==='waveTunnel'?spec.width:spec.extra);
    if(placed&&spec.kind==='waveGate')placed.width=spec.width;
  }
  function fileName(name){
    let base=String(name||'Моя карта').trim().replace(/\.(grush|json)$/i,'').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/[. ]+$/g,'').trim()||'Моя карта';
    if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(base))base='Карта '+base;
    return base+'.grush';
  }
  window.GeoRushMap={catalog,names,normalize,placeInGame,fileName,maxSections,dimensions,shape};
})();
