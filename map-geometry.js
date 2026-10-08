(() => {
  'use strict';
  const angle=value=>((Number(value)||0)%360+360)%360;
  function layout(item,mode){
    const spec=window.GeoRushMap.shape(item,mode);if(!spec)return null;
    const k=item.kind,w=spec.width,parts=[];
    let h=60,originY=500;
    const rect=(x,y,width,height,role='hazard')=>{if(width>0&&height>0)parts.push({role,points:[[x,y],[x+width,y],[x+width,y+height],[x,y+height]]})};
    const circle=(x,y,r,role='hazard')=>parts.push({role,circle:[x,y,r]});
    const spikes=(count,height,down=false)=>{const step=w/count;for(let i=0;i<count;i++)parts.push({role:'hazard',points:down?[[i*step,0],[(i+1)*step,0],[(i+.5)*step,height]]:[[i*step,height],[(i+.5)*step,0],[(i+1)*step,height]]})};
    if(['singleSpike','singleMiniSpike','spike','miniSpike','spiderSpike','waveFloor','waveCeil'].includes(k)){
      h=k==='miniSpike'||k==='singleMiniSpike'?32:k==='waveFloor'||k==='waveCeil'?spec.height:48;
      const down=k==='waveCeil'||k==='spiderSpike'&&item.lane==='top';
      originY=k==='waveCeil'||k==='spiderSpike'&&down?150:(item.y??560)-h;
      const count=spec.count??Math.max(2,Math.round(w/(k==='spiderSpike'?36:39)));
      spikes(count,h,down);
    }else if(k==='tileBlock'||k==='block'||k==='spikeBlock'||k==='spiderBlock'||k==='waveBlock'||k==='platform'){
      h=k==='platform'?22:k==='tileBlock'?40:k==='spiderBlock'?62:k==='waveBlock'?(spec.height??84):spec.height;
      originY=k==='tileBlock'?(item.y??520):k==='waveBlock'?(item.y??340):k==='spiderBlock'?(item.lane==='top'?150:498):560-spec.height;
      if(k==='spikeBlock'){originY-=30;h+=30;rect(0,30,w,h-30,'solid');const step=w/Math.max(2,Math.floor(w/30));for(let i=0;i<w/step;i++)parts.push({role:'hazard',points:[[i*step,30],[(i+.5)*step,0],[(i+1)*step,30]]})}
      else rect(0,0,w,h,'solid');
    }else if(k==='waveGate'||k==='waveTunnel'){
      h=410;originY=150;const center=item.free?(item.gapOffset??205):(item.y??340)-150;
      rect(0,0,w,Math.max(0,center-spec.gap),'solid');rect(0,center+spec.gap,w,Math.max(0,h-center-spec.gap),'solid');
    }else if(k==='waveDiamond'){
      h=60;originY=(item.y??340)-30;parts.push({role:'hazard',points:[[w/2,0],[w,30],[w/2,60],[0,30]]});
    }else if(k==='pit'){h=83;originY=557;rect(0,0,w,h,'pit')}
    else if(k==='pad'){h=17;originY=543;rect(0,0,w,h,'pad')}
    else if(k==='orb'){h=44;originY=(item.y??340)-22;circle(22,22,22,'orb')}
    else if(k==='gate'){h=spec.a;originY=560-h;rect(0,0,w,h,'gate')}
    else if(k==='sawPair'){h=46;originY=507;circle(23,23,23);circle(113,23,23)}
    else{
      const radius=k==='spiderSaw'?28:k==='roller'?27:k==='movingSaw'?29:k==='wavePulse'?27:k==='waveSaw'?28:30;
      h=radius*2;originY=k==='spiderSaw'?(item.lane==='top'?149:505):k.startsWith('wave')?(item.y??340)-radius:k==='movingSaw'?490-radius:530-radius;
      circle(w/2,radius,radius);
    }
    return {x:item.x,y:item.free?item.y:originY,w,h,parts,rotation:angle(item.rotation)};
  }
  function editable(item,mode){
    if(item.free)return {...item};
    const body=layout(item,mode),next={...item,free:true,x:body.x,y:body.y,rotation:body.rotation};
    if(item.kind==='waveGate'||item.kind==='waveTunnel')next.gapOffset=(item.y??340)-150;
    return next;
  }
  function parts(item,mode,baseX=0,time=0){
    const body=layout(item,mode);if(!body)return [];
    const rad=body.rotation*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad),cx=body.w/2,cy=body.h/2;
    const transform=([x,y])=>[baseX+body.x+cx+(x-cx)*cos-(y-cy)*sin,body.y+cy+(x-cx)*sin+(y-cy)*cos];
    const moving=/movingSaw|wavePulse/.test(item.kind)?Math.sin(time*2.7)*30:0;
    const sliding=item.kind==='roller'?Math.sin(time*2.6)*35:0;
    return body.parts.map(part=>part.circle?{role:part.role,circle:[...transform([part.circle[0]+sliding,part.circle[1]+moving]),part.circle[2]],spin:rad+time*3}:{role:part.role,points:part.points.map(transform)});
  }
  function bounds(parts){
    const points=parts.flatMap(part=>part.points||[[part.circle[0]-part.circle[2],part.circle[1]-part.circle[2]],[part.circle[0]+part.circle[2],part.circle[1]+part.circle[2]]]);
    if(!points.length)return {x:0,y:0,w:0,h:0};
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);
    return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};
  }
  function inside(points,x,y){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit}return hit}
  function distance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)}
  function circleHit(part,x,y,r){
    if(part.circle)return Math.hypot(x-part.circle[0],y-part.circle[1])<r+part.circle[2]-2;
    const p=part.points;return inside(p,x,y)||p.some((a,i)=>distance(x,y,a,p[(i+1)%p.length])<r);
  }
  function rectHit(part,x,y,w,h){
    if(part.circle){const [cx,cy,r]=part.circle;return Math.hypot(cx-Math.max(x,Math.min(x+w,cx)),cy-Math.max(y,Math.min(y+h,cy)))<r-2}
    const p=part.points,q=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],axes=[[1,0],[0,1]];
    for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];axes.push([-(b[1]-a[1]),b[0]-a[0]])}
    return axes.every(([ax,ay])=>{if(Math.abs(ax)+Math.abs(ay)<1e-8)return true;const a=p.map(([px,py])=>px*ax+py*ay),b=q.map(([px,py])=>px*ax+py*ay);return Math.max(...a)>Math.min(...b)+.001&&Math.max(...b)>Math.min(...a)+.001});
  }
  function landing(parts,left,right,oldBottom,newBottom){
    let top=Infinity;
    for(const part of parts){if(part.role!=='solid'||!part.points)continue;const p=part.points;
      for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if(b[0]-a[0]<.001)continue;const lo=Math.max(left,a[0]),hi=Math.min(right,b[0]);if(hi<=lo)continue;
        const height=x=>a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]),edge=Math.min(height(lo),height(hi));
        if(oldBottom<=edge+8&&newBottom>=edge)top=Math.min(top,edge);
      }
    }return top;
  }
  function draw(ctx,parts,colors={}){
    for(const part of parts){const fill=part.role==='solid'?(colors.solid||'#263976'):part.role==='orb'||part.role==='pad'?'#ebc869':part.role==='pit'?'#10183f':(colors.danger||'#f38f9f');
      ctx.beginPath();if(part.circle){
        const [cx,cy,r]=part.circle;
        if(part.role==='hazard'){for(let i=0;i<24;i++){const a=(part.spin||0)+i*Math.PI/12,rr=i%2?r*.77:r,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath()}
        else ctx.arc(cx,cy,r,0,Math.PI*2);
      }else{ctx.moveTo(...part.points[0]);for(const p of part.points.slice(1))ctx.lineTo(...p);ctx.closePath()}
      ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=colors.stroke||'#fff9ee';ctx.lineWidth=3;ctx.stroke();
      if(part.circle){ctx.beginPath();ctx.arc(part.circle[0],part.circle[1],part.circle[2]*.4,0,Math.PI*2);ctx.fillStyle=colors.solid||'#263976';ctx.fill();ctx.stroke()}
      if(part.role==='solid'&&part.points){const center=part.points.reduce((a,p)=>[a[0]+p[0]/part.points.length,a[1]+p[1]/part.points.length],[0,0]);ctx.beginPath();part.points.forEach((p,i)=>{const x=center[0]+(p[0]-center[0])*.72,y=center[1]+(p[1]-center[1])*.72;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.strokeStyle='#ffffff35';ctx.lineWidth=2;ctx.stroke()}
    }
  }
  window.GeoRushGeometry={angle,layout,editable,parts,bounds,rectHit,circleHit,landing,draw,inside,distance};
})();
