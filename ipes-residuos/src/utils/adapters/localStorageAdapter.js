// utils/adapters/localStorageAdapter.js
const KEYS = { users:'rb_users', camps:'rb_campanas', precs:'rb_precargas', session:'rb_session' }

function load(k,f){ try{ const r=localStorage.getItem(k); return r?JSON.parse(r):f }catch{ return f } }
function save(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
function uid(p='id'){ return `${p}_${Math.random().toString(36).slice(2,10)}` }
function nowISO(){ return new Date().toISOString() }

(function ensure(){
  const users = load(KEYS.users, [])
  if(!users.some(u=>u.email==='admin@ipes.gob')){
    users.push({ id:uid('u'), nombre:'Admin Demo', email:'admin@ipes.gob', password:'admin', role:'admin', campañas:[] })
    save(KEYS.users, users)
  }
  if(!load(KEYS.camps, null)) save(KEYS.camps, [])
  if(!load(KEYS.precs, null)) save(KEYS.precs, [])
})()

function getActivaId(){ const cs = load(KEYS.camps, []); return cs.find(c=>c.activa)?.id || null }

function sanitizeItems(items=[]){
  const m=new Map()
  for(const it of items){
    const categoria=String(it.categoria||'').trim()
    const tipo=String(it.tipo||'').trim()
    const cantidad=Math.max(0, Number(it.cantidad||0))
    if(!categoria||!tipo||cantidad<=0) continue
    const k=`${categoria}|||${tipo}`
    m.set(k, (m.get(k)||0)+cantidad)
  }
  return [...m.entries()].map(([k,cantidad])=>{
    const [categoria,tipo]=k.split('|||'); return {categoria,tipo,cantidad}
  }).sort((a,b)=>a.categoria.localeCompare(b.categoria)||a.tipo.localeCompare(b.tipo))
}

export const LocalStorageAdapter = {
  auth:{
    getSession(){ return load(KEYS.session,null) },
    login(email,password){
      const users=load(KEYS.users,[])
      const u=users.find(x=>x.email===email && x.password===password)
      if(!u) throw new Error('Credenciales inválidas')
      const s={ id:u.id, email:u.email, nombre:u.nombre, role:u.role, campañas:u.campañas||[] }
      save(KEYS.session, s); return s
    },
    logout(){ localStorage.removeItem(KEYS.session) }
  },

  usuarios:{
    list(){ return load(KEYS.users,[]) },
    create(u){
      const users=load(KEYS.users,[])
      if(users.some(x=>x.email===u.email)) throw new Error('Email ya registrado')
      const nu={ id:uid('u'), ...u, campañas:u.campañas||[] }; users.push(nu); save(KEYS.users, users); return nu
    },
    update(u){
      const users=load(KEYS.users,[]); const i=users.findIndex(x=>x.id===u.id)
      if(i===-1) throw new Error('Usuario no encontrado')
      users[i]={...users[i],...u}; save(KEYS.users, users)
      const s=load(KEYS.session,null); if(s && s.id===u.id){ save(KEYS.session,{...s,nombre:users[i].nombre,campañas:users[i].campañas,role:users[i].role}) }
      return users[i]
    },
    remove(id){ const users=load(KEYS.users,[]); save(KEYS.users, users.filter(u=>u.id!==id)) },
  },

  campanas:{
    list(){ return load(KEYS.camps,[]) },
    getActiva(){ return this.list().find(c=>c.activa)||null },
    create(c){ const cs=load(KEYS.camps,[]); const nc={ id:uid('c'), activa:false, ...c }; cs.push(nc); save(KEYS.camps,cs); return nc },
    update(c){ const cs=load(KEYS.camps,[]); const i=cs.findIndex(x=>x.id===c.id); if(i===-1) throw new Error('Campaña no encontrada'); cs[i]={...cs[i],...c}; save(KEYS.camps,cs); return cs[i] },
    activate(id){ const cs=load(KEYS.camps,[]); for(const c of cs) c.activa=(c.id===id); save(KEYS.camps,cs) },
    close(id){ const cs=load(KEYS.camps,[]); const i=cs.findIndex(c=>c.id===id); if(i!==-1) cs[i].activa=false; save(KEYS.camps,cs) },
    remove(id){ const cs=load(KEYS.camps,[]); save(KEYS.camps, cs.filter(c=>c.id!==id)) },
  },

  precargas:{
    list({campana}={}){ const all=load(KEYS.precs,[]); return campana? all.filter(p=>p.campana===campana): all },
    getByCodigo(codigo){ const all=load(KEYS.precs,[]); const f=all.find(p=>p.codigo===codigo); if(!f) throw new Error('No existe esa precarga'); return f },
    create({vecino,barrio,items},{confirmar=false}={}){
      const sane=sanitizeItems(items||[]); if(sane.length===0) throw new Error('La precarga no puede estar vacía ni contener cantidades 0.')
      const campId=getActivaId(); if(!campId) throw new Error('No hay campaña activa')
      const all=load(KEYS.precs,[])
      const codigo=(()=>{ const now=new Date(); const yyyy=now.getFullYear(); const mm=String(now.getMonth()+1).padStart(2,'0'); const seq=String(all.length+1).padStart(4,'0'); return `BB-${yyyy}${mm}-${seq}` })()
      const p={ codigo, vecino:(vecino||'').trim(), barrio:(barrio||'').trim(), campana:campId, items:sane, fechaCreacion:nowISO(), confirmacion:{estado:'NO_CONFIRMADO'} }
      all.push(p); save(KEYS.precs, all)
      if(confirmar){ const s=load(KEYS.session,null); this.confirm(codigo, s||{email:'sistema@ipes.gob',nombre:'Sistema'}) }
      return p
    },
    update(codigo,changes){
      const all=load(KEYS.precs,[]); const i=all.findIndex(p=>p.codigo===codigo); if(i===-1) throw new Error('No existe esa precarga')
      const next={...all[i],...changes}
      if(changes.items){ const sane=sanitizeItems(changes.items); if(sane.length===0) throw new Error('La precarga no puede quedar sin ítems ni con cantidades 0.'); next.items=sane }
      all[i]=next; save(KEYS.precs, all); return next
    },
    confirm(codigo,voluntario){
      const all=load(KEYS.precs,[]); const i=all.findIndex(p=>p.codigo===codigo); if(i===-1) throw new Error('No existe esa precarga')
      all[i].confirmacion={ estado:'CONFIRMADO', fecha:nowISO(), voluntario:voluntario?.email||'usuario', voluntarioNombre:voluntario?.nombre||voluntario?.email||'usuario' }
      save(KEYS.precs, all); return all[i]
    },
    removeByCodigo(codigo){ const all=load(KEYS.precs,[]); save(KEYS.precs, all.filter(p=>p.codigo!==codigo)) },
    remove(codigo){ return this.removeByCodigo(codigo) },
  }
}
