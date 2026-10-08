(() => {
  'use strict';
  // Every section is authored individually; objects use the editor's .grush schema.
  const o=(kind,x,extra={})=>({kind,x,...extra});
  const block=(x,width,height)=>o('block',x,{width,height});
  const platform=(x,width,height)=>o('platform',x,{width,height});
  const pit=(x,width)=>o('pit',x,{width});
  const spike=(x,count=1)=>o('spike',x,{count});
  const mini=(x,count=2)=>o('miniSpike',x,{count});
  const strip=(kind,x,width,height)=>o(kind,x,{width,height});
  const wall=(kind,x,y,width,gap)=>o(kind,x,{y,width,gap});
  const trap=(kind,x,lane,width)=>o(kind,x,{lane,...(width?{width}:{})});
  const section=(mode,theme,label,...objects)=>({mode,theme,label,objects});
  const level=(id,name,difficulty,color,description,sections)=>({id,name,difficulty,color,description,map:window.GeoRushMap.normalize({version:1,name,sections:sections.map(section=>({...section,background:({'first-steps':'harbor','sky-route':'sky-route','upside-down':'spider-factory','three-worlds':'three-worlds'})[id]}))})});
  window.GeoRushLevels=[
    level('first-steps','Первые шаги','НОРМАЛЬНО','#85ca96','Городская трасса: лестницы, мосты над провалами, пружины и прыжки через кольца.',[
      section('cube',0,'Причал',spike(280),block(520,160,40),spike(820,2),block(1060,180,60),mini(1280,1)),
      section('cube',0,'Подъём на крыши',block(220,180,40),block(400,200,80),block(600,240,120),pit(900,180),platform(900,180,100),spike(1220)),
      section('cube',0,'Мосты',pit(220,260),platform(220,260,80),pit(540,260),platform(540,260,120),pit(900,240),platform(900,260,80)),
      section('cube',1,'Пружинный цех',o('pad',220),o('spikeBlock',440,{width:100,height:100}),platform(700,220,140),pit(700,240),block(1040,220,70),mini(1280,1)),
      section('cube',1,'Шестерни',block(220,200,60),o('saw',600),block(820,180,80),spike(1180,2)),
      section('cube',2,'Воздушная цепочка',spike(220),block(400,80,40),pit(540,300),pit(840,240),o('orb',680,{y:340}),o('orb',940,{y:240}),platform(1100,180,80)),
      section('cube',0,'Прыжок через канал',block(220,220,60),spike(500),o('pad',720),pit(900,300),platform(1180,100,100)),
      section('cube',0,'Последняя крыша',block(220,140,40),block(360,180,80),block(540,220,120),o('saw',980),spike(1260,2))
    ]),
    level('sky-route','Небесный маршрут','СЛОЖНО','#8cbde0','Полёт через шахту: низкие арки, карманы, слалом и длинные извилистые тоннели.',[
      section('cube',1,'Стартовая эстакада',block(220,220,60),pit(500,240),platform(500,240,100),o('pad',880),o('spikeBlock',1100,{height:80,width:140})),
      section('wave',1,'Вход в шахту',wall('waveGate',220,440,80,115),strip('waveCeil',440,180,130),wall('waveGate',740,300,100,100),strip('waveFloor',1040,220,140)),
      section('wave',1,'Зигзаг',wall('waveTunnel',180,280,180,85),wall('waveTunnel',520,440,160,85),wall('waveGate',840,260,80,90),wall('waveTunnel',1100,440,160,90)),
      section('wave',2,'Кристальные карманы',strip('waveFloor',200,200,150),o('waveDiamond',480,{y:320}),strip('waveCeil',640,220,150),o('waveDiamond',920,{y:420}),wall('waveGate',1180,300,80,100)),
      section('wave',2,'Длинный тоннель',wall('waveTunnel',180,300,300,90),wall('waveTunnel',620,420,260,90),wall('waveTunnel',1040,280,240,90)),
      section('wave',4,'Плавающие острова',o('waveBlock',200,{y:400}),strip('waveCeil',400,180,160),o('waveBlock',640,{y:260}),strip('waveFloor',860,180,160),o('waveSaw',1140,{y:330})),
      section('wave',4,'Маятники',wall('waveGate',180,420,80,105),o('wavePulse',440,{y:260}),wall('waveGate',660,280,80,100),o('wavePulse',920,{y:430}),wall('waveGate',1160,380,80,105)),
      section('wave',2,'Узкие арки',strip('waveFloor',180,240,170),strip('waveCeil',500,240,170),wall('waveGate',820,440,100,80),wall('waveTunnel',1080,280,200,85)),
      section('wave',1,'Выход из шахты',wall('waveTunnel',180,260,200,90),o('waveSaw',540,{y:380}),wall('waveTunnel',720,440,180,90),strip('waveCeil',1040,240,140)),
      section('cube',0,'Посадка',block(220,180,40),spike(500,2),o('pad',760),pit(940,280),platform(1180,100,80))
    ]),
    level('upside-down','Вверх ногами','СЛОЖНО','#c49fdf','Паучья фабрика: длинные ловушки, двойные связки и короткие окна для смены стороны.',[
      section('cube',1,'На фабрику',spike(220,2),block(480,180,60),o('saw',820),o('pad',1080),o('spikeBlock',1280,{height:60,width:80})),
      section('spider',1,'Первый переворот',trap('spiderSpike',200,'bottom',160),trap('spiderBlock',580,'top',200),trap('spiderSaw',1000,'bottom'),trap('spiderSpike',1200,'top',100)),
      section('spider',1,'Двойные зубья',trap('spiderSpike',180,'bottom',120),trap('spiderSaw',380,'bottom'),trap('spiderBlock',620,'top',240),trap('spiderSpike',1020,'bottom',200)),
      section('spider',1,'Пресс',trap('spiderBlock',180,'top',300),trap('spiderSpike',640,'bottom',140),trap('spiderBlock',900,'top',160),trap('spiderSaw',1220,'bottom')),
      section('spider',3,'Длинные коридоры',trap('spiderBlock',180,'bottom',320),trap('spiderBlock',660,'top',320),trap('spiderSpike',1140,'bottom',140)),
      section('spider',3,'Сдвоенные пилы',trap('spiderSaw',200,'bottom'),trap('spiderSaw',320,'bottom'),trap('spiderSpike',560,'top',180),trap('spiderSaw',900,'bottom'),trap('spiderSaw',1020,'bottom'),trap('spiderBlock',1240,'top',100)),
      section('spider',2,'Ложный ритм',trap('spiderSpike',180,'top',100),trap('spiderBlock',400,'bottom',280),trap('spiderSaw',820,'top'),trap('spiderSpike',1000,'top',100),trap('spiderBlock',1240,'bottom',100)),
      section('spider',2,'Короткие окна',trap('spiderBlock',180,'bottom',160),trap('spiderSpike',460,'top',160),trap('spiderBlock',740,'bottom',200),trap('spiderSpike',1060,'top',200)),
      section('spider',1,'Финишный конвейер',trap('spiderSpike',180,'bottom',220),trap('spiderSaw',500,'top'),trap('spiderBlock',680,'bottom',180),trap('spiderSaw',980,'top'),trap('spiderSpike',1180,'bottom',140)),
      section('cube',0,'Побег',block(220,180,40),block(400,200,80),pit(680,240),platform(680,240,120),o('pad',1080),spike(1280,3))
    ]),
    level('three-worlds','Три мира','ОЧЕНЬ СЛОЖНО','#e6aa7b','Крепость, зеркала и пустота: связки колец, резкий слалом и частая смена трёх форм.',[
      section('cube',3,'Стены крепости',block(180,180,50),block(360,180,100),o('spikeBlock',620,{width:100,height:60}),block(860,220,120),mini(1200,3)),
      section('cube',3,'Через ров',o('pad',180),pit(380,300),o('orb',500,{y:400}),pit(680,300),o('orb',760,{y:300}),platform(920,220,140),spike(1220,2)),
      section('wave',3,'Нижние бойницы',wall('waveTunnel',180,440,220,90),wall('waveTunnel',560,260,160,85),o('waveDiamond',880,{y:350}),wall('waveGate',1160,440,100,90)),
      section('wave',2,'Зеркальный слалом',wall('waveGate',180,280,80,80),wall('waveTunnel',440,440,140,80),wall('waveGate',760,260,80,80),wall('waveTunnel',1040,430,220,85)),
      section('spider',2,'Две стороны зеркала',trap('spiderBlock',180,'bottom',220),trap('spiderSpike',520,'top',140),trap('spiderSaw',800,'bottom'),trap('spiderBlock',1020,'top',260)),
      section('spider',2,'Разбитые зеркала',trap('spiderSaw',180,'bottom'),trap('spiderSpike',360,'top',180),trap('spiderSaw',680,'bottom'),trap('spiderBlock',880,'bottom',140),trap('spiderSpike',1160,'top',120)),
      section('cube',1,'Пружинный разгон',o('pad',180),o('spikeBlock',400,{width:100,height:80}),o('orb',560,{y:440}),platform(700,160,160),pit(680,300),o('orb',900,{y:260}),block(1100,180,100)),
      section('wave',4,'Невесомость',strip('waveCeil',180,200,170),wall('waveGate',500,430,80,80),o('wavePulse',740,{y:300}),wall('waveTunnel',1000,270,240,90)),
      section('spider',4,'Обратный отсчёт',trap('spiderSpike',180,'bottom',160),trap('spiderBlock',460,'top',240),trap('spiderSaw',820,'bottom'),trap('spiderSaw',940,'bottom'),trap('spiderSpike',1160,'top',120)),
      section('cube',3,'Башни над пропастью',pit(180,300),platform(180,220,100),block(520,180,140),pit(800,280),platform(800,220,120),o('orb',1040,{y:260}),spike(1240,2)),
      section('wave',4,'Последний изгиб',wall('waveTunnel',180,430,180,80),wall('waveGate',540,250,80,85),o('waveSaw',780,{y:420}),wall('waveTunnel',1040,430,240,80)),
      section('spider',3,'Последние ворота',trap('spiderBlock',180,'bottom',200),trap('spiderSpike',500,'top',180),trap('spiderSaw',800,'bottom'),trap('spiderBlock',980,'top',120),trap('spiderSpike',1220,'bottom',100))
    ])
  ];
})();
