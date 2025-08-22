import { useEffect, useState } from 'react'
import { dataSource } from '../utils/dataSource.js'

export default function Campanas(){
  const [list, setList] = useState([])
  const session = dataSource.auth.getSession()
  const isAdmin = session?.role === 'admin'

  const reload = ()=> setList(dataSource.campanas.list())
  useEffect(()=>{ reload() },[])

  const activate = (id)=>{
    dataSource.campanas.activate(id)
    reload()
  }
  const closeCamp = (id)=>{
    dataSource.campanas.close(id)
    reload()
  }
  const removeCamp = (id)=>{
    if(!confirm('¿Eliminar esta campaña? Esta acción no puede deshacerse.')) return
    dataSource.campanas.remove(id)
    reload()
  }

  return (
    <section className="card">
      <h2 className="mt-0">Campañas</h2>
      <p className="small">
        Vista pública en modo lectura. {isAdmin ? 'Como admin, también podés activar/cerrar/eliminar desde aquí.' : ''}
      </p>

      {list.length === 0 ? (
        <p className="small">No hay campañas creadas.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fechas</th>
                <th>Ubicación</th>
                <th>Estado</th>
                {isAdmin && <th style={{minWidth:260}}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {list.map(c=>(
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td>{c.fechaInicio || '—'} → {c.fechaFin || '—'}</td>
                  <td>{c.ubicacion || '—'}</td>
                  <td>{c.activa ? <span className="badge">Activa</span> : <span className="badge gray">Inactiva</span>}</td>

                  {isAdmin && (
                    <td style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
                      {!c.activa && <button className="ghost" onClick={()=>activate(c.id)}>Activar</button>}
                      {c.activa && <button className="ghost" onClick={()=>closeCamp(c.id)}>Cerrar</button>}
                      <button className="ghost" onClick={()=>removeCamp(c.id)}>Eliminar</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
