(() => {
  'use strict';
  const scenes=['city','mountains','forest','desert','canyon','coast','lake','industrial','castle','cave','space','image'];
  const presets=[
    ['harbor','Утренний причал','coast','#35546e','#d5b491','#74949d','#263f50','#f6dcad',false],
    ['city-night','Ночной город','city','#18283d','#596576','#4c6278','#1d3147','#e6d4b4',true],
    ['mountains','Горная долина','mountains','#365c7d','#b5c5c8','#7b9bad','#304e67','#e5dfc1',false],
    ['forest','Туманный лес','forest','#36595e','#a1b8a7','#648782','#203e3c','#dbe3b9',false],
    ['desert','Золотые дюны','desert','#685267','#ddb084','#b18b74','#705341','#ffd49a',false],
    ['coast','Морские скалы','coast','#346678','#b7d1cb','#668e96','#254a59','#e8e5bd',false],
    ['winter','Снежные вершины','mountains','#435f7b','#d8e0e2','#9aafbd','#3b566f','#f6f0d8',false],
    ['industrial','Старый завод','industrial','#334958','#b6aaa0','#79858c','#293f48','#e5b77d',false],
    ['canyon','Красный каньон','canyon','#565574','#e8b6a0','#b68779','#734c46','#f4ca9d',false],
    ['castle','Крепость в тумане','castle','#3e465e','#bcaeb2','#7b788e','#383d56','#e4c8a3',false],
    ['cave','Подземное озеро','cave','#172a3d','#385e70','#315063','#152e40','#b0d9d1',true],
    ['space','Звёздное плато','space','#152039','#53607e','#465374','#202f4c','#dedcc8',true],
    ['sky-route','Небесный маршрут','mountains','#45688a','#d8d2c8','#93aabe','#3c5971','#f5e3bb',false],
    ['spider-factory','Паучья фабрика','industrial','#172b3b','#65757c','#3d5a68','#152e3b','#e2b78a',true],
    ['three-worlds','Закат над крепостью','castle','#54435b','#d5a28b','#936d7d','#493d55','#f1c593',false],
    ['lake','Лесное озеро','lake','#284b63','#b3c4bb','#70989a','#244a4e','#ecdfb7',false]
  ].map(([id,name,scene,sky,horizon,far,near,glow,night])=>({id,art:id,name,scene,sky,horizon,far,near,glow,night,fog:.28,sun:true,elements:[]}));
  const defaults=['city-night','industrial','cave','castle','space'];
  const images=new Map();
  const color=(v,f)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:f;
  const limit=(v,min,max,f)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):f;
  function normalize(raw){
    if(!raw||typeof raw!=='object')return null;
    const base=presets[2];
    const bg={name:typeof raw.name==='string'?raw.name.trim().slice(0,50)||'Мой фон':'Мой фон',scene:scenes.includes(raw.scene)?raw.scene:'mountains',sky:color(raw.sky,base.sky),horizon:color(raw.horizon,base.horizon),far:color(raw.far,base.far),near:color(raw.near,base.near),glow:color(raw.glow,base.glow),night:!!raw.night,sun:raw.sun!==false,fog:limit(raw.fog,0,.85,.28),elements:[]};
    if(presets.some(preset=>preset.id===raw.art))bg.art=raw.art;
    if(typeof raw.image==='string'&&raw.image.length<1500000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(raw.image)){bg.image=raw.image;bg.imageName=String(raw.imageName||'Моя картинка').slice(0,60)}
    if(bg.scene==='image'&&!bg.image)bg.scene='mountains';
    for(const item of (Array.isArray(raw.elements)?raw.elements:[]).slice(0,200)){
      if(!item||!['stroke','mountain','tree','cloud','building','star','circle'].includes(item.type))continue;
      const common={type:item.type,color:color(item.color,'#d4dce1')};
      if(item.type==='stroke'){
        const points=(Array.isArray(item.points)?item.points:[]).filter(p=>Array.isArray(p)&&Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1]))).slice(0,600).map(p=>[limit(p[0],0,1500,0),limit(p[1],0,720,0)]);
        if(points.length)bg.elements.push({...common,width:limit(item.width,2,80,12),points});
      }else bg.elements.push({...common,x:limit(item.x,0,1500,750),y:limit(item.y,0,720,360),size:limit(item.size,15,350,100)});
    }
    return bg;
  }
  function resolve(id,custom={}){return custom?.[id]||presets.find(bg=>bg.id===id)||presets[2]}
  function imageFor(data){
    if(!data)return null;
    if(!images.has(data)){
      if(images.size>24)images.delete(images.keys().next().value);
      const img=new Image();images.set(data,img);img.onload=()=>window.dispatchEvent(new Event('georush-background-ready'));img.src=data;
    }
    const img=images.get(data);return img.complete&&img.naturalWidth?img:null;
  }
  const hash=n=>{n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return ((n^(n>>>16))>>>0)/4294967296};
  function noise(x,salt){const i=Math.floor(x),t=x-i,s=t*t*(3-2*t);return hash(i+salt)*(1-s)+hash(i+1+salt)*s}
  function ridge(ctx,fill,drift,layer,scene){
    const base=565+layer*16,mountain=['mountains','space','cave'].includes(scene),mesa=scene==='canyon',points=[[-30,720]];
    const height=x=>{
      const world=x+drift;
      if(mesa)return base-65-(Math.round(noise(world/280,layer*131+42)*4)/4)*160;
      return base-(mountain?85:42)-noise(world/(mountain?220:460),layer*131+42)*(mountain?185:90)-noise(world/72,layer*57+123)*(mountain?42:12);
    };
    for(let x=-30;x<=1530;x+=18)points.push([x,height(x)]);points.push([1530,720]);path(ctx,points,fill);
    if(scene==='mountains'&&layer===1){
      for(let x=-12;x<1512;x+=18){const y=height(x);if(y<height(x-18)&&y<height(x+18)&&y<base-155)path(ctx,[[x-30,y+30],[x,y],[x+35,y+35],[x+8,y+24],[x-8,y+29]],'#e6e8e47a')}
    }
    if(mesa){ctx.strokeStyle='#efc5ae28';ctx.lineWidth=3;for(let band=0;band<4;band++){ctx.beginPath();for(let x=-30;x<=1530;x+=18){const y=height(x)+28+band*20; x===-30?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()}}
  }
  function path(ctx,points,fill){ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fillStyle=fill;ctx.fill()}
  function cloud(ctx,x,y,size,color,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,size*.64,size*.2,0,0,Math.PI*2);ctx.ellipse(x-size*.22,y-size*.1,size*.24,size*.23,0,0,Math.PI*2);ctx.ellipse(x+size*.13,y-size*.15,size*.31,size*.28,0,0,Math.PI*2);ctx.fill();ctx.restore()}
  function tree(ctx,x,y,size,color){path(ctx,[[x,y-size],[x-size*.32,y-size*.3],[x-size*.12,y-size*.3],[x-size*.45,y],[x+size*.45,y],[x+size*.12,y-size*.3],[x+size*.32,y-size*.3]],color);ctx.fillStyle=color;ctx.fillRect(x-size*.04,y,size*.08,size*.16)}
  function stamp(ctx,item){
    const {x,y,size:s,color:c}=item;
    if(item.type==='stroke'){
      ctx.beginPath();ctx.moveTo(...item.points[0]);for(let i=1;i<item.points.length;i++)ctx.lineTo(...item.points[i]);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=c;ctx.lineWidth=item.width;ctx.stroke();if(item.points.length===1){ctx.beginPath();ctx.arc(...item.points[0],item.width/2,0,Math.PI*2);ctx.fillStyle=c;ctx.fill()}return;
    }
    if(item.type==='tree')tree(ctx,x,y,s,c);
    else if(item.type==='cloud')cloud(ctx,x,y,s,c);
    else if(item.type==='mountain'){path(ctx,[[x-s*.8,y+s*.45],[x,y-s*.7],[x+s*.8,y+s*.45]],c);path(ctx,[[x-s*.22,y-s*.37],[x,y-s*.7],[x+s*.24,y-s*.35],[x+s*.05,y-s*.43],[x-s*.08,y-s*.35]],'#e6e8e4aa')}
    else if(item.type==='building'){ctx.fillStyle=c;ctx.fillRect(x-s*.35,y-s,s*.7,s);ctx.fillStyle='#eadca580';for(let yy=y-s+15;yy<y-10;yy+=22)for(let xx=x-s*.35+10;xx<x+s*.3;xx+=20)ctx.fillRect(xx,yy,6,9)}
    else if(item.type==='star'){const points=Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,r=i%2?s*.2:s*.45;return [x+Math.cos(a)*r,y+Math.sin(a)*r]});path(ctx,points,c)}
    else{ctx.beginPath();ctx.arc(x,y,s/2,0,Math.PI*2);ctx.fillStyle=c;ctx.fill()}
  }
  function draw(ctx,definition,width,height,camera=0,time=0){
    const bg=definition||presets[2],opacity=ctx.globalAlpha;ctx.save();ctx.scale(width/1500,height/720);ctx.beginPath();ctx.rect(0,0,1500,720);ctx.clip();
    const sky=ctx.createLinearGradient(0,0,0,620);sky.addColorStop(0,bg.sky);sky.addColorStop(.72,bg.horizon);sky.addColorStop(1,bg.far);ctx.fillStyle=sky;ctx.fillRect(0,0,1500,720);
    if(bg.scene==='image'&&bg.image){
      const img=imageFor(bg.image);if(img){const scale=Math.max(1500/img.naturalWidth,720/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;ctx.drawImage(img,(1500-w)/2,(720-h)/2,w,h)}
    }else if(window.GeoRushBackdropArt){
      window.GeoRushBackdropArt.draw(ctx,bg,camera,time);
    }else{
      if(bg.night||bg.scene==='space'||bg.scene==='cave')for(let i=0;i<100;i++){const x=hash(i+6)*1500,y=hash(i+916)*330,r=.7+hash(i+447)*1.1;ctx.globalAlpha=opacity*(.2+hash(i+99)*.55);ctx.fillStyle='#e8edf1';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=opacity;
      if(bg.sun&&bg.scene!=='cave'){
        const x=1120,y=bg.night?135:235,r=bg.night?40:59,glow=ctx.createRadialGradient(x,y,0,x,y,r*3.8);glow.addColorStop(0,bg.glow+'78');glow.addColorStop(1,bg.glow+'00');ctx.fillStyle=glow;ctx.fillRect(x-r*4,y-r*4,r*8,r*8);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=bg.glow+'d0';ctx.fill();if(bg.night){ctx.beginPath();ctx.arc(x+19,y-10,r*.91,0,Math.PI*2);ctx.fillStyle=bg.sky;ctx.fill()}
      }
      if(!['space','cave'].includes(bg.scene))for(let i=-1;i<5;i++){const x=i*410+hash(i+23)*130-((camera*.025+time*3)%410),y=65+hash(i+51)*150;cloud(ctx,x,y,90+hash(i+19)*165,bg.horizon,.14)}
      for(let layer=0;layer<3;layer++){
        const spacing=layer===0?390:layer===1?270:150,drift=camera*[.022,.065,.14][layer],start=Math.floor(drift/spacing)-1,fill=layer===0?bg.far:layer===1?bg.far:bg.near;
        ctx.globalAlpha=opacity*(layer===0?.38:layer===1?.65:.84);
        if(['mountains','space','cave','canyon'].includes(bg.scene)||layer===0){
          ridge(ctx,fill,drift,layer,bg.scene);
          if(bg.scene==='cave'){const points=[[-30,0]];for(let x=-30;x<=1530;x+=25)points.push([x,55+noise((x+drift)/170,layer*121+66)*110+noise((x+drift)/42,layer*29+83)*35]);points.push([1530,0]);path(ctx,points,fill)}
          ctx.globalAlpha=opacity;continue;
        }
        for(let i=start;i<start+Math.ceil(1500/spacing)+3;i++){
          const x=i*spacing-drift,r=hash(i+301+layer*37),base=560+layer*16,h=(70+r*110)*(layer===0?1.8:layer===1?1.3:1);
          if(bg.scene==='desert'){
            ctx.beginPath();ctx.moveTo(x-60,base+70);ctx.bezierCurveTo(x+spacing*.1,base-h*.9,x+spacing*.65,base-h*.3,x+spacing+70,base+60);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(layer===2&&r>.65){ctx.fillRect(x+70,base-130,28,130);ctx.fillRect(x+57,base-100,55,20)}
          }else if(bg.scene==='forest'||bg.scene==='lake'&&layer===1){tree(ctx,x+20+r*70,base,h+25,fill);tree(ctx,x+115,base,h*.7,fill);ctx.fillStyle=fill;ctx.fillRect(x,base,spacing+1,160)}
          else if(bg.scene==='coast'||bg.scene==='lake'){
            if(bg.scene==='lake'){ctx.fillStyle=bg.far;ctx.fillRect(x,460,spacing+1,180);ctx.strokeStyle=bg.horizon+'55';ctx.lineWidth=2;for(let k=0;k<9;k++){ctx.beginPath();ctx.moveTo(x+hash(i+k+71)*100,475+k*10);ctx.lineTo(x+70+hash(i+k+71)*80,475+k*10);ctx.stroke()}continue}
            if(layer===1){ctx.fillStyle=bg.far;ctx.fillRect(x,465,spacing+1,180);ctx.strokeStyle=bg.horizon+'88';ctx.lineWidth=1;for(let k=0;k<9;k++){ctx.beginPath();ctx.moveTo(x+hash(i+k+71)*100,477+k*10);ctx.lineTo(x+80+hash(i+k+71)*110,477+k*10);ctx.stroke()}}
            else{path(ctx,[[x-20,base+100],[x+35,base-h*.36],[x+110,base-h*.5],[x+spacing+25,base+100]],fill);if(i%5===0){ctx.fillStyle=bg.horizon;ctx.fillRect(x+65,base-h*.5-90,16,90);ctx.fillStyle=bg.near;ctx.fillRect(x+61,base-h*.5-99,24,11);ctx.fillStyle=bg.glow;ctx.fillRect(x+67,base-h*.5-93,12,7)}}
          }else if(bg.scene==='castle'){
            ctx.fillStyle=fill;ctx.fillRect(x,base-h*.52,spacing+2,h*.52+100);ctx.fillRect(x+38,base-h,46,h);for(let k=0;k<4;k++)ctx.fillRect(x+34+k*14,base-h-10,9,14);ctx.fillStyle=bg.glow+'55';ctx.fillRect(x+54,base-h+29,12,22)
          }else{
            const building=bg.scene==='city',bw=spacing*.67;ctx.fillStyle=fill;ctx.fillRect(x+14,base-h,bw,h+100);
            if(building){ctx.fillRect(x+37,base-h-14,bw*.5,14);ctx.strokeStyle=fill;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+57,base-h);ctx.lineTo(x+57,base-h-35);ctx.stroke();ctx.fillStyle=bg.glow+(bg.night?'95':'40');for(let yy=base-h+15;yy<base-10;yy+=25)for(let xx=x+25;xx<x+bw;xx+=23)if(hash(Math.floor(xx+yy))>.35)ctx.fillRect(xx,yy,7,11)}
            else{ctx.fillRect(x+35,base-h-63,14,65);ctx.fillRect(x+65,base-h-35,12,35);ctx.strokeStyle=bg.horizon+'55';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x+2,base-65);ctx.lineTo(x+spacing-5,base-65);ctx.stroke();cloud(ctx,x+40,base-h-80,h*.45,bg.horizon,.15);ctx.fillStyle=bg.glow+'77';ctx.fillRect(x+30,base-90,10,22)}
          }
        }ctx.globalAlpha=opacity;
      }
      const haze=ctx.createLinearGradient(0,320,0,600);haze.addColorStop(0,bg.horizon+'00');haze.addColorStop(.7,bg.horizon+Math.round(bg.fog*140).toString(16).padStart(2,'0'));haze.addColorStop(1,bg.near+'10');ctx.fillStyle=haze;ctx.fillRect(0,310,1500,300);
    }
    for(const element of bg.elements||[])stamp(ctx,element);
    ctx.restore();
  }
  window.GeoRushBackgrounds={presets,scenes,defaults,normalize,resolve,draw,stamp};
})();
