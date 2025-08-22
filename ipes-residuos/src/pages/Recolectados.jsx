import { useEffect, useMemo, useState } from "react";
import { dataSource } from "../utils/dataSource.js";
import categories from "../data/categories.js";

export default function Recolectados() {
  const session = dataSource.auth.getSession();
  const role = session?.role;

  // campañas visibles según rol
  const allCamps = dataSource.campanas.list();
  const allowedCampIds = role === "admin" ? allCamps.map(c => c.id) : (session?.campañas || []);
  const visibleCamps = allCamps.filter(c => allowedCampIds.includes(c.id));

  // filtros
  const [estado, setEstado] = useState("total"); // total|confirmados|no
  const [campanaId, setCampanaId] = useState(""); // "" = todas visibles
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  // debounce del buscador
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // dataset base (solo campañas visibles)
  const base = dataSource.precargas.list({});
  const baseAllowed = base.filter(p => allowedCampIds.includes(p.campana));

  const filtered = useMemo(() => {
    let arr = baseAllowed;

    // campaña
    if (campanaId) arr = arr.filter(p => p.campana === campanaId);

    // estado
    if (estado === "confirmados") {
      arr = arr.filter(p => p.confirmacion?.estado === "CONFIRMADO");
    } else if (estado === "no") {
      arr = arr.filter(p => p.confirmacion?.estado !== "CONFIRMADO");
    }

    // rango fechas
    if (desde) arr = arr.filter(p => (p.fechaCreacion || "").slice(0,10) >= desde);
    if (hasta) arr = arr.filter(p => (p.fechaCreacion || "").slice(0,10) <= hasta);

    // texto
    if (debouncedQ) {
      arr = arr.filter(p => {
        const v = (p.vecino || "").toLowerCase();
        const b = (p.barrio || "").toLowerCase();
        const hitBase = v.includes(debouncedQ) || b.includes(debouncedQ);
        const hitItems = (p.items || []).some(it =>
          it.categoria.toLowerCase().includes(debouncedQ) ||
          it.tipo.toLowerCase().includes(debouncedQ)
        );
        return hitBase || hitItems;
      });
    }

    // excluir los que no tengan ítems con cantidad > 0
    arr = arr
      .map(p => ({ ...p, items: (p.items || []).filter(it => Number(it.cantidad || 0) > 0) }))
      .filter(p => p.items.length > 0)

    return arr;
  }, [baseAllowed, estado, campanaId, desde, hasta, debouncedQ]);

  // totales por categoría/tipo del dataset filtrado
  const totals = useMemo(() => {
    const map = new Map(); // key = cat|||tipo -> cantidad
    for (const p of filtered) {
      for (const it of (p.items || [])) {
        const key = `${it.categoria}|||${it.tipo}`;
        const val = Number(it.cantidad || 0);
        if (val <= 0) continue;
        map.set(key, (map.get(key) || 0) + val);
      }
    }
    const out = [];
    for (const cat of categories) {
      const tiposOut = [];
      for (const t of cat.tipos) {
        const key = `${cat.categoria}|||${t}`;
        const val = map.get(key) || 0;
        if (val > 0) tiposOut.push({ tipo: t, cantidad: val });
      }
      if (tiposOut.length > 0) out.push({ categoria: cat.categoria, tipos: tiposOut });
    }
    return out;
  }, [filtered]);

  const campName = (id) => allCamps.find(c => c.id === id)?.nombre || id;

  return (
    <section className="grid">
      <div className="card">
        <h2 className="mt-0">Recolectados</h2>
        <p className="small">
          Filtrá por <strong>estado</strong>, <strong>campaña</strong>, <strong>fechas</strong> o <strong>texto</strong>. 
          {role === 'voluntario' ? ' Solo ves tus campañas asignadas.' : ''}
        </p>

        {/* Filtros */}
        <div className="grid cols-2">
          <div>
            <label>Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="total">Total</option>
              <option value="confirmados">Confirmados</option>
              <option value="no">No confirmados</option>
            </select>
          </div>
          <div>
            <label>Campaña</label>
            <select value={campanaId} onChange={(e) => setCampanaId(e.target.value)}>
              <option value="">(Todas)</option>
              {visibleCamps.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.activa ? " (activa)" : ""}</option>)}
            </select>
          </div>
          <div>
            <label>Desde</label>
            <input type="date" value={desde} onChange={(e)=>setDesde(e.target.value)} />
          </div>
          <div>
            <label>Hasta</label>
            <input type="date" value={hasta} onChange={(e)=>setHasta(e.target.value)} />
          </div>
          <div style={{gridColumn:'1 / -1'}}>
            <label>Buscar</label>
            <input
              placeholder="Vecino, barrio, categoría o tipo"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabla de resultados */}
      <div className="card">
        <h3 className="mt-0">Resultados</h3>
        {filtered.length === 0 ? (
          <p className="small">No hay registros con los filtros actuales.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Código</th>
                  <th>Vecino</th>
                  <th>Barrio</th>
                  <th>Campaña</th>
                  <th>Estado</th>
                  <th>Voluntario</th>
                  <th>Ítems</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.codigo}>
                    <td>{(p.fechaCreacion || "").slice(0,16).replace("T"," ")}</td>
                    <td>{p.codigo}</td>
                    <td>{p.vecino || "—"}</td>
                    <td>{p.barrio || "—"}</td>
                    <td>{campName(p.campana)}</td>
                    <td>
                      {p.confirmacion?.estado === "CONFIRMADO"
                        ? <span className="badge">CONFIRMADO</span>
                        : <span className="badge gray">NO</span>}
                    </td>
                    <td>{p.confirmacion?.voluntarioNombre || p.confirmacion?.voluntario || "—"}</td>
                    <td className="small">
                      {(p.items || [])
                        .filter(it => Number(it.cantidad || 0) > 0)
                        .map(it => `${it.tipo} (${it.cantidad})`)
                        .join(", ")
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totales por categoría y tipo */}
      <div className="card">
        <h3 className="mt-0">Totales por categoría y tipo</h3>
        {totals.length === 0 ? (
          <p className="small">No hay cantidades para mostrar.</p>
        ) : (
          <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))'}}>
            {totals.map(group => (
              <div key={group.categoria} className="card" style={{ margin: 0 }}>
                <strong>{group.categoria}</strong>
                <ul className="small" style={{margin:'.5rem 0 0 1rem'}}>
                  {group.tipos.map(t => (
                    <li key={t.tipo}>{t.tipo}: <strong>{t.cantidad}</strong></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
