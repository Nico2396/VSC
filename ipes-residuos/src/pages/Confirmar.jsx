import { useEffect, useMemo, useState } from "react";
import { dataSource } from "../utils/dataSource.js";
import categories from "../data/categories.js";
import { ucFirst } from "../utils/calc.js";

export default function Confirmar() {
  const session = dataSource.auth.getSession();
  const role = session?.role;

  const [codigo, setCodigo] = useState("");
  const [precarga, setPrecarga] = useState(null);
  const [items, setItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [originalItems, setOriginalItems] = useState([]);
  const [msg, setMsg] = useState("");

  const campanas = dataSource.campanas.list();
  const campName = useMemo(() => {
    if (!precarga) return "";
    const c = campanas.find((x) => x.id === precarga.campana);
    return c ? c.nombre : precarga.campana;
  }, [precarga, campanas]);

  const puedeConfirmar = useMemo(() => {
    if (!precarga) return false;
    if (role === "admin") return true;
    if (role === "voluntario") return (session?.campañas || []).includes(precarga.campana);
    return false;
  }, [role, session, precarga]);

  const canDelete = role === "admin";
  const flash = (t)=>{ setMsg(t); setTimeout(()=>setMsg(""),2200) }

  const buscar = () => {
    const c = codigo.trim(); if (!c) return;
    try {
      const p = dataSource.precargas.getByCodigo(c);
      setPrecarga(p);
      setItems((p.items || []).map(it => ({ ...it, cantidad: Number(it.cantidad || 0) })));
      setIsEditing(false); setOriginalItems([]); flash("Precarga encontrada");
    } catch {
      setPrecarga(null); setItems([]); setIsEditing(false); setOriginalItems([]); alert("No se encontró esa precarga");
    }
  };

  const cambiarCantidad = (idx, val) => { if (!isEditing) return;
    setItems(prev => { const n=[...prev]; n[idx]={...n[idx], cantidad:Math.max(0,Number(val||0))}; return n })
  }
  const inc = (idx)=> cambiarCantidad(idx, (items[idx]?.cantidad||0)+1)
  const dec = (idx)=> cambiarCantidad(idx, (items[idx]?.cantidad||0)-1)
  const quitarItem = (idx)=> isEditing && setItems(prev=>prev.filter((_,i)=>i!==idx))

  // agregar
  const allTypes = useMemo(()=>{ const out=[]; for(const cat of categories){ for(const t of cat.tipos) out.push({categoria:cat.categoria,tipo:t}) } return out },[])
  const [addQty,setAddQty]=useState(1); const [addCat,setAddCat]=useState(""); const [addType,setAddType]=useState(""); const [typeQuery,setTypeQuery]=useState(""); const [debQ,setDebQ]=useState("")
  useEffect(()=>{ const t=setTimeout(()=>setDebQ(typeQuery.trim().toLowerCase()),200); return ()=>clearTimeout(t)},[typeQuery])
  const typesForSelect = useMemo(()=>{
    let base = addCat ? (categories.find(c=>c.categoria===addCat)?.tipos||[]).map(t=>({categoria:addCat,tipo:t})) : allTypes
    if(debQ) base = base.filter(x => x.tipo.toLowerCase().includes(debQ))
    return base
  },[addCat,allTypes,debQ])
  useEffect(()=>{ if(typesForSelect.length>0){ const f=typesForSelect[0]; setAddType(prev=> prev && typesForSelect.some(x=>x.tipo===prev && x.categoria===(addCat||x.categoria)) ? prev : f.tipo) } else setAddType("") },[typesForSelect,addCat])
  const agregarItem = ()=>{ if(!isEditing) return; const qty=Math.max(0,Number(addQty||0)); if(!qty){ alert('La cantidad debe ser mayor a 0'); return }
    let cat=addCat, tipo=addType; if(!cat && tipo){ const f=allTypes.find(x=>x.tipo===tipo); cat=f?.categoria||"" } if(!cat||!tipo) return
    setItems(prev=>{ const i=prev.findIndex(it=>it.categoria===cat && it.tipo===tipo); if(i>=0){ const n=[...prev]; n[i]={...n[i], cantidad:Number(n[i].cantidad||0)+qty}; return n } return [...prev,{categoria:cat,tipo, cantidad:qty}] })
    setAddQty(1)
  }

  const startEdit = ()=>{ if(!puedeConfirmar){ alert('No estás asignado a esta campaña.'); return } setOriginalItems(items); setIsEditing(true) }
  const cancelarEdicion = ()=>{ if(!isEditing) return; setItems(originalItems); setIsEditing(false); setOriginalItems([]); flash('Edición cancelada') }
  const eliminarPrecarga = ()=>{ if(!precarga || !canDelete) return; if(!confirm('¿Eliminar esta precarga? Esta acción no puede deshacerse.')) return;
    dataSource.precargas.removeByCodigo(precarga.codigo); setPrecarga(null); setItems([]); setIsEditing(false); setOriginalItems([]); setCodigo(''); flash('Precarga eliminada')
  }
  const confirmar = ()=>{
    if(!precarga) return; if(!puedeConfirmar){ alert('No tenés permisos para confirmar esta campaña.'); return }
    const sane = (items||[]).filter(it=>Number(it.cantidad||0)>0); if(sane.length===0){ alert('La precarga no puede estar vacía ni con cantidades 0.'); return }
    dataSource.precargas.update(precarga.codigo,{items:sane}); dataSource.precargas.confirm(precarga.codigo, session || {email:'sistema@ipes.gob', nombre:'Sistema'})
    const p=dataSource.precargas.getByCodigo(precarga.codigo); setPrecarga(p); setItems(p.items||[]); setIsEditing(false); setOriginalItems([]); flash('Precarga confirmada')
  }

  useEffect(()=>{ setPrecarga(null); setItems([]); setIsEditing(false); setOriginalItems([]) },[])

  return (
    <section className="card">
      <h2 className="mt-0">Confirmar por código</h2>
      <p className="small">Buscá por <strong>código</strong>, revisá/edita y <strong>confirmá</strong>.</p>
      {msg && <p className="small" style={{color:"#2e7d32"}}>{msg}</p>}

      <div className="grid cols-2" style={{alignItems:"end"}}>
        <div>
          <label>Código</label>
          <input value={codigo} onChange={e=>setCodigo(e.target.value)} placeholder="Ej.: BB-202508-0001" onKeyDown={e=>e.key==='Enter'&&buscar()} />
        </div>
        <div className="actions end">
          <button type="button" className="ghost" onClick={()=>{ setCodigo(''); setPrecarga(null); setItems([]); setIsEditing(false); setOriginalItems([]) }}>Limpiar</button>
          <button type="button" onClick={buscar}>Buscar</button>
        </div>
      </div>

      {!precarga ? (
        <p className="small" style={{marginTop:".8rem"}}>Tip: pegá el código y presioná Enter.</p>
      ) : (
        <>
          <div className="card" style={{marginTop:".9rem"}}>
            <h3 className="mt-0">Detalle de precarga</h3>
            <div className="grid cols-2">
              <div>
                <label>Código</label>
                <div className="copy-wrap">
                  <span style={{fontWeight:700}}>{precarga.codigo}</span>
                  <button className="ghost" onClick={async()=>{ await navigator.clipboard.writeText(precarga.codigo); flash('Código copiado') }}>Copiar</button>
                </div>
              </div>
              <div>
                <label>Estado</label>
                <div>{precarga.confirmacion?.estado==='CONFIRMADO' ? <span className="badge">CONFIRMADO</span> : <span className="badge gray">NO CONFIRMADO</span>}</div>
              </div>
              <div><label>Vecino</label><div>{precarga.vecino||'—'}</div></div>
              <div><label>Barrio</label><div>{precarga.barrio||'—'}</div></div>
              <div><label>Campaña</label><div>{campName||'—'}</div></div>
              <div><label>Fecha creación</label><div>{(precarga.fechaCreacion||'').replace('T',' ').slice(0,16)||'—'}</div></div>
            </div>
          </div>

          <div className="card">
            <h3 className="mt-0">Ítems {isEditing ? "(edición)" : ""}</h3>
            {items.length===0 ? <p className="small">No hay ítems cargados.</p> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Categoría</th><th>Tipo</th><th style={{width:260}}>Cantidad</th>{isEditing && <th style={{width:120}}>Acciones</th>}</tr></thead>
                  <tbody>
                    {items.map((it,idx)=>(
                      <tr key={`${it.categoria}-${it.tipo}-${idx}`}>
                        <td>{it.categoria}</td>
                        <td>{ucFirst(it.tipo)}</td>
                        <td>
                          <div className="NumberInput" aria-disabled={!isEditing}>
                            <button type="button" className="ghost" onClick={()=>isEditing&&dec(idx)} disabled={!isEditing} aria-label={`Disminuir ${ucFirst(it.tipo)}`}>−</button>
                            <input type="number" min={0} value={it.cantidad} onChange={e=>cambiarCantidad(idx,e.target.value)} disabled={!isEditing} aria-label={`Cantidad de ${ucFirst(it.tipo)}`} />
                            <button type="button" className="ghost" onClick={()=>isEditing&&inc(idx)} disabled={!isEditing} aria-label={`Aumentar ${ucFirst(it.tipo)}`}>+</button>
                          </div>
                        </td>
                        {isEditing && (<td><button type="button" className="ghost danger" onClick={()=>quitarItem(idx)}>Quitar</button></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {isEditing && (
              <div className="card" style={{marginTop:".8rem"}}>
                <h4 className="mt-0">Agregar producto</h4>
                <div className="grid cols-2">
                  <div><label>Cantidad</label><input type="number" min={1} value={addQty} onChange={e=>setAddQty(Math.max(1,Number(e.target.value||1)))} /></div>
                  <div><label>Buscar tipo (opcional)</label><input placeholder="Escribí para filtrar tipos…" value={typeQuery} onChange={e=>setTypeQuery(e.target.value)} /></div>
                  <div>
                    <label>Categoría</label>
                    <select value={addCat} onChange={e=>setAddCat(e.target.value)}>
                      <option value="">(Cualquiera)</option>
                      {categories.map(c=> <option key={c.categoria} value={c.categoria}>{c.categoria}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Tipo</label>
                    <select value={addType} onChange={e=>setAddType(e.target.value)}>
                      {typesForSelect.length===0 && <option value="">(Sin resultados)</option>}
                      {typesForSelect.map(t=> (
                        <option key={`${t.categoria}::${t.tipo}`} value={t.tipo}>
                          {addCat ? ucFirst(t.tipo) : `${ucFirst(t.tipo)} — ${t.categoria}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{display:"flex",alignItems:"end"}}><button type="button" className="secondary" onClick={agregarItem}>Agregar</button></div>
                </div>
                <p className="small" style={{marginTop:".4rem"}}>Si no elegís categoría, el selector de <em>Tipo</em> muestra todos los tipos.</p>
              </div>
            )}
          </div>

          {/* Acciones coherentes: izquierda (Eliminar/Cancelar), derecha (Editar/Confirmar) */}
          <div className="actions split">
            <div className="left">
              {!isEditing ? (
                <button type="button" className={`ghost ${canDelete?'danger':''}`} onClick={canDelete?eliminarPrecarga:undefined} disabled={!canDelete} title={canDelete?'Eliminar precarga':'Solo admin puede eliminar'}>Eliminar</button>
              ) : (
                <button type="button" className="ghost" onClick={cancelarEdicion}>Cancelar</button>
              )}
            </div>
            <div className="right">
              <button type="button" className="ghost" onClick={startEdit} disabled={isEditing || !puedeConfirmar} title={!puedeConfirmar ? "No asignado a esta campaña" : (isEditing ? "Ya estás editando" : "Editar ítems")}>Editar</button>
              <button type="button" onClick={confirmar} disabled={!puedeConfirmar} title={!puedeConfirmar ? "No asignado a esta campaña" : "Confirmar esta precarga"}>Confirmar</button>
            </div>
          </div>

          {precarga?.confirmacion?.estado==='CONFIRMADO' && (
            <div className="info-card" style={{marginTop:".8rem"}}>
              <strong>Confirmado el: </strong>{(precarga.confirmacion?.fecha||'').replace('T',' ').slice(0,16)}{" · "}
              <strong>por: </strong>{precarga.confirmacion?.voluntarioNombre || precarga.confirmacion?.voluntario || '—'}
            </div>
          )}
        </>
      )}
    </section>
  );
}
