(() => {
  'use strict';
  let context=null,enabled=true,volume=1;
  try{
    enabled=localStorage.getItem('georush-sound-on')!=='false';
    const stored=localStorage.getItem('georush-sound-volume');
    if(stored!==null&&Number.isFinite(Number(stored)))volume=Math.max(0,Math.min(1,Number(stored)));
  }catch{}
  const notes={
    start:[420,650,.18,'triangle',.045],jump:[360,690,.14,'square',.055],
    land:[155,85,.085,'triangle',.028],pad:[280,830,.24,'square',.065],
    orb:[520,960,.2,'triangle',.065],crystal:[780,1180,.13,'sine',.042],
    transform:[260,540,.26,'triangle',.045],spider:[650,300,.12,'triangle',.05],death:[260,55,.35,'sawtooth',.07],
    menuClick:[480,620,.07,'sine',.032],menuBack:[460,320,.1,'triangle',.028],
    menuConfirm:[620,940,.12,'triangle',.035],menuChange:[520,680,.06,'sine',.025]
  };
  const embedded=window.parent!==window&&new URLSearchParams(location.search).has('embedded');
  function play(kind){
    if(!Object.hasOwn(notes,kind))return;
    if(embedded){window.parent.postMessage({type:'georush-ui-sfx',kind},'*');return}
    if(!enabled||volume===0)return;
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    try{
      if(!context)context=new Audio();
      if(context.state==='suspended')context.resume()?.catch(()=>{});
      const [from,to,duration,type,level]=notes[kind],now=context.currentTime;
      const oscillator=context.createOscillator(),gain=context.createGain();
      oscillator.type=type;oscillator.frequency.setValueAtTime(from,now);oscillator.frequency.exponentialRampToValueAtTime(to,now+duration);
      gain.gain.setValueAtTime(.00001,now);gain.gain.linearRampToValueAtTime(level*volume,now+.008);gain.gain.exponentialRampToValueAtTime(.00001,now+duration);
      oscillator.connect(gain);gain.connect(context.destination);oscillator.start(now);oscillator.stop(now+duration+.01);
    }catch{}
  }
  function configure(on,value){enabled=!!on;volume=Math.max(0,Math.min(1,Number(value)||0))}
  window.GeoRushAudio={play,configure};
  document.addEventListener('click',event=>{
    const control=event.target.closest?.('button,summary');if(!control||control.disabled)return;
    let kind=control.dataset.uiSound||'menuClick';
    if(['backButton','levelsCloseButton','settingsCloseButton','pauseMenuButton','overMenuButton'].includes(control.id))kind='menuBack';
    if(['exportButton','saveButton'].includes(control.id))kind='menuConfirm';
    if(kind!=='none')play(kind);
  },true);
  document.addEventListener('change',event=>{
    if(event.target.matches?.('select,input[type="number"]'))play('menuChange');
  });
  window.addEventListener('message',event=>{
    if(event.source!==document.getElementById('editorFrame')?.contentWindow)return;
    if(event.data?.type==='georush-ui-sfx'&&['menuClick','menuBack','menuConfirm','menuChange'].includes(event.data.kind))play(event.data.kind);
  });
})();
