(() => {
  'use strict';
  // All artwork is drawn locally. Expensive detail is painted once into bounded canvas layers.
  const WIDTH=1800,HEIGHT=720,cache=new Map();
  const variants={city:'city-night',mountains:'mountains',forest:'forest',desert:'desert',canyon:'canyon',coast:'coast',lake:'lake',industrial:'industrial',castle:'castle',cave:'cave',space:'space'};
  const sceneOf={harbor:'coast','city-night':'city',mountains:'mountains',forest:'forest',desert:'desert',coast:'coast',winter:'mountains',industrial:'industrial',canyon:'canyon',castle:'castle',cave:'cave',space:'space','sky-route':'mountains','spider-factory':'industrial','three-worlds':'castle',lake:'lake'};
  const rand=n=>{n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return ((n^(n>>>16))>>>0)/4294967296};
  const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
  function poly(c,p,fill){c.beginPath();c.moveTo(...p[0]);for(const q of p.slice(1))c.lineTo(...q);c.closePath();c.fillStyle=fill;c.fill()}
  function line(c,p,color,width=1){c.beginPath();c.moveTo(...p[0]);for(const q of p.slice(1))c.lineTo(...q);c.strokeStyle=color;c.lineWidth=width;c.stroke()}
  function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill()}
  function gradient(c,x,y,w,h,stops){const g=c.createLinearGradient(x,y,x,y+h);for(const [at,color] of stops)g.addColorStop(at,color);c.fillStyle=g;c.fillRect(x,y,w,h)}
  function glow(c,x,y,r,color,alpha=.2){c.save();c.globalAlpha*=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore()}
  function cloud(c,x,y,w,color,alpha=.2){c.save();c.globalAlpha*=alpha;for(let i=0;i<11;i++)ellipse(c,x+i*w/11,y+Math.sin(i*1.2)*w*.035,w*(.065+rand(i+Math.floor(x))*.035),w*(.018+rand(i+33)*.035),color);c.restore()}
  function stone(c,x,y,w,h,base,seed=1){gradient(c,x,y,w,h,[[0,mix(base,'#d8c5a8',.13)],[1,base]]);c.save();c.beginPath();c.rect(x,y,w,h);c.clip();for(let row=0;row<h/19;row++){const yy=y+row*19;line(c,[[x,yy],[x+w,yy]],'#101b2b28');for(let xx=x-(row%2)*24;xx<x+w;xx+=46){line(c,[[xx,yy],[xx,yy+19]],'#101b2b35');if(rand(row*41+Math.floor(xx)+seed)>.6)line(c,[[xx+3,yy+3],[xx+35,yy+3]],'#e8d5bd20')}}c.restore()}
  function pine(c,x,y,h,color,seed=0,snow=false){
    const trunk=h*.045;c.fillStyle=mix(color,'#4c352d',.25);c.fillRect(x-trunk/2,y-h*.75,trunk,h*.83);
    for(let i=0;i<9;i++){const yy=y-h+i*h*.092,w=h*(.06+i*.026),p=[[x,yy-h*.1],[x-w*.9,yy+h*.13],[x-w*.55,yy+h*.1],[x-w,yy+h*.19],[x+w*.9,yy+h*.19],[x+w*.5,yy+h*.1]];poly(c,p,mix(color,'#101c28',rand(seed+i)*.13));if(snow)line(c,[[x-w*.7,yy+h*.12],[x,yy-h*.07],[x+w*.7,yy+h*.12]],'#dce7e68c',Math.max(1,h*.013))}
  }
  function deciduous(c,x,y,h,color,seed=0){
    const trunk=mix(color,'#4c382d',.3);line(c,[[x,y],[x+6,y-h*.62],[x-8,y-h*.93]],trunk,h*.033);
    for(let branch=0;branch<7;branch++){const side=branch%2?1:-1,yy=y-h*(.38+branch*.063),xx=x+side*h*(.18+rand(seed+branch)*.16);line(c,[[x+5,yy+h*.08],[xx,yy-h*.14],[xx+side*h*.055,yy-h*.25]],trunk,h*(.015-branch*.001));}
    for(let i=0;i<95;i++){const a=rand(seed+i)*Math.PI*2,r=Math.sqrt(rand(seed+i+201))*h*.31,xx=x+Math.cos(a)*r,yy=y-h*.71+Math.sin(a)*r*.78,s=h*(.028+rand(i+42)*.045);ellipse(c,xx,yy,s,s*.75,mix(color,yy<y-h*.72?'#9db497':'#172b31',.08+rand(seed+i+281)*.24))}
    line(c,[[x-4,y],[x+2,y-h*.45]],'#d6c7a91a',Math.max(1,h*.006));
  }
  function mountains(c,peaks,base,color,snow=false){
    const silhouette=[[0,base]];for(const [x,y,w] of peaks){for(let i=-8;i<=8;i++){const t=i/8,yy=y+(base-y)*Math.abs(t)**.78+Math.sin(i*2.1+x)*w*.027*Math.abs(t);silhouette.push([x+t*w,yy])}}silhouette.push([WIDTH,base],[WIDTH,720],[0,720]);
    const fill=c.createLinearGradient(0,120,0,base);fill.addColorStop(0,mix(color,'#c5d1d5',.16));fill.addColorStop(1,mix(color,'#192d40',.09));poly(c,silhouette,fill);
    for(const [x,y,w] of peaks){poly(c,[[x,y],[x+w*.15,y+45],[x+w*.21,y+32],[x+w*.5,y+(base-y)*.6],[x+w,base],[x+w*.16,base],[x-w*.045,y+86],[x-w*.07,y+52]],mix(color,'#132a3e',.24));for(let k=0;k<12;k++){const xx=x+(k-6)*w*.04,yy=y+50+Math.abs(k-6)*12;line(c,[[xx,yy],[xx+w*.08,yy+35],[xx+w*.055,yy+80],[x+w*(k-3)*.08,base-12]],k%3?'#c5d4df24':'#182f412c',1+k%3)}if(snow)poly(c,[[x-w*.23,y+65],[x-w*.13,y+40],[x,y],[x+w*.17,y+45],[x+w*.29,y+87],[x+w*.12,y+65],[x+w*.08,y+81],[x-w*.03,y+42],[x-w*.12,y+71]],'#e8eff0b5')}
  }
  function water(c,y,b,seed=1){gradient(c,0,y,WIDTH,720-y,[[0,mix(b.far,b.sky,.4)],[.48,b.far],[1,b.near]]);for(let i=0;i<240;i++){const yy=y+rand(i+seed)*190,x=rand(i+seed+703)*WIDTH,length=6+rand(i+37)*70;line(c,[[x,yy],[x+length,yy]],i%5===0?b.glow+'50':b.horizon+'27',.7+rand(i+71)*1.5)}}
  function windows(c,x,y,w,h,color,seed,lit=true){for(let yy=y+15;yy<y+h-10;yy+=24)for(let xx=x+10;xx<x+w-8;xx+=21){c.fillStyle=lit&&rand(Math.floor(xx+yy)+seed)>.44?color+'a0':'#14263870';c.fillRect(xx,yy,6,10);line(c,[[xx-2,yy+12],[xx+8,yy+12]],'#c5c8cd22')}}
  function building(c,x,y,w,h,b,seed=1){stone(c,x,y,w,h,b.near,seed);poly(c,[[x-5,y],[x+w*.18,y-22],[x+w*.86,y-22],[x+w+5,y]],mix(b.near,'#0b1626',.3));windows(c,x,y,w,h,b.glow,seed,b.night);c.fillStyle=b.near;c.fillRect(x+w*.7,y-36,12,30)}
  function bridge(c,x,y,w,h,color,arches=5){stone(c,x,y,w,h,color);c.save();c.globalCompositeOperation='destination-out';for(let i=0;i<arches;i++){const step=w/arches,xx=x+(i+.5)*step;c.beginPath();c.arc(xx,y+h*.52,step*.33,Math.PI,0);c.lineTo(xx+step*.33,y+h+2);c.lineTo(xx-step*.33,y+h+2);c.closePath();c.fill()}c.restore();line(c,[[x,y-8],[x+w,y-8]],mix(color,'#d4c8b3',.25),6);for(let xx=x;xx<x+w;xx+=15)line(c,[[xx,y-15],[xx,y-2]],color,2)}
  function sailboat(c,x,y,s,b){poly(c,[[x-s*.5,y],[x+s*.55,y],[x+s*.35,y+s*.18],[x-s*.3,y+s*.16]],b.near);line(c,[[x,y+s*.06],[x,y-s]],b.near,3);poly(c,[[x-3,y-s*.9],[x-s*.45,y-s*.12],[x-3,y-s*.15]],mix(b.horizon,'#ecdfc3',.5));poly(c,[[x+5,y-s*.73],[x+s*.37,y-s*.16],[x+5,y-s*.12]],mix(b.horizon,'#c3bdad',.25));line(c,[[x-s*.38,y-s*.05],[x,y-s],[x+s*.42,y-s*.04]],b.near+'99');line(c,[[x,y+s*.2],[x,y+s*.55]],b.horizon+'50',2)}
  function crane(c,x,y,h,color){line(c,[[x,y],[x+8,y-h],[x+70,y-h-25],[x+175,y-h+12]],color,7);line(c,[[x+8,y-h],[x+175,y-h+12],[x+40,y-h+20],[x+70,y-h-25]],color,2);line(c,[[x+170,y-h+10],[x+170,y-h+120]],color,2);ellipse(c,x+170,y-h+122,5,7,color)}
  function fog(c,y,b,amount=.35){gradient(c,0,y,WIDTH,150,[[0,b.horizon+'00'],[.55,b.horizon+Math.round(amount*120).toString(16).padStart(2,'0')],[1,b.horizon+'00']])}
  function stars(c,b,seed=1){for(let i=0;i<250;i++){const x=rand(i+seed)*WIDTH,y=rand(i+seed+523)*420,r=.5+rand(i+31)*1.1;ellipse(c,x,y,r,r,'#dbe7ee'+Math.floor(45+rand(i+23)*140).toString(16));if(i%53===0){line(c,[[x-4,y],[x+4,y]],'#e6edf855');line(c,[[x,y-4],[x,y+4]],'#e6edf855')}}}
  function sky(c,b,id){
    gradient(c,0,0,WIDTH,HEIGHT,[[0,b.sky],[.64,b.horizon],[1,mix(b.horizon,b.near,.55)]]);
    if(b.night||id==='space')stars(c,b,13);
    if(id==='cave')return;
    const positions={harbor:[280,305],mountains:[1270,170],forest:[530,155],desert:[250,235],coast:[1470,125],winter:[1330,130],industrial:[380,240],canyon:[1450,210],castle:[700,180],'sky-route':[430,180],'three-worlds':[1170,310],lake:[410,230],'city-night':[1300,110],'spider-factory':[400,145],space:[1310,200]};
    const [x,y]=positions[id]||[1180,200];
    if(b.sun&&!['forest','industrial','spider-factory','space'].includes(id)){glow(c,x,y,id==='three-worlds'?260:170,b.glow,.4);ellipse(c,x,y,b.night?30:38,b.night?30:38,b.glow+'b0');if(b.night)ellipse(c,x+13,y-7,29,29,b.sky)}
    if(id==='space')return;
    for(let i=0;i<11;i++){const xx=rand(i+39)*WIDTH,yy=40+rand(i+239)*180;cloud(c,xx,yy,90+rand(i+21)*250,b.horizon,id==='industrial'?.25:.13)}
    // Long high clouds and illuminated streaks break the empty gradient sky.
    for(let i=0;i<35;i++){const xx=rand(i+215)*WIDTH,yy=45+rand(i+847)*240;c.save();c.globalAlpha=.035+rand(i+931)*.07;c.beginPath();c.moveTo(xx,yy);c.bezierCurveTo(xx+80,yy-14,xx+180,yy+9,xx+280,yy-5);c.strokeStyle=b.glow;c.lineWidth=2+rand(i+302)*9;c.stroke();c.restore()}
  }
  function harbor(d,m,f,b){
    mountains(d,[[220,285,340],[820,230,380],[1490,300,390]],450,mix(b.far,b.horizon,.3));
    for(let i=0;i<25;i++){const x=i*76,y=350-rand(i+18)*75;d.fillStyle=b.far;d.fillRect(x,y,58,115);windows(d,x,y,58,90,b.glow,i,false)}
    water(d,447,b,43);bridge(m,0,405,640,116,b.far,7);
    for(const [x,y,w,h] of [[820,360,125,155],[980,320,150,195],[1190,375,160,140],[1450,330,200,190]])building(m,x,y,w,h,b,x);
    crane(m,1060,512,200,b.near);crane(m,1540,515,150,b.near);
    sailboat(m,680,470,100,b);sailboat(m,365,487,155,b);sailboat(m,1390,493,65,b);
    for(let i=0;i<30;i++){const x=810+i*31;m.fillStyle=b.near;m.fillRect(x,515,16,82);line(m,[[x,540],[x+30,540]],b.horizon+'45',4)}
    stone(f,0,544,380,176,b.near);stone(f,1350,555,450,165,b.near);
    for(let i=0;i<7;i++){const x=35+i*51;f.fillStyle=mix(b.near,'#221e24',.2);f.fillRect(x,487,11,70);ellipse(f,x+5,487,8,4,b.horizon+'70');line(f,[[x,520],[x+51,526]],b.horizon+'66',3)}
    line(f,[[1420,563],[1410,320],[1550,383]],b.near,8);line(f,[[1410,320],[1590,490]],b.near,2);poly(f,[[1418,335],[1427,458],[1540,443]],b.horizon+'55');fog(m,440,b,.25);
  }
  function city(d,m,f,b){
    const far=mix(b.far,b.sky,.25);for(let i=0;i<45;i++){const x=i*42,h=65+rand(i+145)*160;d.fillStyle=far;d.fillRect(x,435-h,36,h);windows(d,x,435-h,36,h,b.glow,i);if(i%5===0)line(d,[[x+18,435-h],[x+18,415-h]],far,2)}
    water(d,445,b,66);
    for(const [x,y,w,h] of [[90,255,140,290],[310,335,110,210],[545,170,90,365],[760,290,170,255],[1030,225,105,320],[1400,315,135,220],[1610,275,140,270]]){building(m,x,y,w,h,b,x);if(h>300){line(m,[[x+w/2,y-22],[x+w/2,y-84]],b.near,4);glow(m,x+w/2,y-84,13,b.glow,.6)}}
    // Suspension bridge, distant traffic and an elevated train make this a city, not a row of rectangles.
    line(m,[[0,458],[1800,458]],b.near,14);for(const tower of [440,1270]){line(m,[[tower,450],[tower,257]],b.near,12);m.beginPath();m.moveTo(tower-410,451);m.quadraticCurveTo(tower-195,445,tower,263);m.quadraticCurveTo(tower+200,445,tower+415,451);m.strokeStyle=b.horizon+'77';m.lineWidth=3;m.stroke();for(let i=-6;i<=6;i++){const xx=tower+i*58,yy=270+Math.abs(i/6)**.6*180;line(m,[[xx,yy],[xx,451]],b.horizon+'45')}}
    for(let i=0;i<25;i++){m.fillStyle=i%2?b.glow+'a0':'#f2927270';m.fillRect(25+i*71,448,5,3)}
    stone(f,0,533,1800,187,b.near);for(let x=0;x<1800;x+=130){f.fillStyle=b.glow+'70';f.fillRect(x+17,540,4,8);line(f,[[x+70,537],[x+70,496],[x+99,496]],b.near,3);glow(f,x+99,496,23,b.glow,.28)}fog(m,388,b,.2);
  }
  function valley(d,m,f,b,kind){
    const winter=kind==='winter',skyRoute=kind==='sky-route';
    const distant=winter?[[170,200,350],[620,100,340],[1150,240,350],[1590,158,410]]:skyRoute?[[140,260,370],[890,145,430],[1640,210,380]]:[[120,255,320],[590,165,370],[1100,280,390],[1660,195,360]];
    mountains(d,distant,480,mix(b.far,b.horizon,.36),true);
    mountains(m,skyRoute?[[260,375,340],[1350,352,440]]:[[230,290,380],[1060,265,430],[1740,330,350]],610,b.far,winter);
    if(winter){
      poly(m,[[0,500],[220,469],[490,524],[850,465],[1280,508],[1500,475],[1800,530],[1800,720],[0,720]],'#c5d2d5');
      line(m,[[150,490],[610,406],[1250,330],[1770,390]],b.near+'a0',2);for(const x of [380,940,1470]){line(m,[[x,470],[x,395]],b.near,5);line(m,[[x-30,395],[x+30,395]],b.near,4);stone(m,x+70,420,48,35,b.near);windows(m,x+70,420,48,35,b.glow,x)}
      for(let i=0;i<20;i++)pine(f,i*103,570,85+rand(i+532)*120,b.near,i,true);
      building(f,1180,464,145,110,{...b,near:mix(b.near,'#734933',.3)},3);poly(f,[[1165,461],[1260,401],[1340,461]],'#dce5e5');
    }else if(skyRoute){
      // Broken aqueduct and high suspended route give the official level its own architecture.
      bridge(m,120,335,620,150,b.near,6);bridge(m,1070,280,570,200,b.near,5);
      for(let x=160;x<720;x+=120){stone(m,x,303,22,35,b.near);line(m,[[x-20,299],[x+40,299]],b.horizon+'88',4)}
      line(m,[[720,335],[1055,302]],b.near,4);line(m,[[720,322],[820,350],[930,326],[1055,285]],b.horizon+'77',2);for(let x=760;x<1060;x+=25)line(m,[[x,340-(x-760)*.1],[x+4,314-(x-760)*.1]],b.near,2);
      for(const x of [900,1610]){stone(f,x,505,60,200,b.near);poly(f,[[x-15,505],[x+29,460],[x+75,505]],b.near)}
      cloud(m,720,440,390,b.horizon,.45);cloud(f,100,575,430,b.horizon,.2);
    }else{
      // River cutting through the valley, a rail viaduct, pines and a tiny mountain village.
      poly(m,[[785,460],[910,480],[960,540],[1150,630],[790,680],[825,560],[700,510]],b.horizon+'80');
      bridge(m,60,463,680,118,mix(b.near,b.far,.35),7);line(m,[[60,460],[740,460]],b.near,4);
      for(let i=0;i<9;i++)building(m,1200+i*55,457-rand(i+324)*18,45,44,{...b,near:b.far},i);
      for(let i=0;i<24;i++)pine(f,i*81,615,70+rand(i+401)*105,b.near,i);line(f,[[0,574],[410,553],[640,577]],b.near,7);
    }fog(m,420,b,.25);
  }
  function woodland(d,m,f,b,lake=false){
    poly(d,[[0,408],[200,358],[560,410],[970,336],[1310,382],[1800,310],[1800,720],[0,720]],mix(b.far,b.horizon,.28));
    for(let i=0;i<42;i++){const x=i*47,y=470,h=110+rand(i+32)*150;pine(d,x,y,h,mix(b.far,b.horizon,.22),i)}
    if(lake){
      water(m,449,b,309);poly(m,[[0,445],[210,454],[430,476],[330,512],[0,570]],b.near);poly(m,[[1800,425],[1530,441],[1360,470],[1590,490],[1800,515]],b.near);
      for(let i=0;i<30;i++){const x=i<15?i*29:1370+(i-15)*34;pine(m,x,470,100+rand(i+663)*100,b.far,i)}
      building(m,1275,436,90,55,b,55);line(m,[[1280,492],[1460,492]],b.near,5);for(let i=0;i<8;i++)line(m,[[1300+i*21,492],[1300+i*21,521]],b.near,3);
      sailboat(m,950,494,35,b);for(let i=0;i<9;i++)ellipse(m,120+i*176,495+rand(i+122)*26,12,2,b.near+'90');
      for(const x of [80,1660]){deciduous(f,x,630,300,b.near,x);for(let i=0;i<20;i++)line(f,[[x+i*4,580],[x+i*4-3,552-rand(i+3)*25]],b.near,2)}
    }else{
      for(let i=0;i<24;i++){const x=i*81;deciduous(m,x,585,210+rand(i+33)*145,b.far,i*7)}
      fog(m,340,b,.6);poly(m,[[820,450],[950,460],[860,530],[1080,630],[850,670],[755,543]],b.horizon+'50');
      if(b.sun){m.save();m.globalAlpha=.045;for(const x of [475,530,655])poly(m,[[x,90],[x+13,90],[x+230,570],[x+95,570]],b.glow);m.restore()}
      for(const [x,h] of [[110,440],[540,385],[1500,470],[1760,355]]){deciduous(f,x,655,h,b.near,x);line(f,[[x,655],[x+14,485],[x-55,420],[x-135,415]],b.near,7);line(f,[[x+8,530],[x+70,475],[x+100,390]],b.near,5)}
      poly(f,[[310,587],[375,544],[450,566],[475,612]],b.near);for(let i=0;i<65;i++){const x=rand(i+857)*1800,y=500+rand(i+22)*90;ellipse(f,x,y,2,2,b.glow+'78')}
    }
  }
  function dunes(d,m,f,b){
    const colors=[mix(b.far,b.horizon,.4),b.far,b.near];for(let layer=0;layer<3;layer++){const c=[d,m,f][layer],y=395+layer*105;c.beginPath();c.moveTo(0,720);c.lineTo(0,y);c.bezierCurveTo(200,y-100,420,y+90,720,y-25);c.bezierCurveTo(950,y-100,1450,y+70,1800,y-90);c.lineTo(1800,720);c.closePath();c.fillStyle=colors[layer];c.fill();for(let i=0;i<9;i++){c.beginPath();c.moveTo(0,y+12+i*6);c.bezierCurveTo(200,y-83+i*8,420,y+110+i*8,720,y-2+i*5);c.strokeStyle=b.horizon+'18';c.lineWidth=2;c.stroke()}}
    stone(m,1100,350,120,164,b.far);poly(m,[[1090,351],[1160,299],[1230,351]],b.far);stone(m,1330,415,58,100,b.far);for(let i=0;i<4;i++)stone(m,870+i*39,446,22,55,b.far);
    for(const [x,y,h] of [[560,515,96],[1500,547,155]]){line(m,[[x,y],[x+12,y-h]],b.near,7);for(let k=0;k<6;k++){m.beginPath();m.moveTo(x+12,y-h);m.quadraticCurveTo(x+(k-2)*25,y-h-33,x+(k-2)*38,y-h+18);m.strokeStyle=b.near;m.lineWidth=4;m.stroke()}}
    for(let i=0;i<12;i++){const x=rand(i+46)*1800,y=525+rand(i+319)*65;poly(f,[[x-13,y],[x-5,y-8],[x+13,y-3],[x+20,y+6]],b.near)}
    for(let i=0;i<260;i++){const x=rand(i+72)*1800,y=450+rand(i+332)*150;line(f,[[x,y],[x+3,y]],b.horizon+'18')}
  }
  function seaside(d,m,f,b){
    mountains(d,[[240,355,420],[1200,335,390]],474,mix(b.far,b.horizon,.4));water(d,450,b,904);
    poly(m,[[0,720],[0,420],[220,320],[310,360],[365,500],[550,600],[750,720]],b.far);poly(m,[[1800,720],[1800,350],[1550,375],[1470,490],[1270,650],[1200,720]],b.far);
    for(let i=0;i<8;i++){line(m,[[0,470+i*17],[200,386+i*20],[330,469+i*13]],b.horizon+'25',3);line(m,[[1500,442+i*18],[1700,418+i*24],[1800,420+i*26]],b.horizon+'22',3)}
    stone(m,1520,198,37,181,b.horizon);ellipse(m,1539,191,32,11,b.near);m.fillStyle=b.near;m.fillRect(1514,163,49,28);windows(m,1514,154,49,34,b.glow,71,true);poly(m,[[1506,162],[1539,144],[1572,162]],b.near);
    for(let i=0;i<30;i++){const x=rand(i+302)*1800,y=480+rand(i+301)*90;line(m,[[x,y],[x+35,y+2],[x+80,y-1]],'#d3e8e54a',1.5)}
    poly(f,[[0,540],[165,515],[340,585],[620,720],[0,720]],b.near);poly(f,[[1800,534],[1680,565],[1460,660],[1400,720],[1800,720]],b.near);for(let i=0;i<5;i++){const x=640+i*125,y=205+rand(i+85)*90;line(d,[[x-9,y+4],[x,y],[x+8,y+3]],b.near+'88',1.5)}
  }
  function factory(d,m,f,b,spider=false){
    for(let i=0;i<18;i++){const x=i*110,h=45+rand(i+48)*110;d.fillStyle=b.far;d.fillRect(x,460-h,100,h);d.fillRect(x+40,460-h-95,14,95);for(let j=0;j<5;j++)cloud(d,x+35+j*18,330-h-j*14,65+j*25,b.horizon,.1)}
    for(const [x,y,w,h] of [[80,367,200,180],[435,320,270,220],[900,378,250,164],[1390,290,270,250]]){
      stone(m,x,y,w,h,b.near);poly(m,[[x,y],[x+w*.2,y-35],[x+w*.2,y],[x+w*.4,y-35],[x+w*.4,y],[x+w*.6,y-35],[x+w*.6,y],[x+w*.8,y-35],[x+w*.8,y],[x+w,y-35],[x+w,y]],b.near);windows(m,x,y,w,h,b.glow,x,true);
      for(let i=0;i<3;i++){m.fillStyle=b.far;m.fillRect(x+28+i*43,y-100-i*20,21,100+i*20);line(m,[[x+26+i*43,y-101-i*20],[x+51+i*43,y-101-i*20]],b.horizon+'88',4)}
    }
    for(let i=0;i<3;i++){const x=740+i*60;ellipse(m,x,474,24,75,b.far);line(m,[[x-20,420],[x+20,420]],b.horizon+'80',2);line(m,[[x-24,483],[x+24,483]],b.near,3)}
    line(m,[[0,472],[1800,472]],b.near,10);line(m,[[0,476],[1800,476]],b.horizon+'50',2);for(let x=0;x<1800;x+=145)line(m,[[x,473],[x,554]],b.near,8);
    if(spider){
      // An overhead machine hall with trusses, suspended drive wheels and hanging cables.
      stone(f,0,0,1800,56,b.near);for(let x=0;x<1800;x+=200){line(f,[[x,51],[x+100,108],[x+200,51]],b.near,9);line(f,[[x+100,65],[x+100,280]],b.near,2);f.beginPath();f.arc(x+100,299,23,0,Math.PI*2);f.strokeStyle=b.near;f.lineWidth=9;f.stroke();for(let k=0;k<6;k++){const a=k*Math.PI/3;line(f,[[x+100,299],[x+100+Math.cos(a)*23,299+Math.sin(a)*23]],b.near,4)}}
      for(const x of [120,1180]){line(f,[[x,530],[x,125]],b.near,15);line(f,[[x-35,140],[x+130,140]],b.near,12);glow(f,x+118,150,75,b.glow,.23)}
    }else{crane(m,1260,542,250,b.near);for(let i=0;i<12;i++)line(f,[[i*155,550],[i*155+90,550]],b.glow+'30',2)}
    stone(f,0,553,1800,167,b.near);fog(m,390,b,.22);
  }
  function canyon(d,m,f,b){
    const mesas=(c,color,offset,seed)=>{for(let i=0;i<7;i++){const x=i*300-50,y=245+rand(i+seed)*95+offset,w=170+rand(i+51)*90;poly(c,[[x-55,640],[x,y+120],[x+25,y+15],[x+60,y],[x+w-20,y],[x+w+15,y+65],[x+w+60,640]],color);for(let k=0;k<12;k++)line(c,[[x+17,y+50+k*22],[x+w+Math.min(30,k*5),y+57+k*22]],b.horizon+'25',2+rand(k+4)*3);poly(c,[[x+w-20,y],[x+w+15,y+65],[x+w+60,640],[x+w-40,640]],mix(color,'#483948',.23))}};
    mesas(d,mix(b.far,b.horizon,.35),-45,7);mesas(m,b.far,55,42);
    poly(m,[[900,485],[960,490],[1060,570],[860,650],[700,720],[460,720],[850,575]],b.horizon+'7a');
    poly(f,[[0,590],[175,480],[335,478],[410,535],[660,720],[0,720]],b.near);poly(f,[[1250,720],[1450,575],[1620,460],[1800,435],[1800,720]],b.near);
    for(const x of [170,1570]){line(f,[[x,562],[x,485]],b.near,9);line(f,[[x-23,517],[x-23,494],[x-23,533],[x,533],[x+26,514],[x+26,483]],b.near,7)}
    bridge(m,550,431,360,68,b.near,4);fog(m,405,b,.24);
  }
  function fortress(d,m,f,b,sunset=false){
    mountains(d,[[340,330,440],[1200,300,540]],580,mix(b.far,b.horizon,.35));
    const tower=(c,x,y,w,h,color,roof=false)=>{stone(c,x,y,w,h,color,x);for(let i=0;i<w/18;i++)c.fillRect(x+i*18,y-12,12,16);if(roof)poly(c,[[x-10,y],[x+w/2,y-65],[x+w+10,y]],mix(color,'#27313e',.35));for(let yy=y+30;yy<y+h-20;yy+=60){c.fillStyle=b.glow+'50';c.beginPath();c.arc(x+w/2,yy,w*.085,Math.PI,0);c.lineTo(x+w*.585,yy+18);c.lineTo(x+w*.415,yy+18);c.fill()}};
    const mainX=sunset?1000:520;stone(m,mainX-240,380,730,210,b.far);for(let i=0;i<7;i++)tower(m,mainX-260+i*120,260+rand(i+87)*90,72,310,b.far,i%2===0);tower(m,mainX,190,125,370,b.near,true);tower(m,mainX+190,235,90,325,b.near,true);
    bridge(m,0,475,600,118,b.far,6);poly(m,[[mainX-260,590],[mainX-130,530],[mainX+550,560],[1800,640],[1800,720],[0,720]],b.near+'85');
    if(sunset){
      // Ruined abbey on one side, inhabited citadel on the other.
      for(let i=0;i<4;i++){tower(f,110+i*110,385+rand(i+238)*35,45,190,b.near);line(f,[[130+i*110,404],[197+i*110,378],[240+i*110,403]],b.near,7)}
      line(m,[[mainX+235,245],[mainX+235,173]],b.near,3);poly(m,[[mainX+235,175],[mainX+285,184],[mainX+236,198]],b.glow+'80');
      for(let i=0;i<9;i++){const x=430+i*130,y=208+rand(i+61)*44;line(d,[[x-5,y],[x,y-3],[x+6,y]],b.near+'77')}
    }else{tower(f,60,326,150,335,b.near);tower(f,1525,364,170,299,b.near);bridge(f,1150,519,360,200,b.near,3);deciduous(f,1420,670,220,b.near,17)}
    fog(m,445,b,sunset?.22:.55);
  }
  function cavern(d,m,f,b){
    gradient(d,0,0,WIDTH,HEIGHT,[[0,mix(b.sky,'#080e19',.5)],[.55,b.far],[1,b.near]]);
    glow(d,1040,410,330,b.glow,.13);water(d,495,b,128);
    for(let layer=0;layer<3;layer++){
      const c=[d,m,f][layer],color=[b.far,mix(b.near,b.far,.5),b.near][layer];
      const roof=[[0,0],[WIDTH,0]];for(let x=WIDTH;x>=0;x-=28)roof.push([x,70+layer*18+rand(Math.floor(x)+layer*381)*85]);poly(c,roof,color);
      for(let i=0;i<22;i++){const x=i*87+rand(i+layer*523)*40,y=90+layer*20,length=50+rand(i+221+layer*123)*170;poly(c,[[x-28,y],[x+16,y],[x+10,y+length*.75],[x-3,y+length]],color);line(c,[[x+6,y+10],[x-3,y+length-10]],b.horizon+'24')}
      if(layer===1){for(const x of [110,350,1390,1690]){poly(c,[[x-70,640],[x-38,426],[x-25,380],[x+17,400],[x+50,640]],color);line(c,[[x-24,416],[x-8,574]],b.horizon+'35',2)}}
    }
    poly(m,[[0,595],[150,520],[330,544],[590,617],[900,645],[1800,620],[1800,720],[0,720]],b.near);
    for(const [x,y,s] of [[190,490,45],[430,540,30],[1240,518,48],[1590,485,64]]){glow(m,x,y,70,b.glow,.22);poly(m,[[x-s*.4,y+s],[x-s*.2,y-s*.8],[x+s*.1,y-s],[x+s*.4,y+s]],b.glow+'70');line(m,[[x,y-s*.7],[x+s*.12,y+s]],'#d7efea8a',2)}
    for(let i=0;i<80;i++)ellipse(m,rand(i+510)*1800,250+rand(i+798)*280,1,1,b.glow+'55');fog(m,450,b,.2);
  }
  function cosmos(d,m,f,b){
    // A nebula, ringed planet, moon, orbital structures and an alien plateau.
    for(let i=0;i<35;i++){const x=250+i*39,y=280-Math.sin(i*.14)*130;glow(d,x,y,100+rand(i+821)*100,i%2?b.horizon:b.far,.04)}
    stars(d,b,89);const x=1270,y=240,r=110;glow(d,x,y,200,b.horizon,.15);
    d.save();d.translate(x,y);d.rotate(-.25);d.beginPath();d.ellipse(0,0,190,42,0,0,Math.PI*2);d.strokeStyle=b.horizon+'80';d.lineWidth=12;d.stroke();const g=d.createRadialGradient(-38,-40,4,0,0,r);g.addColorStop(0,b.horizon);g.addColorStop(1,b.near);ellipse(d,0,0,r,r,g);for(let i=0;i<7;i++){d.save();d.beginPath();d.arc(0,0,r,0,Math.PI*2);d.clip();line(d,[[-r,-70+i*26],[r,-45+i*22]],b.glow+'20',5);d.restore()}d.beginPath();d.ellipse(0,0,190,42,0,0,Math.PI);d.strokeStyle=b.horizon+'99';d.lineWidth=8;d.stroke();d.restore();ellipse(d,480,162,22,22,b.horizon+'80');
    mountains(m,[[270,452,310],[900,490,310],[1470,410,400]],650,b.far);
    for(const [x,y,h] of [[220,498,150],[700,524,95],[1450,478,140]]){poly(f,[[x-28,650],[x-20,y-h],[x+15,y-h-10],[x+32,650]],b.near);line(f,[[x-4,y-h+10],[x+4,y+50]],b.horizon+'60',2)}
    line(m,[[590,354],[755,352]],b.near,6);line(m,[[675,313],[675,387]],b.near,4);for(let i=0;i<4;i++){m.fillStyle=b.far;m.fillRect(610+i*40,342,26,28);line(m,[[610+i*40,356],[636+i*40,356]],b.horizon+'65')}
    for(let i=0;i<18;i++){const x=rand(i+241)*1800,y=350+rand(i+271)*190;poly(m,[[x-9,y],[x-3,y-8],[x+11,y-3],[x+6,y+8]],b.far)}
  }
  const painters={harbor,'city-night':city,mountains:(...a)=>valley(...a,'mountains'),winter:(...a)=>valley(...a,'winter'),'sky-route':(...a)=>valley(...a,'sky-route'),forest:(...a)=>woodland(...a,false),lake:(...a)=>woodland(...a,true),desert:dunes,coast:seaside,industrial:(...a)=>factory(...a,false),'spider-factory':(...a)=>factory(...a,true),canyon,castle:(...a)=>fortress(...a,false),'three-worlds':(...a)=>fortress(...a,true),cave:cavern,space:cosmos};
  function getLayers(b){
    const requested=b.art||b.id,id=sceneOf[requested]===b.scene?requested:variants[b.scene]||'mountains';
    const key=JSON.stringify([id,b.sky,b.horizon,b.far,b.near,b.glow,b.night,b.sun,b.fog]);
    if(cache.has(key)){const layers=cache.get(key);cache.delete(key);cache.set(key,layers);return layers}
    const layers=Array.from({length:4},()=>{const c=document.createElement('canvas');c.width=WIDTH;c.height=HEIGHT;return c});
    const [s,d,m,f]=layers.map(c=>c.getContext('2d'));sky(s,b,id);painters[id](d,m,f,b);
    // Keep fine material grain out of the gameplay foreground; it belongs to the environment.
    for(let i=0;i<2800;i++){const x=rand(i+550)*WIDTH,y=rand(i+765)*600;m.fillStyle=i%2?'#ffffff05':'#050e1b07';m.fillRect(x,y,1+rand(i+452)*3,1)}
    fog(m,470,b,b.fog);cache.set(key,layers);while(cache.size>3){const old=cache.keys().next().value;for(const layer of cache.get(old)){layer.width=1;layer.height=1}cache.delete(old)}return layers;
  }
  function draw(c,b,camera=0,time=0){
    const layers=getLayers(b);for(let i=0;i<layers.length;i++){const drift=i===0?-150:-150+Math.sin(camera*[0,.00008,.00013,.0002][i])*[0,55,90,145][i];c.drawImage(layers[i],drift,0)}
    // Restrained moving atmosphere complements the cached illustrations.
    if(b.scene==='lake'||b.scene==='coast'){for(let i=0;i<8;i++){const x=180+i*180+Math.sin(time*.3+i)*10,y=490+i%3*16;line(c,[[x,y],[x+35+Math.sin(time+i)*8,y]],b.horizon+'18')}}
    if(b.scene==='forest'||b.scene==='cave'){for(let i=0;i<12;i++){const x=(i*137+Math.sin(time*.3+i)*12+150)%1500,y=360+Math.sin(time*.22+i)*65;ellipse(c,x,y,1.2,1.2,b.glow+'48')}}
  }
  window.GeoRushBackdropArt={draw,prepare:getLayers};
})();
