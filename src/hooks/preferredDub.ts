const KEY='akari_preferred_dub';
export function readPreferredDub():string {try {const value=localStorage.getItem(KEY)||'';return value.length<=256?value:'';}catch{return '';}}
export function setPreferredDub(value:string):boolean {try{if(!value || value.length>256)return false;localStorage.setItem(KEY,value);return true}catch{return false;}}
export function clearPreferredDub():boolean {try{localStorage.removeItem(KEY);return true}catch{return false;}}
