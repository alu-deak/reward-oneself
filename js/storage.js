/* storage.js
   Simple localStorage wrapper for reward-oneself frontend-only mode.
   API:
     Storage.get(key, defaultVal)
     Storage.set(key, value)
     Storage.addItem(collectionKey, item)
     Storage.getAll(collectionKey)
     Storage.removeItemById(collectionKey, id)
     Storage.changePoints(delta)
     Storage.getPoints()
     Storage.initDefaults()
   Items have an `id` string field generated automatically.
*/

const Storage = (function () {
  function _key(k) { return `rof:${k}`; }

  function get(key, defaultVal=null){
    const v = localStorage.getItem(_key(key));
    if(!v) return defaultVal;
    try{ return JSON.parse(v); }catch(e){ return defaultVal; }
  }

  function set(key, value){
    localStorage.setItem(_key(key), JSON.stringify(value));
  }

  function _genId(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function addItem(collectionKey, item){
    const arr = get(collectionKey, []);
    const it = Object.assign({}, item);
    if(!it.id) it.id = _genId();
    arr.push(it);
    set(collectionKey, arr);
    return it;
  }

  function getAll(collectionKey){
    return get(collectionKey, []);
  }

  function removeItemById(collectionKey, id){
    const arr = get(collectionKey, []);
    const filtered = arr.filter(i => i.id !== id);
    set(collectionKey, filtered);
    return filtered;
  }

  function findById(collectionKey, id){
    const arr = get(collectionKey, []);
    return arr.find(i => i.id === id) || null;
  }

  function changePoints(delta){
    const p = get('points', 0) || 0;
    const np = Number(p) + Number(delta);
    set('points', np);
    return np;
  }

  function getPoints(){ return get('points', 0) || 0; }

  function initDefaults(){
    if(get('points')===null) set('points', 0);
    if(get('tasks')===null) set('tasks', []);
    if(get('rewards')===null) set('rewards', []);
    if(get('username')===null) set('username', 'Guest');
    if(get('rest_time_to_work_ratio')===null) set('rest_time_to_work_ratio', 5);
  }

  function getRestRatio(){
    return get('rest_time_to_work_ratio', 5) || 5;
  }

  function setRestRatio(ratio){
    set('rest_time_to_work_ratio', ratio);
  }

  return {
    get, set, addItem, getAll, removeItemById, findById,
    changePoints, getPoints, initDefaults, getRestRatio, setRestRatio
  };
})();

// expose for templates
window.Storage = Storage;
