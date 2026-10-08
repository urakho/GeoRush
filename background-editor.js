(() => {
  'use strict';
  const backgrounds=window.GeoRushBackgrounds;
  const shell=document.createElement('div');shell.className='background-dialog';shell.hidden=true;
  shell.innerHTML=`<div class="background-card" role="dialog" aria-modal="true" aria-labelledby="backgroundTitle">
    <header class="background-header"><div><small>РЕДАКТОР ФОНА</small><h2 id="backgroundTitle">Свой фон</h2></div><button id="bgClose" type="button" aria-label="Закрыть">×</button></header>
    <div class="background-body"><aside class="background-controls">
      <label>Название<input id="bgName" maxlength="50" /></label>
      <div class="background-tabs"><button id="bgSceneTab" type="button">Сцена</button><button id="bgPaintTab" type="button">Рисовать</button></div>
      <div id="bgScenePanel" class="background-panel">
        <label>Пейзаж<select id="bgScene"><option value="city">Город</option><option value="mountains">Горы</option><option value="forest">Лес</option><option value="desert">Дюны</option><option value="canyon">Каньон</option><option value="coast">Море</option><option value="lake">Лесное озеро</option><option value="industrial">Завод</option><option value="castle">Крепость</option><option value="cave">Пещера</option><option value="space">Космос</option><option value="image">Моя картинка</option></select></label>
        <div class="background-colors"><label>Небо<input id="bgSky" type="color" /></label><label>Горизонт<input id="bgHorizon" type="color" /></label><label>Дальний план<input id="bgFar" type="color" /></label><label>Ближний план<input id="bgNear" type="color" /></label><label>Свет<input id="bgGlow" type="color" /></label></div>
        <label>Туман<input id="bgFog" type="range" min="0" max="85" /></label>
        <div class="background-checks"><label><input id="bgNight" type="checkbox" /> Ночь</label><label><input id="bgSun" type="checkbox" /> Солнце / луна</label></div>
        <button id="bgImport" type="button">↑ Загрузить картинку</button><button id="bgRemoveImage" class="quiet-button" type="button" hidden>Убрать картинку</button><small id="bgImageInfo">PNG, JPG или WebP. Картинка сохранится внутри карты.</small><input id="bgFile" type="file" accept="image/png,image/jpeg,image/webp" hidden />
      </div>
      <div id="bgPaintPanel" class="background-panel" hidden>
        <label>Инструмент<select id="bgTool"><option value="stroke">Кисть</option><option value="erase">Ластик</option><option value="mountain">Гора</option><option value="tree">Дерево</option><option value="cloud">Облако</option><option value="building">Здание</option><option value="star">Звезда</option><option value="circle">Круг</option></select></label>
        <label>Цвет<input id="bgInk" type="color" value="#d4dce1" /></label><label>Размер<input id="bgSize" type="range" min="4" max="300" value="40" /></label>
        <div class="background-paint-actions"><button id="bgUndo" type="button">↶ Отменить</button><button id="bgClear" type="button">Очистить рисунок</button></div><small>Рисуй кистью или ставь детали на фоне. Нижнюю часть в игре закроет земля.</small>
      </div>
    </aside><div class="background-preview"><canvas id="backgroundCanvas" width="1500" height="720" aria-label="Рисование и предпросмотр фона"></canvas><p id="bgStatus" role="status">Настрой сцену, загрузи картинку или добавь рисунок.</p></div></div>
    <footer class="background-footer"><button id="bgDelete" class="danger quiet-button" type="button" hidden>Удалить фон</button><span>Фон применяется к выбранной секции.</span><button id="bgApply" class="play-button" type="button" data-ui-sound="menuConfirm">✓ Применить</button></footer>
  </div>`;
  document.body.append(shell);
  const ids=['bgClose','bgName','bgSceneTab','bgPaintTab','bgScenePanel','bgPaintPanel','bgScene','bgSky','bgHorizon','bgFar','bgNear','bgGlow','bgFog','bgNight','bgSun','bgImport','bgRemoveImage','bgImageInfo','bgFile','bgTool','bgInk','bgSize','bgUndo','bgClear','bgStatus','bgApply','bgDelete'];
  const ui=Object.fromEntries(ids.map(id=>[id,shell.querySelector('#'+id)]));
  const canvas=shell.querySelector('canvas'),ctx=canvas.getContext('2d');
  let draft=null,onSave=null,onDelete=null,painting=false,stroke=null,history=[],focusBefore=null;
  const note=text=>ui.bgStatus.textContent=text;
  function draw(){
    if(!draft||shell.hidden)return;
    backgrounds.draw(ctx,draft,1500,720,0,0);
    ctx.fillStyle='#14203966';ctx.fillRect(0,560,1500,160);ctx.fillStyle='#dce6ef88';ctx.fillRect(0,560,1500,2);ctx.font='18px Arial';ctx.fillText('Ниже — игровая земля',24,603);
    ui.bgUndo.disabled=!history.length;ui.bgClear.disabled=!draft.elements.length;
  }
  function sync(){
    ui.bgName.value=draft.name;ui.bgScene.value=draft.scene;
    for(const [id,key] of [['bgSky','sky'],['bgHorizon','horizon'],['bgFar','far'],['bgNear','near'],['bgGlow','glow']])ui[id].value=draft[key];
    ui.bgFog.value=Math.round(draft.fog*100);ui.bgNight.checked=draft.night;ui.bgSun.checked=draft.sun;
    ui.bgScene.querySelector('[value="image"]').disabled=!draft.image;ui.bgRemoveImage.hidden=!draft.image;
    ui.bgImageInfo.textContent=draft.image?draft.imageName+' · картинка внутри .grush':'PNG, JPG или WebP. Картинка сохранится внутри карты.';
    draw();
  }
  function tab(paint){painting=paint;ui.bgPaintPanel.hidden=!paint;ui.bgScenePanel.hidden=paint;ui.bgSceneTab.setAttribute('aria-pressed',String(!paint));ui.bgPaintTab.setAttribute('aria-pressed',String(paint));canvas.style.cursor=paint?'crosshair':'default'}
  function close(){shell.hidden=true;stroke=null;focusBefore?.focus?.()}
  ui.bgClose.addEventListener('click',close);
  ui.bgSceneTab.addEventListener('click',()=>tab(false));ui.bgPaintTab.addEventListener('click',()=>tab(true));
  const change=()=>{draft.name=ui.bgName.value.trim()||'Мой фон';draft.scene=ui.bgScene.value;for(const [id,key] of [['bgSky','sky'],['bgHorizon','horizon'],['bgFar','far'],['bgNear','near'],['bgGlow','glow']])draft[key]=ui[id].value;draft.fog=Number(ui.bgFog.value)/100;draft.night=ui.bgNight.checked;draft.sun=ui.bgSun.checked;draw()};
  for(const id of ['bgName','bgScene','bgSky','bgHorizon','bgFar','bgNear','bgGlow','bgFog','bgNight','bgSun'])ui[id].addEventListener('input',change);
  const remember=()=>{history.push(JSON.stringify(draft.elements));if(history.length>25)history.shift()};
  const undo=()=>{if(!history.length)return;draft.elements=JSON.parse(history.pop());draw()};
  ui.bgUndo.addEventListener('click',undo);ui.bgClear.addEventListener('click',()=>{remember();draft.elements=[];draw()});
  ui.bgImport.addEventListener('click',()=>ui.bgFile.click());
  ui.bgRemoveImage.addEventListener('click',()=>{delete draft.image;delete draft.imageName;draft.scene='mountains';sync()});
  ui.bgFile.addEventListener('change',async()=>{
    const file=ui.bgFile.files?.[0];if(!file)return;
    try{
      if(file.size>12*1024*1024)throw Error('Выбери картинку до 12 МБ.');
      note('Открываю картинку…');
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Не удалось прочитать картинку.'));reader.readAsDataURL(file)});
      const img=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Не удалось открыть картинку.'));img.src=data});
      const resized=document.createElement('canvas'),scale=Math.min(1,1280/img.naturalWidth,720/img.naturalHeight);resized.width=Math.max(1,Math.round(img.naturalWidth*scale));resized.height=Math.max(1,Math.round(img.naturalHeight*scale));resized.getContext('2d').drawImage(img,0,0,resized.width,resized.height);
      draft.image=resized.toDataURL('image/webp',.82);draft.imageName=file.name;draft.scene='image';sync();note('Картинка загружена. Можно дорисовать детали.');
    }catch(error){note(error.message)}
    ui.bgFile.value='';
  });
  function point(event){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1500,Math.round((event.clientX-r.left)*1500/r.width))),Math.max(0,Math.min(720,Math.round((event.clientY-r.top)*720/r.height)))]}
  function erase([x,y]){
    const radius=Number(ui.bgSize.value)/2;
    const index=draft.elements.findLastIndex(item=>item.type==='stroke'?item.points.some(p=>Math.hypot(p[0]-x,p[1]-y)<radius+item.width/2):Math.hypot(item.x-x,item.y-y)<radius+item.size*.65);
    if(index>=0)draft.elements.splice(index,1);
  }
  canvas.addEventListener('pointerdown',event=>{
    if(!painting||!draft)return;event.preventDefault();canvas.setPointerCapture(event.pointerId);remember();const p=point(event),type=ui.bgTool.value;
    if(type==='erase'){stroke={erase:true};erase(p)}
    else if(draft.elements.length>=200){history.pop();note('На фоне уже 200 деталей. Удали часть ластиком.');return}
    else if(type==='stroke'){stroke={type,color:ui.bgInk.value,width:Math.min(80,Number(ui.bgSize.value)),points:[p]};draft.elements.push(stroke)}
    else{draft.elements.push({type,color:ui.bgInk.value,size:Number(ui.bgSize.value),x:p[0],y:p[1]});stroke=null}
    draw();
  });
  canvas.addEventListener('pointermove',event=>{if(!stroke)return;const p=point(event);if(stroke.erase)erase(p);else if(stroke.points.length<600&&Math.hypot(p[0]-stroke.points.at(-1)[0],p[1]-stroke.points.at(-1)[1])>2)stroke.points.push(p);draw()});
  for(const name of ['pointerup','pointercancel'])canvas.addEventListener(name,()=>{stroke=null});
  ui.bgApply.addEventListener('click',()=>{change();const clean=backgrounds.normalize(draft),result=onSave(clean);if(typeof result==='string')note(result);else if(result!==false)close()});
  ui.bgDelete.addEventListener('click',()=>{if(onDelete?.()!==false)close()});
  window.addEventListener('georush-background-ready',draw);
  window.addEventListener('keydown',event=>{
    if(shell.hidden)return;
    if(event.code==='Tab'){const controls=[...shell.querySelectorAll('button,input,select')].filter(el=>!el.disabled&&el.getClientRects().length),first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
    if(event.code==='Escape'){event.preventDefault();event.stopImmediatePropagation();close()}
    if((event.ctrlKey||event.metaKey)&&event.code==='KeyS'){event.preventDefault();event.stopImmediatePropagation();ui.bgApply.click()}
    if(painting&&(event.ctrlKey||event.metaKey)&&event.code==='KeyZ'&&!/INPUT|SELECT/.test(event.target.tagName)){event.preventDefault();event.stopImmediatePropagation();undo()}
  },true);
  window.GeoRushBackgroundEditor={isOpen:()=>!shell.hidden,open(definition,save,remove){draft=backgrounds.normalize(definition);onSave=save;onDelete=remove;history=[];focusBefore=document.activeElement;shell.hidden=false;ui.bgDelete.hidden=!remove;tab(false);sync();note('Настрой сцену, загрузи картинку или добавь рисунок.');ui.bgName.focus()}};
})();
