const {chromium}=require('playwright'); const assert=require('assert');
(async()=>{
 const b=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 const p=await b.newPage(); const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const anime=id=>({id,name:`Season ${id}`,russian:`Сезон ${id}`,image:{original:''},score:'8.0',aired_on:'2026-01-01',episodes:120,status:'released',genres:[]});
 const nodes=[{id:101,name:'Сезон первый',date:1,year:2020,kind:'TV Сериал'},{id:102,name:'Сезон второй',date:2,year:2021,kind:'TV Сериал'},{id:103,name:'Спин-офф',date:3,year:2022,kind:'TV Сериал'}];
 const links=[{source_id:101,target_id:102,relation:'sequel'},{source_id:101,target_id:103,relation:'spin_off'}];
 await p.route('https://shikimori.io/api/**',r=>{let u=new URL(r.request().url());let m=u.pathname.match(/animes\/(\d+)/);return r.fulfill({json:u.pathname.endsWith('/franchise')?{nodes,links}:m?anime(Number(m[1])):[anime(101)],headers:{'access-control-allow-origin':'*'}})});
 await p.route('https://anilibria.top/api/v1/**',r=>{let u=new URL(r.request().url());let isSecond=u.searchParams.get('f[search]')?.includes('102');let id=isSecond?102:101;let rel={id,shikimori:{id},is_blocked_by_geo:false,is_blocked_by_copyrights:false};return r.fulfill({json:u.pathname.includes('/catalog/')?{data:[rel]}:{...rel,episodes:Array.from({length:115},(_,i)=>({id:'ep'+(i+1),ordinal:i+1,hls_720:'http://127.0.0.1:1420/test-video.webm'}))},headers:{'access-control-allow-origin':'*'}})});
 await p.goto('http://127.0.0.1:1420/#/watch/101'); await p.getByText('Сезоны и продолжения').waitFor(); assert.equal(await p.getByText('Спин-офф').count(),0);
 await p.getByText('115 доступно', {exact:false}).waitFor();await p.getByLabel('Диапазон серий').selectOption('2');await p.getByRole('button',{name:'Серия 115',exact:true}).click();assert((await p.getByRole('button',{name:'Серия 115',exact:true}).getAttribute('class')).includes('selected'));
 await p.getByRole('button',{name:'Сезон второй',exact:false}).click();await p.getByRole('heading',{name:'Сезон 102'}).waitFor();assert(p.url().includes('/102'));assert.deepStrictEqual(errs,[]);console.log('OK: связанная цепочка сезонов, исключение спин-оффа, диапазоны 115 серий и переход между сезонами');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
