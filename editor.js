(() => {
  'use strict';
  const format=window.GeoRushMap;
  const geometry=window.GeoRushGeometry;
  const backgrounds=window.GeoRushBackgrounds;
  const canvas=document.getElementById('mapCanvas'),ctx=canvas.getContext('2d');
  const ui=Object.fromEntries([
    'backButton','playButton','mapName','newButton','saveButton','exportButton','importButton','importFile',
    'addSection','removeSection','sectionList','sectionMode','toolList','stageName','stageCount',
    'undoButton','redoButton','clearButton','editorStatus','modeHint','mapStats',
    'sectionLeft','sectionRight','duplicateSection','objectName','objectX','objectY','objectYLabel',
    'objectRotation','rotateObject','snapGrid','modeFree','modeGrid','duplicateObject','deleteObject','officialLevel','sizePanel','sizeFields','sectionTheme','sectionBackground','backgroundButton'
  ].map(id=>[id,document.getElementById(id)]));
  const embedded=window.parent!==window&&new URLSearchParams(location.search).has('embedded');
  const storageKey='georush-editor-draft-v1';
  const emptyMap=()=>({version:1,name:'Моя карта',sections:[{mode:'cube',objects:[]}]});
  let map=loadDraft(),sectionIndex=0,tool=format.catalog[map.sections[0].mode][0].kind,selected=null,dragging=null,hover=null,history=[],future=[],storageAvailable=true;
  let placementMode='free';
  let playWindow=null,pendingPlayMap=null;
  const gridStep=()=>placementMode==='grid'?Number(ui.snapGrid.value):1;

  function loadDraft(){
    try{return format.normalize(JSON.parse(localStorage.getItem(storageKey)))||emptyMap()}
    catch{return emptyMap()}
  }
  function section(){return map.sections[sectionIndex]}
  function specs(){return format.catalog[section().mode].filter(spec=>!spec.legacy)}
  function specFor(item){return format.shape(item,section().mode)}
  function note(message){ui.editorStatus.textContent=message+(storageAvailable?'':' Черновик не хранится — скачай .grush.')}
  function persist(){
    try{localStorage.setItem(storageKey,JSON.stringify(map));storageAvailable=true;return true}
    catch{storageAvailable=false;return false}
  }
  function snapshot(){return {map:JSON.stringify(map),index:sectionIndex}}
  function remember(state=snapshot()){
    history.push(state);future=[];
    if(history.length>30)history.shift();
  }
  function icon(kind){
    let shape;
    if(kind==='select')shape='<path d="M9 5v29l8-8 6 13 6-3-6-12h12z" fill="#b4dcea"/>';
    else if(kind==='erase')shape='<path d="m10 30 17-20 11 10-17 20H10l-6-6z" fill="#f0a1ad"/><path d="m16 23 11 10"/>';
    else if(/saw|pulse|roller/i.test(kind)){
      const points=Array.from({length:24},(_,i)=>{const a=i*Math.PI/12,r=i%2?14:19;return (24+Math.cos(a)*r)+','+(24+Math.sin(a)*r)}).join(' ');
      shape='<polygon points="'+points+'" fill="#f0a1ad"/><circle cx="24" cy="24" r="6" fill="#243368"/>';
      if(/moving|pulse|roller/i.test(kind))shape+='<path d="M4 44h35m-5-4 5 4-5 4"/>';
    }else if(/diamond/i.test(kind))shape='<path d="m24 5 18 19-18 19L6 24z" fill="#f0a1ad"/>';
    else if(/gate|tunnel/i.test(kind))shape='<path d="M9 4h30v12H9zM9 32h30v12H9z" fill="#7893ce"/>';
    else if(kind==='orb')shape='<circle cx="24" cy="24" r="15" fill="#fbd56f"/><circle cx="24" cy="24" r="8" fill="#243368"/>';
    else if(kind==='pit')shape='<path d="M3 22h9v20h24V22h9" fill="#14204f"/>';
    else if(kind==='pad')shape='<path d="M5 34h38v8H5z" fill="#fbd56f"/><path d="m16 22 8-10 8 10m-8-10v18"/>';
    else if(kind==='platform')shape='<path d="M4 24h40v9H4z" fill="#7893ce"/>';
    else if(/block/i.test(kind)){
      shape='<rect x="8" y="14" width="32" height="28" fill="#7893ce"/><path d="M10 28h28M24 16v10M18 30v10" stroke="#b6c7ec"/>';
      if(kind==='spikeBlock')shape+='<path d="m8 14 8-10 8 10 8-10 8 10" fill="#f0a1ad"/>';
    }else if(kind==='singleSpike'||kind==='singleMiniSpike')shape='<path d="M7 40 24 '+(kind==='singleMiniSpike'?22:8)+' 41 40z" fill="#f0a1ad"/>';
    else shape=kind==='waveCeil'?'<path d="M4 8h40L34 30 24 8 14 30z" fill="#f0a1ad"/>':'<path d="m4 40 10-25 10 25 10-25 10 25z" fill="#f0a1ad"/>';
    return '<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="#fff9ee" stroke-width="2" stroke-linejoin="round">'+shape+'</svg>';
  }
  function drawSectionList(){
    ui.sectionList.replaceChildren();
    map.sections.forEach((entry,index)=>{
      const button=document.createElement('button');
      button.type='button';button.className='section-item'+(index===sectionIndex?' active':'');
      const label=document.createElement('span'),count=document.createElement('small');
      label.textContent=String(index+1).padStart(2,'0')+' · '+format.names[entry.mode];
      count.textContent=entry.objects.length+' шт.';
      button.dataset.mode=entry.mode;button.setAttribute('aria-pressed',String(index===sectionIndex));
      button.append(label,count);
      button.addEventListener('click',()=>{sectionIndex=index;selected=null;hover=null;tool=entry.objects.length?'select':format.catalog[entry.mode][0].kind;refresh();note('Выбрана секция '+(index+1)+' · '+format.names[entry.mode]+'.')});
      ui.sectionList.append(button);
    });
  }
  function drawTools(){
    ui.toolList.replaceChildren();
    for(const [kind,label] of [['select','Выбрать'],['erase','Ластик'],...specs().map(spec=>[spec.kind,spec.label])]){
      const button=document.createElement('button');button.type='button';button.innerHTML=icon(kind);
      button.dataset.kind=kind;
      const text=document.createElement('span');text.textContent=label;button.append(text);
      button.className=tool===kind?'active':'';
      button.title=label;button.setAttribute('aria-pressed',String(tool===kind));
      button.addEventListener('click',()=>{
        tool=kind;hover=null;drawTools();draw();
        canvas.style.cursor=kind==='select'?'grab':kind==='erase'?'not-allowed':'crosshair';
        note(kind==='select'?'Нажми на объект и перетащи его.':kind==='erase'?'Нажми на объект, чтобы удалить его.':'Выбрано: '+label+'. Нажми на поле, чтобы поставить.');
      });
      ui.toolList.append(button);
    }
  }
  function refresh(){
    ui.mapName.value=map.name;
    ui.sectionMode.value=section().mode;
    ui.sectionTheme.value=section().theme??'';
    ui.sectionBackground.replaceChildren();
    const automatic=document.createElement('option');automatic.value='';automatic.textContent='Автоматический';ui.sectionBackground.append(automatic);
    for(const bg of backgrounds.presets){const option=document.createElement('option');option.value=bg.id;option.textContent=bg.name;ui.sectionBackground.append(option)}
    for(const [id,bg] of Object.entries(map.backgrounds||{})){const option=document.createElement('option');option.value=id;option.textContent='Мой: '+bg.name;ui.sectionBackground.append(option)}
    ui.sectionBackground.value=section().background||'';
    ui.stageName.textContent='Секция '+String(sectionIndex+1).padStart(2,'0')+' · '+format.names[section().mode];
    ui.stageCount.textContent=(section().label?section().label+' · ':'')+section().objects.length+' объектов';
    ui.mapStats.textContent=map.sections.length+' / '+format.maxSections+' секций · '+map.sections.reduce((sum,entry)=>sum+entry.objects.length,0)+' объектов';
    ui.modeHint.textContent={cube:'Ставь объекты в любом месте. Положение и угол меняются под полем.',wave:'Блоки и шипы можно ставить и поворачивать как угодно. Оставляй проход для пилы.',spider:'Объекты можно ставить где угодно. Паук перемещается между полом и потолком.'}[section().mode];
    ui.removeSection.disabled=map.sections.length===1;
    ui.addSection.disabled=map.sections.length>=format.maxSections;
    ui.duplicateSection.disabled=map.sections.length>=format.maxSections;
    ui.sectionLeft.disabled=sectionIndex===0;
    ui.sectionRight.disabled=sectionIndex===map.sections.length-1;
    ui.undoButton.disabled=history.length===0;
    ui.redoButton.disabled=future.length===0;
    ui.clearButton.disabled=!section().objects.length;
    canvas.style.cursor=tool==='select'?'grab':tool==='erase'?'not-allowed':'crosshair';
    drawSectionList();drawTools();updateInspector();draw();
    ui.sectionList.children[sectionIndex]?.scrollIntoView({block:'nearest',inline:'nearest'});
  }
  function updateInspector(){
    const spec=selected?specFor(selected):null;
    const edit=selected?geometry.editable(selected,section().mode):null;
    ui.objectName.closest('.object-inspector').dataset.empty=String(!selected);
    ui.objectName.textContent=spec?.label||'Выбери объект инструментом «Выбрать»';
    ui.objectX.disabled=!selected;ui.objectX.value=edit?.x??'';ui.objectX.step=gridStep();
    ui.objectY.disabled=!selected;ui.objectY.value=edit?.y??'';ui.objectY.step=gridStep();
    ui.objectRotation.disabled=!selected;ui.objectRotation.value=edit?.rotation??'';ui.rotateObject.disabled=!selected;
    ui.duplicateObject.disabled=!selected||section().objects.length>=60;ui.deleteObject.disabled=!selected;
    const limits=selected?format.dimensions[selected.kind]:null;
    ui.sizePanel.hidden=!limits;
    if(!limits)ui.sizePanel.open=false;
    ui.sizeFields.replaceChildren();
    for(const [key,[min,max]] of Object.entries(limits||{})){
      const label=document.createElement('label');label.textContent={width:'Ширина',height:'Высота',count:'Число шипов',gap:'Полуширина прохода'}[key];
      const input=document.createElement('input');input.type='number';input.min=min;input.max=max;input.step=key==='count'?1:10;input.value=spec[key];
      input.addEventListener('change',()=>{const value=Number(input.value);if(!Number.isFinite(value))return;remember();Object.assign(selected,geometry.editable(selected,section().mode));selected[key]=Math.max(min,Math.min(max,Math.round(value)));persist();refresh();note('Размер препятствия изменён.')});
      label.append(input);ui.sizeFields.append(label);
    }
  }
  function polygon(points,fill,stroke='#fff9ee',width=4){
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();
  }
  function rect(x,y,w,h,fill,stroke='#fff9ee'){
    ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);ctx.strokeStyle=stroke;ctx.lineWidth=4;ctx.strokeRect(x+2,y+2,w-4,h-4);
  }
  function saw(cx,cy,r){
    const points=[];
    for(let i=0;i<24;i++){
      const a=i*Math.PI/12,rr=i%2?r*.77:r;
      points.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);
    }
    polygon(points,'#f38f9f');
    ctx.beginPath();ctx.arc(cx,cy,r*.4,0,Math.PI*2);ctx.fillStyle='#243368';ctx.fill();ctx.strokeStyle='#fff9ee';ctx.lineWidth=3;ctx.stroke();
  }
  function drawItem(item){
    const spec=specFor(item);if(!spec)return;
    if(item.free){
      ctx.save();if(item===selected){ctx.shadowColor='#fbd56f';ctx.shadowBlur=16}
      const parts=geometry.parts(item,section().mode);geometry.draw(ctx,parts);ctx.restore();
      if(item===selected){const bounds=geometry.bounds(parts);ctx.strokeStyle='#fbd56f';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.strokeRect(bounds.x-5,bounds.y-5,bounds.w+10,bounds.h+10);ctx.setLineDash([])}
      return;
    }
    const x=item.x,w=spec.width,top=item.lane==='top';
    ctx.save();
    if(item===selected){ctx.shadowColor='#fbd56f';ctx.shadowBlur=18}
    if(section().mode==='cube'){
      if(['spike','miniSpike','singleSpike','singleMiniSpike'].includes(item.kind)){
        const count=spec.count,step=w/count,height=item.kind==='spike'||item.kind==='singleSpike'?48:32,edge=item.y??560;
        for(let i=0;i<count;i++)polygon([[x+i*step,edge],[x+(i+.5)*step,edge-height],[x+(i+1)*step,edge]],'#f38f9f');
      }else if(item.kind==='tileBlock'){
        rect(x,item.y??520,40,40,'#263976');
        ctx.fillStyle='#7893ce88';ctx.fillRect(x+7,(item.y??520)+7,26,5);
      }else if(item.kind==='block'||item.kind==='spikeBlock'){
        const edge=560-spec.height;rect(x,edge,w,spec.height,'#263976');
        if(item.kind==='spikeBlock'){const count=Math.max(2,Math.floor(w/30));for(let i=0;i<count;i++)polygon([[x+i*w/count,edge],[x+(i+.5)*w/count,edge-30],[x+(i+1)*w/count,edge]],'#f38f9f')}
      }else if(item.kind==='platform')rect(x,560-spec.height,w,22,'#263976');
      else if(item.kind==='pit'){ctx.fillStyle='#10183f';ctx.fillRect(x,557,w,163);ctx.strokeStyle='#fff9ee';ctx.lineWidth=4;ctx.strokeRect(x,557,w,163)}
      else if(item.kind==='pad')rect(x,543,w,17,'#ebc869');
      else if(item.kind==='orb'){ctx.beginPath();ctx.arc(x+22,item.y,21,0,Math.PI*2);ctx.fillStyle='#fbd56f';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke()}
      else if(item.kind==='gate')rect(x,425,w,135,'#e6889e');
      else if(item.kind==='sawPair'){saw(x+23,530,23);saw(x+113,530,23)}
      else saw(x+w/2,item.kind==='movingSaw'?490:530,item.kind==='roller'?27:30);
    }else if(section().mode==='wave'){
      if(item.kind==='waveFloor'||item.kind==='waveCeil'){
        const edge=item.kind==='waveFloor'?560:150,dir=item.kind==='waveFloor'?-1:1;
        const count=Math.max(2,Math.round(w/39));for(let i=0;i<count;i++)polygon([[x+i*w/count,edge],[x+(i+.5)*w/count,edge+dir*spec.height],[x+(i+1)*w/count,edge]],'#f38f9f');
      }else if(item.kind==='waveGate'||item.kind==='waveTunnel'){
        const half=spec.gap,gap=item.y,width=w;
        rect(x,150,width,Math.max(5,gap-half-150),'#263976');
        rect(x,gap+half,width,Math.max(5,560-gap-half),'#263976');
      }else if(item.kind==='waveBlock')rect(x,item.y,w,84,'#263976');
      else if(item.kind==='waveDiamond')polygon([[x+w/2,item.y-30],[x+w,item.y],[x+w/2,item.y+30],[x,item.y]],'#f38f9f');
      else saw(x+w/2,item.y,28);
    }else{
      const edge=top?150:560,dir=top?1:-1;
      if(item.kind==='spiderSpike'){const count=Math.max(2,Math.round(w/36));for(let i=0;i<count;i++)polygon([[x+i*w/count,edge],[x+(i+.5)*w/count,edge+dir*48],[x+(i+1)*w/count,edge]],'#f38f9f')}
      else if(item.kind==='spiderBlock')rect(x,top?150:498,w,62,'#263976');
      else saw(x+w/2,edge+dir*27,28);
    }
    ctx.restore();
    if(item===selected){ctx.strokeStyle='#fbd56f';ctx.lineWidth=3;ctx.setLineDash([9,8]);for(const box of boundsFor(item))ctx.strokeRect(box.x-8,box.y-8,box.w+16,box.h+16);ctx.setLineDash([])}
  }
  function draw(){
    ctx.save();ctx.translate(0,-100);
    const mode=section().mode;
    backgrounds.draw(ctx,backgrounds.resolve(section().background||backgrounds.defaults[section().theme??({cube:0,wave:2,spider:1})[mode]],map.backgrounds),1500,720);
    const grid=placementMode==='grid'?gridStep():100,major=grid*5;
    for(let x=0;x<=1500;x+=grid){ctx.strokeStyle=x%major===0?'#ffffff28':'#ffffff10';ctx.lineWidth=x%major===0?2:1;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,720);ctx.stroke()}
    for(let y=0;y<=560;y+=grid){ctx.strokeStyle='#ffffff12';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1500,y);ctx.stroke()}
    if(placementMode==='grid'&&hover){ctx.fillStyle='#efcd7828';ctx.fillRect(Math.floor(hover.x/grid)*grid,Math.floor(hover.y/grid)*grid,grid,grid);ctx.strokeStyle='#efcd7899';ctx.lineWidth=2;ctx.strokeRect(Math.floor(hover.x/grid)*grid,Math.floor(hover.y/grid)*grid,grid,grid)}
    ctx.fillStyle='#18295f';ctx.fillRect(0,560,1500,160);ctx.fillStyle='#fff9ee';ctx.fillRect(0,558,1500,5);
    for(let x=0;x<1500;x+=56){ctx.strokeStyle='#ffffff39';ctx.lineWidth=2;ctx.strokeRect(x,578,56,56)}
    if(mode!=='cube'){
      ctx.fillStyle='#18295f';ctx.fillRect(0,105,1500,45);ctx.fillStyle='#fff9ee';ctx.fillRect(0,148,1500,5);
      for(let x=0;x<1500;x+=56){ctx.strokeStyle='#ffffff39';ctx.lineWidth=2;ctx.strokeRect(x,106,56,42)}
    }
    ctx.fillStyle='#ffffffc2';ctx.font='800 17px Manrope, Arial';ctx.fillText('НАЧАЛО СЕКЦИИ',25,133);ctx.textAlign='right';ctx.fillText('СЛЕДУЮЩАЯ СЕКЦИЯ →',1475,133);ctx.textAlign='left';
    ctx.fillStyle='#fbd56f66';ctx.fillRect(0,165,2,385);ctx.fillRect(1498,165,2,385);
    if(mode==='wave')saw(90,340,22);
    else rect(69,518,42,42,mode==='spider'?'#8bc77a':'#7fcad6');
    ctx.fillStyle='#fff9eec9';ctx.font='800 14px Manrope, Arial';ctx.fillText('ИГРОК',56,mode==='wave'?388:505);
    for(const item of section().objects)drawItem(item);
    const previewSpec=specs().find(spec=>spec.kind===tool)||specs()[0];
    if(hover&&tool!=='select'&&tool!=='erase'&&!dragging){
      const preview={kind:tool,...positionFor({kind:tool},hover,true)};
      ctx.globalAlpha=.55;drawItem(preview);ctx.globalAlpha=1;
    }
    if(!section().objects.length){
      if(!hover){
        const sample={kind:previewSpec.kind,x:760,y:previewSpec.defaultY??340,lane:'bottom'};
        ctx.globalAlpha=.55;drawItem(sample);ctx.globalAlpha=1;
        ctx.fillStyle='#fff9eebd';ctx.font='800 15px Manrope, Arial';ctx.textAlign='center';ctx.fillText('ВЫБЕРИ ПРЕПЯТСТВИЕ И НАЖМИ НА ПОЛЕ',750,295);ctx.textAlign='left';
      }
      ctx.fillStyle='#fff9eebd';ctx.font='800 22px Manrope, Arial';ctx.textAlign='center';ctx.fillText('ПУСТАЯ СЕКЦИЯ',750,245);ctx.textAlign='left';
    }
    ctx.restore();
  }
  function point(event){
    const box=canvas.getBoundingClientRect();
    return {x:(event.clientX-box.left)*1500/box.width,y:100+(event.clientY-box.top)*540/box.height};
  }
  function nearest(p){
    let found=null,best=Infinity;
    for(const item of [...section().objects].reverse()){
      if(item.free){if(geometry.parts(item,section().mode).some(part=>geometry.circleHit(part,p.x,p.y,10)))return item;continue}
      for(const box of boundsFor(item)){
        const dx=Math.max(box.x-p.x,0,p.x-box.x-box.w),dy=Math.max(box.y-p.y,0,p.y-box.y-box.h);
        const score=Math.hypot(dx,dy);
        if(score<best&&score<18){found=item;best=score}
      }
    }
    return found;
  }
  function boundsFor(item){
    if(item.free){const b=geometry.bounds(geometry.parts(item,section().mode));return [{x:b.x,y:b.y,w:b.w,h:b.h}]}
    const spec=specFor(item);if(!spec)return [];
    const x=item.x,w=spec.width,kind=item.kind,box=(y,h)=>[{x,y,w,h}];
    if(section().mode==='spider')return box(item.lane==='top'?150:kind==='spiderBlock'?498:504,kind==='spiderBlock'?62:56);
    if(kind==='waveFloor')return box(560-spec.height,spec.height);
    if(kind==='waveCeil')return box(150,spec.height);
    if(kind==='waveGate'||kind==='waveTunnel')return [{x,y:150,w,h:item.y-spec.gap-150},{x,y:item.y+spec.gap,w,h:560-item.y-spec.gap}];
    if(kind==='waveBlock')return box(item.y,84);
    if(kind==='tileBlock')return box(item.y??520,40);
    if(kind==='singleSpike'||kind==='singleMiniSpike'){
      const height=kind==='singleSpike'?48:32;
      return box((item.y??560)-height,height);
    }
    if(spec.axis==='y')return box(item.y-(kind==='orb'?22:30),kind==='orb'?44:60);
    if(kind==='spike')return box(512,48);
    if(kind==='miniSpike')return box(528,32);
    if(kind==='block')return box(560-spec.height,spec.height);
    if(kind==='spikeBlock')return box(530-spec.height,spec.height+30);
    if(kind==='platform')return box(560-spec.height,22);
    if(kind==='pit')return box(557,163);
    if(kind==='pad')return box(543,17);
    if(kind==='gate')return box(425,135);
    if(kind==='movingSaw')return box(460,60);
    if(kind==='sawPair')return [{x,y:507,w:46,h:46},{x:x+90,y:507,w:46,h:46}];
    return box(500,60);
  }
  function positionFor(item,p,placing=false){
    const edit=geometry.editable(item,section().mode),body=geometry.layout(edit,section().mode),grid=gridStep(),spike=item.kind==='singleSpike'||item.kind==='singleMiniSpike';
    let x,y;
    if(placementMode==='grid'){
      x=(placing?Math.floor(p.x/grid):Math.round(p.x/grid))*grid;
      y=placing?(Math.floor(p.y/grid)+(spike?1:0))*grid-(spike?body.h:0):Math.round((p.y+(spike?body.h:0))/grid)*grid-(spike?body.h:0);
    }else{x=Math.round(p.x-(placing?body.w/2:0));y=Math.round(p.y-(placing?body.h/2:0))}
    x=Math.max(-500,Math.min(1500,x));y=Math.max(-500,Math.min(720,y));
    if(placing&&grid>1&&(item.kind==='singleSpike'||item.kind==='singleMiniSpike')){
      const supports=section().objects.filter(object=>object.kind==='tileBlock'&&!(object.rotation%360)).map(object=>geometry.editable(object,section().mode));
      const support=supports.find(object=>Math.abs(object.x-x)<=2&&p.y>=object.y-body.h&&p.y<=object.y+8);
      if(support)y=support.y-body.h;
    }
    return {...edit,x,y};
  }
  function move(item,p,placing=false){
    Object.assign(item,positionFor(item,p,placing));
    draw();
  }
  function remove(item){
    if(!item)return;
    remember();section().objects.splice(section().objects.indexOf(item),1);selected=null;persist();refresh();note('Препятствие удалено.');
  }
  canvas.addEventListener('pointerdown',event=>{
    document.activeElement?.blur?.();
    event.preventDefault();const p=point(event);
    if(event.button===2||tool==='erase'){remove(nearest(p));return}
    if(tool==='select'){
      selected=nearest(p);
      if(selected){const edit=geometry.editable(selected,section().mode);dragging={item:selected,before:snapshot(),original:JSON.stringify(selected),offsetX:p.x-edit.x,offsetY:p.y-edit.y};canvas.setPointerCapture(event.pointerId)}
      refresh();return;
    }
    const spec=specs().find(value=>value.kind===tool);if(!spec)return;
    if(section().objects.length>=60){note('В одной секции может быть не больше 60 препятствий.');return}
    const item={kind:tool,x:160};
    if(spec.axis==='y')item.y=spec.defaultY??340;
    if(spec.axis==='lane')item.lane='bottom';
    Object.assign(item,positionFor(item,p,true));
    if(section().objects.some(object=>object.free&&object.kind===item.kind&&object.x===item.x&&object.y===item.y&&object.rotation===item.rotation)){note('В этом месте уже есть такой объект.');return}
    remember();
    section().objects.push(item);selected=item;draw();persist();refresh();note(spec.label+' добавлено.');
  });
  canvas.addEventListener('pointermove',event=>{if(dragging){const p=point(event);move(dragging.item,{x:p.x-dragging.offsetX,y:p.y-dragging.offsetY});updateInspector()}else{hover=point(event);draw()}});
  canvas.addEventListener('pointerleave',()=>{hover=null;draw()});
  function endDrag(){if(!dragging)return;const changed=JSON.stringify(dragging.item)!==dragging.original;if(changed)remember(dragging.before);section().objects.sort((a,b)=>a.x-b.x);dragging=null;persist();refresh();if(changed)note('Препятствие перемещено.')}
  canvas.addEventListener('pointerup',endDrag);
  canvas.addEventListener('pointercancel',endDrag);
  canvas.addEventListener('contextmenu',event=>event.preventDefault());

  ui.addSection.addEventListener('click',()=>{
    if(map.sections.length>=format.maxSections)return;
    remember();const order=['cube','wave','spider'],previous=section().mode;
    map.sections.splice(sectionIndex+1,0,{mode:order[(order.indexOf(previous)+1)%3],objects:[]});
    sectionIndex++;selected=null;tool=format.catalog[section().mode][0].kind;persist();refresh();note('Секция добавлена.');
  });
  ui.removeSection.addEventListener('click',()=>{
    if(map.sections.length===1)return;
    remember();map.sections.splice(sectionIndex,1);sectionIndex=Math.min(sectionIndex,map.sections.length-1);
    selected=null;tool='select';persist();refresh();note('Секция удалена.');
  });
  ui.duplicateSection.addEventListener('click',()=>{
    if(map.sections.length>=format.maxSections)return;
    remember();map.sections.splice(sectionIndex+1,0,JSON.parse(JSON.stringify(section())));sectionIndex++;
    selected=null;tool='select';persist();refresh();note('Копия секции добавлена рядом.');
  });
  function reorderSection(direction){
    const target=sectionIndex+direction;if(target<0||target>=map.sections.length)return;
    remember();[map.sections[sectionIndex],map.sections[target]]=[map.sections[target],map.sections[sectionIndex]];
    sectionIndex=target;persist();refresh();note('Порядок секций изменён.');
  }
  ui.sectionLeft.addEventListener('click',()=>reorderSection(-1));
  ui.sectionRight.addEventListener('click',()=>reorderSection(1));
  ui.sectionMode.addEventListener('change',()=>{
    const next=ui.sectionMode.value;
    if(next===section().mode)return;
    if(section().objects.length&&!confirm('При смене формы препятствия этой секции будут удалены. Продолжить?')){ui.sectionMode.value=section().mode;return}
    remember();section().mode=next;section().objects=[];selected=null;tool=format.catalog[next][0].kind;
    persist();refresh();note('Форма секции изменена на «'+format.names[next]+'».');
  });
  ui.sectionTheme.addEventListener('change',()=>{remember();if(ui.sectionTheme.value==='')delete section().theme;else section().theme=Number(ui.sectionTheme.value);persist();refresh();note('Локация секции изменена.')});
  ui.sectionBackground.addEventListener('change',()=>{remember();if(ui.sectionBackground.value)section().background=ui.sectionBackground.value;else delete section().background;persist();refresh();note('Задний фон секции изменён.')});
  ui.backgroundButton.addEventListener('click',()=>{
    const id=section().background,existing=id&&Object.hasOwn(map.backgrounds||{},id),definition=backgrounds.resolve(id||backgrounds.defaults[section().theme??0],map.backgrounds);
    window.GeoRushBackgroundEditor.open({...definition,name:existing?definition.name:definition.name+' · мой'},bg=>{
      if(!existing&&Object.keys(map.backgrounds||{}).length>=16)return 'В карте уже 16 своих фонов. Измени один из них или удали ненужный.';
      const bytes=JSON.stringify(bg).length+Object.entries(map.backgrounds||{}).reduce((sum,[key,value])=>sum+(existing&&key===id?0:JSON.stringify(value).length),0);
      if(bytes>10000000)return 'Фоны карты занимают слишком много места. Удали ненужный фон или сократи рисунок.';
      remember();map.backgrounds??={};const key=existing?id:'custom-'+Date.now().toString(36);map.backgrounds[key]=bg;section().background=key;persist();refresh();note('Свой фон сохранён в карте.');
    },existing?()=>{
      if(!confirm('Удалить этот фон из всех секций карты?'))return false;
      remember();delete map.backgrounds[id];for(const entry of map.sections)if(entry.background===id)delete entry.background;persist();refresh();note('Свой фон удалён. Можно вернуть через отмену.');
    }:null);
  });
  window.addEventListener('georush-background-ready',draw);
  ui.clearButton.addEventListener('click',()=>{
    if(!section().objects.length)return;
    if(!confirm('Удалить все препятствия этой секции?'))return;
    remember();section().objects=[];selected=null;persist();refresh();note('Секция очищена.');
  });
  function undo(){
    const previous=history.pop();if(!previous)return;
    future.push(snapshot());
    map=JSON.parse(previous.map);sectionIndex=previous.index;selected=null;tool='select';persist();refresh();note('Последнее изменение отменено.');
  }
  function redo(){
    const next=future.pop();if(!next)return;history.push(snapshot());
    map=JSON.parse(next.map);sectionIndex=next.index;selected=null;tool='select';persist();refresh();note('Изменение возвращено.');
  }
  function duplicateObject(){
    if(!selected||section().objects.length>=60)return;
    remember();const edit=geometry.editable(selected,section().mode);selected={...edit,x:edit.x<=1380?edit.x+120:edit.x-120};
    section().objects.push(selected);tool='select';persist();refresh();note('Копия объекта добавлена рядом.');
  }
  function editObject(){
    if(!selected)return;
    const x=Number(ui.objectX.value),y=Number(ui.objectY.value),rotation=Number(ui.objectRotation.value);
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(rotation)){updateInspector();return}
    const next={...geometry.editable(selected,section().mode),...(placementMode==='grid'?positionFor(selected,{x,y}):{x:Math.max(-500,Math.min(1500,x)),y:Math.max(-500,Math.min(720,y))}),rotation:geometry.angle(rotation)};
    if(JSON.stringify(next)!==JSON.stringify(selected)){remember();Object.assign(selected,next);section().objects.sort((a,b)=>a.x-b.x);persist();refresh();note('Положение объекта изменено.')}else updateInspector();
  }
  ui.undoButton.addEventListener('click',undo);
  ui.redoButton.addEventListener('click',redo);
  ui.duplicateObject.addEventListener('click',duplicateObject);
  ui.deleteObject.addEventListener('click',()=>remove(selected));
  for(const input of [ui.objectX,ui.objectY,ui.objectRotation])input.addEventListener('change',editObject);
  ui.rotateObject.addEventListener('click',()=>{if(selected){ui.objectRotation.value=Number(ui.objectRotation.value)+90;editObject()}});
  function setPlacementMode(mode){placementMode=mode;ui.modeFree.setAttribute('aria-pressed',String(mode==='free'));ui.modeGrid.setAttribute('aria-pressed',String(mode==='grid'));ui.snapGrid.hidden=mode!=='grid';hover=null;updateInspector();draw();note(mode==='grid'?'Размещение по клеткам. Размер клетки: '+ui.snapGrid.value+' пикселей.':'Свободное размещение. Объекты можно ставить в любой точке.')}
  ui.modeFree.addEventListener('click',()=>setPlacementMode('free'));ui.modeGrid.addEventListener('click',()=>setPlacementMode('grid'));
  ui.snapGrid.addEventListener('change',()=>{updateInspector();draw();note('Размер клетки: '+ui.snapGrid.value+' пикселей.')});
  window.addEventListener('keydown',event=>{
    if(window.GeoRushBackgroundEditor.isOpen())return;
    if(embedded&&event.code==='Escape'){event.preventDefault();persist();window.parent.postMessage({type:'georush-editor-close'},'*');return}
    const typing=/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName);
    if((event.ctrlKey||event.metaKey)&&event.code==='KeyS'){event.preventDefault();download();return}
    if(typing)return;
    if((event.ctrlKey||event.metaKey)&&event.code==='KeyZ'){event.preventDefault();event.shiftKey?redo():undo();return}
    if((event.ctrlKey||event.metaKey)&&event.code==='KeyD'){event.preventDefault();duplicateObject();return}
    if((event.code==='Delete'||event.code==='Backspace')&&selected){event.preventDefault();remove(selected);return}
    if(selected&&['KeyQ','KeyE'].includes(event.code)){event.preventDefault();ui.objectRotation.value=Number(ui.objectRotation.value)+(event.code==='KeyQ'?-1:1)*(event.shiftKey?1:15);editObject();return}
    if(selected&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)){
      event.preventDefault();const edit=geometry.editable(selected,section().mode),step=gridStep()*(event.shiftKey?10:1);
      ui.objectX.value=edit.x+(event.code==='ArrowLeft'?-step:event.code==='ArrowRight'?step:0);
      ui.objectY.value=edit.y+(event.code==='ArrowUp'?-step:event.code==='ArrowDown'?step:0);
      editObject();
    }
  });
  ui.mapName.addEventListener('input',()=>{map.name=ui.mapName.value.trim().slice(0,50)||'Моя карта';persist()});
  ui.newButton.addEventListener('click',()=>{
    if(!confirm('Создать новую карту? Текущий черновик будет заменён. При необходимости сначала скачай .grush.'))return;
    remember();map=emptyMap();sectionIndex=0;selected=null;tool='singleSpike';persist();refresh();note('Новая карта создана.');
  });
  ui.saveButton.addEventListener('click',()=>{note(persist()?'Черновик сохранён в этом браузере.':'Не удалось сохранить черновик.')});
  function download(){
    const clean=format.normalize(map);if(!clean)return;
    const blob=new Blob([JSON.stringify(clean,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=format.fileName(clean.name);document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    note('Карта скачана: '+link.download);
  }
  ui.exportButton.addEventListener('click',download);
  ui.importButton.addEventListener('click',()=>ui.importFile.click());
  function loadOfficialLevel(id){
    const level=window.GeoRushLevels.find(entry=>entry.id===id);if(!level)return;
    remember();map=format.normalize(level.map);sectionIndex=0;selected=null;hover=null;tool='select';
    persist();refresh();note('Открыта копия уровня «'+map.name+'». Её можно изменить и скачать.');
  }
  for(const level of window.GeoRushLevels){const option=document.createElement('option');option.value=level.id;option.textContent=level.name;ui.officialLevel.append(option)}
  ui.officialLevel.addEventListener('change',()=>{loadOfficialLevel(ui.officialLevel.value);ui.officialLevel.value='';ui.officialLevel.closest('details').open=false});
  ui.importFile.addEventListener('change',async()=>{
    const file=ui.importFile.files?.[0];if(!file)return;
    try{
      if(file.size>16*1024*1024)throw Error('Карта больше 16 МБ.');
      const loaded=format.normalize(JSON.parse(await file.text()));
      if(!loaded)throw Error('Неверный формат карты.');
      remember();map=loaded;sectionIndex=0;selected=null;tool='select';persist();refresh();note('Карта «'+map.name+'» открыта.');
    }catch(error){note(error.message||'Не удалось открыть файл.')}
    ui.importFile.value='';
  });
  ui.playButton.addEventListener('click',()=>{
    map.name=ui.mapName.value.trim().slice(0,50)||'Моя карта';persist();
    const clean=format.normalize(map);if(!clean){note('Проверь секции карты.');return}
    if(embedded){window.parent.postMessage({type:'georush-editor-play',map:clean},'*');return}
    pendingPlayMap=clean;playWindow=window.open('./index.html#editor-play','_blank');
    if(!playWindow){const encoded=encodeURIComponent(JSON.stringify(clean));if(encoded.length<1500000)location.href='./index.html#map='+encoded;else note('Разреши всплывающее окно для проверки карты с картинкой.');pendingPlayMap=null}
  });
  window.addEventListener('message',event=>{if(event.source===playWindow&&event.data?.type==='georush-game-ready'&&pendingPlayMap){playWindow.postMessage({type:'georush-editor-play',map:pendingPlayMap},'*');pendingPlayMap=null}});
  ui.backButton.addEventListener('click',()=>{
    persist();
    if(embedded)window.parent.postMessage({type:'georush-editor-close'},'*');
    else location.href='./index.html';
  });
  if(embedded)ui.backButton.textContent='← Закрыть';
  document.addEventListener('click',event=>{
    for(const menu of document.querySelectorAll('.dropdown[open]')){
      if(!menu.contains(event.target)||event.target.closest('button'))menu.open=false;
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')document.querySelectorAll('.dropdown[open]').forEach(menu=>menu.open=false);
  });
  const stage=canvas.parentElement;
  new ResizeObserver(()=>{
    const style=getComputedStyle(stage);
    const width=stage.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
    const height=stage.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
    const scale=Math.min(width/1500,height/540);
    if(scale>0){canvas.style.width=(1500*scale)+'px';canvas.style.height=(540*scale)+'px'}
  }).observe(stage);
  refresh();
  const requestedLevel=new URLSearchParams(location.search).get('level');
  if(requestedLevel){loadOfficialLevel(requestedLevel);const url=new URL(location.href);url.searchParams.delete('level');window.history.replaceState(null,'',url)}
})();
