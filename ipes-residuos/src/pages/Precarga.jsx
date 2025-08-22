import { useEffect, useMemo, useRef, useState } from "react";
import { dataSource } from "../utils/dataSource.js";
import categories from "../data/categories.js";
import { ucFirst } from "../utils/calc.js";

export default function Precarga() {
  const session = dataSource.auth.getSession();
  const role = session?.role;
  const activeCamp = dataSource.campanas.getActiva();

  const [vecino, setVecino] = useState("");
  const [barrio, setBarrio] = useState("");
  const [items, setItems] = useState([]);

  // selección / búsqueda
  const [addCat, setAddCat] = useState("");
  const [addType, setAddType] = useState("");
  const [typeQuery, setTypeQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // cantidad (ahora va después de seleccionar el residuo)
  const [addQty, setAddQty] = useState(1);
  const qtyRef = useRef(null);

  // confirmación instantánea si corresponde
  const puedeConfirmarAhora = useMemo(() => {
    if (!session || !activeCamp) return false;
    if (role === "admin") return true;
    if (role === "voluntario") return (session?.campañas || []).includes(activeCamp.id);
    return false;
  }, [session, role, activeCamp]);
  const [confirmNow, setConfirmNow] = useState(false);

  // feedback / resumen
  const [saved, setSaved] = useState(null);
  const [msg, setMsg] = useState("");
  const flash = (t)=>{ setMsg(t); setTimeout(()=>setMsg(""),2200) }

  // universo de tipos (categoria + tipo)
  const allTypes = useMemo(() => {
    const list = [];
    for (const cat of categories) for (const t of cat.tipos) list.push({ categoria: cat.categoria, tipo: t });
    return list;
  }, []);

  // debounce para la búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(typeQuery.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [typeQuery]);

  // opciones para el <select> "Tipo" (respetamos lo existente)
  const typesForSelect = useMemo(() => {
    let base = addCat ? (categories.find(c=>c.categoria===addCat)?.tipos||[]).map(t=>({categoria:addCat,tipo:t})) : allTypes;
    if (debouncedQuery) base = base.filter(x => x.tipo.toLowerCase().includes(debouncedQuery));
    return base;
  }, [addCat, allTypes, debouncedQuery]);

  useEffect(() => {
    if (typesForSelect.length > 0) {
      const first = typesForSelect[0];
      setAddType(prev => prev && typesForSelect.some(x => x.tipo === prev && x.categoria === (addCat || x.categoria)) ? prev : first.tipo);
    } else setAddType("");
  }, [typesForSelect, addCat]);

  // --- AUTOCOMPLETE de "tipo" (sugerencias debajo como Google) ---
  const [showSug, setShowSug] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(() => {
    // Si hay categoría, sugerimos dentro de esa categoría; sino en todas
    let base = addCat
      ? (categories.find(c=>c.categoria===addCat)?.tipos||[]).map(t=>({categoria:addCat,tipo:t}))
      : allTypes;
    // Sólo sugerimos si hay texto
    if (!debouncedQuery) return [];
    base = base.filter(x => x.tipo.toLowerCase().includes(debouncedQuery));
    return base.slice(0, 8); // tope de 8 sugerencias
  }, [addCat, debouncedQuery, allTypes]);

  const selectSuggestion = (sug) => {
    setAddCat(sug.categoria);
    setAddType(sug.tipo);
    setTypeQuery(ucFirst(sug.tipo)); // feedback visual al usuario
    setShowSug(false);
    setActiveIndex(-1);
    // enfocamos cantidad para agilizar la carga
    setTimeout(() => qtyRef.current?.focus(), 0);
  };

  const handleTypeKeyDown = (e) => {
    if (!showSug && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setShowSug(true);
    }
    if (!suggestions.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (showSug) {
        e.preventDefault();
        const idx = activeIndex >= 0 ? activeIndex : 0;
        selectSuggestion(suggestions[idx]);
      }
    } else if (e.key === "Escape") {
      setShowSug(false);
      setActiveIndex(-1);
    }
  };

  // --- lógica de items ---
  const addItem = () => {
    const qty = Math.max(0, Number(addQty || 0));
    if (!qty) { alert("La cantidad debe ser mayor a 0"); return; }
    let cat = addCat; let tipo = addType;
    if (!cat && tipo) { const f = allTypes.find(x=>x.tipo===tipo); cat = f?.categoria || "" }
    if (!cat || !tipo) return;
    setItems(prev => {
      const i = prev.findIndex(it => it.categoria === cat && it.tipo === tipo);
      if (i >= 0) { const n=[...prev]; n[i]={...n[i], cantidad:Number(n[i].cantidad||0)+qty}; return n }
      return [...prev, { categoria: cat, tipo, cantidad: qty }];
    });

    // Reseteo solicitado: limpiar la lupita y dejar listo para una nueva búsqueda
    setAddQty(1);
    setTypeQuery("");       // limpia el campo de búsqueda (la "lupita")
    setShowSug(false);      // cierra las sugerencias
    setActiveIndex(-1);

    // volver a buscar otro tipo cómodamente (foco al buscador)
    setTimeout(() => {
      const el = document.getElementById("search-tipo");
      el?.focus();
      el?.select?.();
    }, 0);
  };

  const cambiarCantidad = (idx, val) => {
    setItems(prev => { const n=[...prev]; n[idx]={...n[idx], cantidad:Math.max(0,Number(val||0))}; return n })
  };
  const quitarItem = (idx) => setItems(prev => prev.filter((_,i)=>i!==idx));

  const guardar = () => {
    if (!activeCamp) { alert("No hay campaña activa"); return; }
    const sane = (items||[]).filter(it => Number(it.cantidad||0) > 0)
    if (sane.length === 0) { alert('La precarga no puede estar vacía ni contener cantidades 0.'); return; }
    try {
      const created = dataSource.precargas.create({
        vecino: vecino.trim(), barrio: barrio.trim(), items: sane
      }, { confirmar: confirmNow && puedeConfirmarAhora })
      setSaved(created); setItems([]); setVecino(''); setBarrio(''); setConfirmNow(false); flash('Precarga guardada')
    } catch (e) { alert(e.message || 'No se pudo guardar') }
  };

  return (
    <section className="grid">
      <div className="card">
        <h2 className="mt-0">Precarga</h2>
        <p className="small">Completá tu <strong>nombre</strong>, <strong>barrio</strong> y los <strong>ítems</strong>. Usamos la <strong>campaña activa</strong> automáticamente.</p>
        {msg && <p className="small" style={{color:"#2e7d32"}}>{msg}</p>}

        <div className="grid cols-2">
          <div><label>Nombre</label><input value={vecino} onChange={e=>setVecino(e.target.value)} placeholder="Tu nombre" /></div>
          <div><label>Barrio</label><input value={barrio} onChange={e=>setBarrio(e.target.value)} placeholder="Tu barrio" /></div>

          {/* Buscar tipo (con lupa + sugerencias debajo) */}
          <div className="autocomplete">
            <label>Buscar tipo</label>
            <div className="input-icon">
              <svg className="icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l4.25 4.25c.41.41 1.09.41 1.5 0s.41-1.09 0-1.5L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"/>
              </svg>
              <input
                id="search-tipo"
                placeholder="Escribí para filtrar (p. ej. celular, impresora…) "
                value={typeQuery}
                onChange={(e)=>{ setTypeQuery(e.target.value); setShowSug(true); setActiveIndex(-1) }}
                onFocus={()=> setShowSug(true)}
                onKeyDown={handleTypeKeyDown}
                aria-autocomplete="list"
                aria-expanded={showSug}
                aria-controls="tipo-suggestions"
              />
            </div>

            {showSug && suggestions.length > 0 && (
              <ul id="tipo-suggestions" role="listbox" className="suggestions" onMouseLeave={()=>setActiveIndex(-1)}>
                {suggestions.map((s, i) => (
                  <li
                    key={`${s.categoria}::${s.tipo}`}
                    role="option"
                    aria-selected={i===activeIndex}
                    className={i===activeIndex ? "active" : ""}
                    onMouseEnter={()=>setActiveIndex(i)}
                    onMouseDown={(e)=>{ e.preventDefault(); selectSuggestion(s) }}
                  >
                    <span className="s-type">{ucFirst(s.tipo)}</span>
                    <span className="s-cat">{s.categoria}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Categoría / Tipo (siguen existiendo) */}
          <div>
            <label>Categoría</label>
            <select value={addCat} onChange={e=>setAddCat(e.target.value)}>
              <option value="">(Cualquiera)</option>
              {categories.map(c => <option key={c.categoria} value={c.categoria}>{c.categoria}</option>)}
            </select>
          </div>
          <div>
            <label>Tipo</label>
            <select value={addType} onChange={e=>setAddType(e.target.value)}>
              {typesForSelect.length===0 && <option value="">(Sin resultados)</option>}
              {typesForSelect.map(t => (
                <option key={`${t.categoria}::${t.tipo}`} value={t.tipo}>
                  {addCat ? ucFirst(t.tipo) : `${ucFirst(t.tipo)} — ${t.categoria}`}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad (ahora después de seleccionar el residuo) */}
          <div>
            <label>Cantidad</label>
            <input
              ref={qtyRef}
              type="number"
              min={1}
              value={addQty}
              onChange={e=>setAddQty(Math.max(1, Number(e.target.value||1)))}
              onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); addItem() } }}
            />
          </div>

          {/* Agregar */}
          <div style={{display:"flex",alignItems:"end"}}>
            <button type="button" className="secondary" onClick={addItem}>Agregar</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mt-0">Mis ítems</h3>
        {items.length===0 ? (
          <p className="small">Todavía no agregaste productos.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Categoría</th><th>Tipo</th><th style={{width:220}}>Cantidad</th><th style={{width:120}}>Acciones</th></tr></thead>
            <tbody>
              {items.map((it,idx)=>(
                <tr key={`${it.categoria}-${it.tipo}-${idx}`}>
                  <td>{it.categoria}</td>
                  <td>{ucFirst(it.tipo)}</td>
                  <td>
                    <div className="NumberInput">
                      <button type="button" className="ghost" onClick={()=>cambiarCantidad(idx,(it.cantidad||0)-1)} aria-label={`Disminuir ${ucFirst(it.tipo)}`}>−</button>
                      <input type="number" min={0} value={it.cantidad} onChange={e=>cambiarCantidad(idx,e.target.value)} aria-label={`Cantidad de ${ucFirst(it.tipo)}`} />
                      <button type="button" className="ghost" onClick={()=>cambiarCantidad(idx,(it.cantidad||0)+1)} aria-label={`Aumentar ${ucFirst(it.tipo)}`}>+</button>
                    </div>
                  </td>
                  <td><button type="button" className="ghost danger" onClick={()=>quitarItem(idx)}>Quitar</button></td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}

        {puedeConfirmarAhora && (
          <label className="big-check" style={{marginTop:".8rem"}}>
            <input type="checkbox" checked={confirmNow} onChange={e=>setConfirmNow(e.target.checked)} />
            Confirmar ahora
          </label>
        )}

        <div className="actions split" style={{marginTop:".8rem"}}>
          <div className="left">
            <button type="button" className="ghost" onClick={()=>{ setItems([]); setVecino(''); setBarrio(''); setConfirmNow(false); setTypeQuery(''); setAddCat(''); setAddType(''); }}>Limpiar</button>
          </div>
          <div className="right">
            <button type="button" onClick={guardar}>Guardar</button>
          </div>
        </div>
      </div>

      {saved && (
        <div className="card">
          <h3 className="mt-0">Resumen</h3>
          <div className="grid cols-2">
            <div>
              <label>Código</label>
              <div className="copy-wrap">
                <strong>{saved.codigo}</strong>
                <button className="ghost" onClick={async()=>{ await navigator.clipboard.writeText(saved.codigo); flash('Código copiado') }}>Copiar</button>
              </div>
            </div>
            <div><label>Campaña</label><div>{activeCamp?.nombre || '—'}</div></div>
            <div><label>Vecino</label><div>{saved.vecino || '—'}</div></div>
            <div><label>Barrio</label><div>{saved.barrio || '—'}</div></div>
          </div>
        </div>
      )}
    </section>
  );
}
