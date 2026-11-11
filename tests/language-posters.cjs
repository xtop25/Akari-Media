const {chromium} = require('playwright');
const assert = require('assert');
(async()=>{
 const b=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 const p=await b.newPage(); await p.addInitScript(() => { if (!localStorage.getItem('akari_settings')) localStorage.setItem('akari_settings', JSON.stringify({language:'ru'})); }); const errors=[]; p.on('pageerror',e=>errors.push(e.message));
 const a={id:61323,name:'Ao no Hako',russian:'Голубая шкатулка',image:{original:'/assets/globals/missing_original.jpg'},score:'8.0',aired_on:'2026-01-01',episodes:12,status:'ongoing',genres:[]};
 await p.route('https://shikimori.io/api/**',r=>{const u=new URL(r.request().url());return r.fulfill({json:u.pathname.endsWith('/calendar') ? [] : u.pathname.includes('/animes/61323') ? a : [a],headers:{'access-control-allow-origin':'*'}})});
 let calls=0;await p.route('https://graphql.anilist.co/',r=>{const data=JSON.parse(r.request().postData()); if(data.query.includes('relations{edges')) return r.fulfill({json:{data:{Media:null}},headers:{'access-control-allow-origin':'*'}}); if(data.query.includes('externalLinks')) return r.fulfill({json:{data:{Media:{idMal:61323,externalLinks:[],streamingEpisodes:[]}}},headers:{'access-control-allow-origin':'*'}}); calls++;const ids=data.variables.ids; assert(ids.includes(61323));return r.fulfill({json:{data:{Page:{media:[{idMal:61323,coverImage:{extraLarge:'http://127.0.0.1:1420/cover.png'}}]}}},headers:{'access-control-allow-origin':'*'}})});
 await p.route('**/cover.png',r=>r.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')}));
 await p.goto('http://127.0.0.1:1420'); await p.waitForFunction(()=>[...document.images].some(i=>i.src.endsWith('/cover.png')&&i.naturalWidth>0));assert(calls>0);
 await p.getByRole('link',{name:'Настройки'}).click();await p.getByRole('combobox').first().selectOption('en');await p.getByRole('button',{name:'Сохранить'}).click();await p.getByRole('heading',{name:'Settings',exact:true}).waitFor();
 await p.getByRole('link',{name:'Home',exact:true}).click();await p.getByRole('heading',{name:'Discover something new'}).waitFor();await p.getByText('Airing',{exact:true}).first().waitFor();
 await p.getByRole('link',{name:'Catalog'}).click();await p.getByRole('button',{name:'Filters'}).click();await p.getByRole('button',{name:'TV series'}).waitFor();
 await p.getByRole('link',{name:'Schedule'}).click();await p.getByText('Monday',{exact:true}).first().waitFor();
 await p.getByRole('link',{name:'Favorites'}).click();await p.getByRole('heading',{name:'Favorites',exact:true}).waitFor();
 await p.getByRole('link',{name:'Home',exact:true}).click();await p.getByRole('button',{name:'Watch',exact:true}).click();await p.getByRole('button',{name:'Back'}).waitFor();await p.getByRole('button',{name:/Cinextream/}).waitFor();
 assert.deepStrictEqual(errors,[]); console.log('OK: AniList fallback, Russian/English settings, home, catalog, schedule, favorites and detail');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
