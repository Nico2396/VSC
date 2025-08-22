import { useEffect, useMemo, useState } from "react";
import { dataSource } from "../utils/dataSource.js";

export default function Admin() {
  // --- Estado base ---
  const [campanas, setCampanas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [msg, setMsg] = useState("");

  // --- Formularios Campañas ---
  const [nuevoCamp, setNuevoCamp] = useState({
    nombre: "",
    fechaInicio: "",
    fechaFin: "",
    ubicacion: "",
  });
  const [editCamp, setEditCamp] = useState(null); // edición inline

  // --- Formularios Usuarios ---
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "voluntario",
    campañas: [],
  });

  // --- Asignación individual rápida ---
  const [userAssign, setUserAssign] = useState({ userId: "", campId: "" });

  // --- Asignación en lote ---
  const [bulkCampId, setBulkCampId] = useState("");
  const [bulkFilter, setBulkFilter] = useState("");
  const [bulkSelected, setBulkSelected] = useState(new Set());

  const loadAll = () => {
    const cs = dataSource.campanas.list();
    const us = dataSource.usuarios.list();
    setCampanas(cs);
    setUsuarios(us);
    // por comodidad, si hay activa, dejarla preseleccionada en el módulo de lote
    const active = cs.find((c) => c.activa);
    setBulkCampId((prev) => prev || active?.id || "");
  };

  useEffect(() => {
    loadAll();
  }, []);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 2200);
  };

  // =========================
  //        CAMPAÑAS
  // =========================
  const crearCampana = () => {
    if (!nuevoCamp.nombre.trim()) return;
    try {
      dataSource.campanas.create({
        nombre: nuevoCamp.nombre.trim(),
        fechaInicio: nuevoCamp.fechaInicio || "",
        fechaFin: nuevoCamp.fechaFin || "",
        ubicacion: nuevoCamp.ubicacion || "",
      });
      setNuevoCamp({ nombre: "", fechaInicio: "", fechaFin: "", ubicacion: "" });
      loadAll();
      flash("Campaña creada");
    } catch (e) {
      alert(e.message || "No se pudo crear la campaña");
    }
  };

  const guardarCampanaEdit = () => {
    if (!editCamp) return;
    try {
      dataSource.campanas.update(editCamp);
      setEditCamp(null);
      loadAll();
      flash("Campaña actualizada");
    } catch (e) {
      alert(e.message || "No se pudo actualizar");
    }
  };

  const activarCampana = (id) => {
    dataSource.campanas.activate(id);
    loadAll();
    flash("Campaña activada (las demás quedaron inactivas)");
  };

  const cerrarCampana = (id) => {
    dataSource.campanas.close(id);
    loadAll();
    flash("Campaña cerrada");
  };

  const eliminarCampana = (id) => {
    if (!confirm("¿Eliminar esta campaña? Esta acción no puede deshacerse.")) return;
    dataSource.campanas.remove(id);
    loadAll();
    flash("Campaña eliminada");
  };

  // =========================
  //         USUARIOS
  // =========================
  const crearUsuario = () => {
    if (!nuevoUsuario.email.trim() || !nuevoUsuario.password.trim()) {
      alert("Email y contraseña son obligatorios");
      return;
    }
    try {
      dataSource.usuarios.create({
        nombre: nuevoUsuario.nombre.trim() || nuevoUsuario.email.trim(),
        email: nuevoUsuario.email.trim(),
        password: nuevoUsuario.password,
        role: nuevoUsuario.role,
        campañas: nuevoUsuario.campañas || [],
      });
      setNuevoUsuario({ nombre: "", email: "", password: "", role: "voluntario", campañas: [] });
      loadAll();
      flash("Usuario creado");
    } catch (e) {
      alert(e.message || "No se pudo crear el usuario");
    }
  };

  const eliminarUsuario = (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    dataSource.usuarios.remove(id);
    loadAll();
    flash("Usuario eliminado");
  };

  const asignarCampana = () => {
    const { userId, campId } = userAssign;
    if (!userId || !campId) return;
    const u = usuarios.find((x) => x.id === userId);
    if (!u) return;
    const setCampanias = Array.from(new Set([...(u.campañas || []), campId]));
    dataSource.usuarios.update({ ...u, campañas: setCampanias });
    setUserAssign({ userId: "", campId: "" });
    loadAll();
    flash("Campaña asignada al usuario");
  };

  const quitarCampana = (userId, campId) => {
    const u = usuarios.find((x) => x.id === userId);
    if (!u) return;
    const next = (u.campañas || []).filter((id) => id !== campId);
    dataSource.usuarios.update({ ...u, campañas: next });
    loadAll();
    flash("Campaña quitada del usuario");
  };

  // =========================
  //  ASIGNACIÓN EN LOTE
  // =========================
  const filteredUsers = useMemo(() => {
    const q = bulkFilter.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) =>
        (u.nombre || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q)
    );
  }, [usuarios, bulkFilter]);

  const toggleSelect = (id) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectVisible = () => {
    const ids = filteredUsers.map((u) => u.id);
    setBulkSelected(new Set(ids));
  };

  const clearSelection = () => setBulkSelected(new Set());

  const bulkAssign = () => {
    if (!bulkCampId || bulkSelected.size === 0) return;
    const updates = [];
    filteredUsers.forEach((u) => {
      if (!bulkSelected.has(u.id)) return;
      const setCampanias = Array.from(new Set([...(u.campañas || []), bulkCampId]));
      updates.push(dataSource.usuarios.update({ ...u, campañas: setCampanias }));
    });
    Promise.all(updates).finally(() => {
      loadAll();
      clearSelection();
      flash("Campaña asignada a usuarios seleccionados");
    });
  };

  const bulkUnassign = () => {
    if (!bulkCampId || bulkSelected.size === 0) return;
    const updates = [];
    filteredUsers.forEach((u) => {
      if (!bulkSelected.has(u.id)) return;
      const next = (u.campañas || []).filter((id) => id !== bulkCampId);
      updates.push(dataSource.usuarios.update({ ...u, campañas: next }));
    });
    Promise.all(updates).finally(() => {
      loadAll();
      clearSelection();
      flash("Campaña quitada a usuarios seleccionados");
    });
  };

  return (
    <section className="grid">
      <div className="card">
        <h2 className="mt-0">Administración</h2>
        <p className="small">
          Gestioná <strong>campañas</strong>, <strong>usuarios</strong> y las <strong>asignaciones</strong> (individuales o en lote).
        </p>
        {msg && <p className="small" style={{ color: "#2e7d32" }}>{msg}</p>}
      </div>

      {/* ======= CAMPañas ======= */}
      <div className="card">
        <h3 className="mt-0">Campañas</h3>

        {/* Crear */}
        <div className="grid cols-2">
          <div>
            <label>Nombre</label>
            <input
              value={nuevoCamp.nombre}
              onChange={(e) => setNuevoCamp({ ...nuevoCamp, nombre: e.target.value })}
              placeholder="Ej: 9-2025"
            />
          </div>
          <div>
            <label>Ubicación</label>
            <input
              value={nuevoCamp.ubicacion}
              onChange={(e) => setNuevoCamp({ ...nuevoCamp, ubicacion: e.target.value })}
              placeholder="Bahía Blanca"
            />
          </div>
          <div>
            <label>Fecha inicio</label>
            <input
              type="date"
              value={nuevoCamp.fechaInicio}
              onChange={(e) => setNuevoCamp({ ...nuevoCamp, fechaInicio: e.target.value })}
            />
          </div>
          <div>
            <label>Fecha fin</label>
            <input
              type="date"
              value={nuevoCamp.fechaFin}
              onChange={(e) => setNuevoCamp({ ...nuevoCamp, fechaFin: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", alignItems: "end" }}>
            <button type="button" onClick={crearCampana}>Crear campaña</button>
          </div>
        </div>

        {/* Lista */}
        <div className="table-wrap" style={{ marginTop: ".8rem" }}>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fechas</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th style={{ width: 260 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {campanas.map((c) => (
                <tr key={c.id}>
                  <td>
                    {editCamp?.id === c.id ? (
                      <input value={editCamp.nombre} onChange={(e) => setEditCamp({ ...editCamp, nombre: e.target.value })} />
                    ) : (
                      c.nombre
                    )}
                  </td>
                  <td>
                    {editCamp?.id === c.id ? (
                      <div style={{ display: "grid", gap: ".4rem" }}>
                        <input type="date" value={editCamp.fechaInicio || ""} onChange={(e) => setEditCamp({ ...editCamp, fechaInicio: e.target.value })} />
                        <input type="date" value={editCamp.fechaFin || ""} onChange={(e) => setEditCamp({ ...editCamp, fechaFin: e.target.value })} />
                      </div>
                    ) : (
                      <span>{c.fechaInicio || "—"} → {c.fechaFin || "—"}</span>
                    )}
                  </td>
                  <td>
                    {editCamp?.id === c.id ? (
                      <input value={editCamp.ubicacion || ""} onChange={(e) => setEditCamp({ ...editCamp, ubicacion: e.target.value })} />
                    ) : (
                      c.ubicacion || "—"
                    )}
                  </td>
                  <td>{c.activa ? <span className="badge">Activa</span> : <span className="badge gray">Inactiva</span>}</td>
                  <td style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                    {editCamp?.id === c.id ? (
                      <>
                        <button type="button" className="ghost" onClick={guardarCampanaEdit}>Guardar</button>
                        <button type="button" className="ghost" onClick={() => setEditCamp(null)}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="ghost" onClick={() => setEditCamp(c)}>Editar</button>
                        {!c.activa && <button type="button" className="ghost" onClick={() => activarCampana(c.id)}>Activar</button>}
                        {c.activa && <button type="button" className="ghost" onClick={() => cerrarCampana(c.id)}>Cerrar</button>}
                        <button type="button" className="ghost" onClick={() => eliminarCampana(c.id)}>Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======= USUARIOS ======= */}
      <div className="card">
        <h3 className="mt-0">Usuarios</h3>

        {/* Crear */}
        <div className="grid cols-2">
          <div>
            <label>Nombre</label>
            <input
              value={nuevoUsuario.nombre}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
              placeholder="Nombre y apellido"
            />
          </div>
          <div>
            <label>Email</label>
            <input
              value={nuevoUsuario.email}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
              placeholder="email@ipes.gob"
            />
          </div>
          <div>
            <label>Contraseña</label>
            <input
              type="password"
              value={nuevoUsuario.password}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
            />
          </div>
          <div>
            <label>Rol</label>
            <select
              value={nuevoUsuario.role}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, role: e.target.value })}
            >
              <option value="voluntario">Voluntario</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "end" }}>
            <button type="button" onClick={crearUsuario}>Crear usuario</button>
          </div>
        </div>

        {/* Lista */}
        <div className="table-wrap" style={{ marginTop: ".8rem" }}>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Campañas asignadas</th>
                <th style={{ width: 250 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    {(u.campañas || []).length === 0 ? (
                      <span className="small">—</span>
                    ) : (
                      (u.campañas || []).map((cid) => {
                        const c = campanas.find((x) => x.id === cid);
                        return (
                          <span key={cid} className="badge" style={{ marginRight: ".3rem" }}>
                            {c ? c.nombre : cid}
                          </span>
                        );
                      })
                    )}
                  </td>
                  <td style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                    <button type="button" className="ghost" onClick={() => eliminarUsuario(u.id)}>Eliminar</button>
                    {/* Quitar campañas desde botones rápidos */}
                    {(u.campañas || []).map((cid) => (
                      <button
                        key={`del-${u.id}-${cid}`}
                        type="button"
                        className="ghost"
                        onClick={() => quitarCampana(u.id, cid)}
                        title="Quitar asignación"
                      >
                        Quitar {campanas.find((x) => x.id === cid)?.nombre || cid}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Asignación individual (rápida) */}
        <div className="card" style={{ marginTop: ".8rem" }}>
          <h4 className="mt-0">Asignar campaña a usuario</h4>
          <div className="grid cols-2">
            <div>
              <label>Usuario</label>
              <select
                value={userAssign.userId}
                onChange={(e) => setUserAssign({ ...userAssign, userId: e.target.value })}
              >
                <option value="">Elegir usuario…</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} — {u.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Campaña</label>
              <select
                value={userAssign.campId}
                onChange={(e) => setUserAssign({ ...userAssign, campId: e.target.value })}
              >
                <option value="">Elegir campaña…</option>
                {campanas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.activa ? "(activa)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "end" }}>
              <button type="button" onClick={asignarCampana}>Asignar</button>
            </div>
          </div>
        </div>

        {/* Asignación en lote */}
        <div className="card" style={{ marginTop: ".8rem" }}>
          <h4 className="mt-0">Asignación en lote</h4>
          <div className="grid cols-2">
            <div>
              <label>Campaña a asignar/quitar</label>
              <select value={bulkCampId} onChange={(e) => setBulkCampId(e.target.value)}>
                <option value="">Elegir campaña…</option>
                {campanas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.activa ? "(activa)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Filtrar usuarios</label>
              <input
                placeholder="Nombre, email o rol…"
                value={bulkFilter}
                onChange={(e) => setBulkFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrap" style={{ marginTop: ".6rem", maxHeight: 380, overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 50 }}></th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Asignadas</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const checked = bulkSelected.has(u.id);
                  return (
                    <tr key={u.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(u.id)}
                          aria-label={`Seleccionar ${u.nombre}`}
                        />
                      </td>
                      <td>{u.nombre}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td className="small">
                        {(u.campañas || [])
                          .map((cid) => campanas.find((c) => c.id === cid)?.nombre || cid)
                          .join(", ") || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".6rem" }}>
            <button type="button" className="ghost" onClick={selectVisible}>Seleccionar visibles</button>
            <button type="button" className="ghost" onClick={clearSelection}>Limpiar selección</button>
            <button type="button" onClick={bulkAssign} disabled={!bulkCampId || bulkSelected.size === 0}>Asignar campaña a seleccionados</button>
            <button type="button" className="ghost" onClick={bulkUnassign} disabled={!bulkCampId || bulkSelected.size === 0}>Quitar campaña a seleccionados</button>
          </div>
        </div>
      </div>
    </section>
  );
}
