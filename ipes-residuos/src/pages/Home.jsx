import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { dataSource } from '../utils/dataSource.js'
import categories from '../data/categories.js'

export default function Home(){
  const [active, setActive] = useState(null)
  const session = dataSource.auth.getSession()

  useEffect(()=>{ setActive(dataSource.campanas.getActiva()) },[])

  const role = session?.role
  const userName = session?.nombre || session?.email || ''

  const categoryEmojis = [
    '📺','💻','📱','🛠️','🎮','💡','🏠','💊','🧴','🚗','🔋'
  ]

  const nextActions = useMemo(()=>{
    if(!role) return [
      { to:'/precarga', label:'Hacer mi precarga', variant:'primary' },
      { to:'/campanas', label:'Ver campañas', variant:'ghost' },
      { to:'/login', label:'Iniciar sesión', variant:'ghost' },
    ]
    if(role==='voluntario') return [
      { to:'/confirmar', label:'Confirmar por código', variant:'primary' },
      { to:'/recolectados', label:'Ver recolectados', variant:'ghost' },
      { to:'/campanas', label:'Campañas', variant:'ghost' },
    ]
    // admin
    return [
      { to:'/admin', label:'Panel de administración', variant:'primary' },
      { to:'/recolectados', label:'Recolectados', variant:'ghost' },
      { to:'/campanas', label:'Campañas', variant:'ghost' },
    ]
  },[role])

  return (
    <section className="grid">
      {/* HERO */}
      <div className="card" style={{
        background:'linear-gradient(140deg, #eaf6ee 0%, #e6f6ff 100%)',
        border:'1px solid #d9f0df'
      }}>
        <div className="grid cols-2">
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'.6rem',marginBottom:'.4rem'}}>
              <span className="badge info">IPES — Bahía Blanca</span>
              {active
                ? <span className="badge">Campaña activa</span>
                : <span className="badge gray">Sin campaña activa</span>}
            </div>
            <h1 className="mt-0" style={{fontSize:'2rem',lineHeight:1.2,marginBottom:'.5rem'}}>
              Gestión de campañas de <span style={{color:'#2e7d32'}}>residuos peligrosos</span>
            </h1>
            <p className="small" style={{fontSize:'1rem',opacity:.95}}>
              Reemplazamos las planillas en papel y Excel con una app simple, rápida y accesible para
              cargar, confirmar y consultar recolecciones. Sumate a cuidar el ambiente de Bahía Blanca.
            </p>

            <div style={{display:'flex',gap:'.6rem',flexWrap:'wrap',marginTop:'.8rem'}}>
              {nextActions.map((a)=>(
                <Link key={a.to} to={a.to}>
                  <button className={a.variant==='ghost'?'ghost':''}>
                    {a.label}
                  </button>
                </Link>
              ))}
            </div>

            {!!role && (
              <p className="small" style={{marginTop:'.6rem'}}>
                Sesión: <strong>{userName}</strong> — rol <strong>{role}</strong>
              </p>
            )}
          </div>

          {/* Tarjeta de campaña activa */}
          <div>
            <div className="card" style={{margin:0}}>
              <h3 className="mt-0">Próxima recolección</h3>
              {active ? (
                <>
                  <p className="small">
                    <strong>{active.nombre}</strong>
                    {active.activa ? ' — en curso' : ''}
                  </p>
                  <div className="grid">
                    <div>
                      <label>Fecha</label>
                      <div>
                        {active.fechaInicio || '—'}{active.fechaFin ? ` → ${active.fechaFin}` : ''}
                      </div>
                    </div>
                    <div>
                      <label>Ubicación</label>
                      <div>{active.ubicacion || 'A confirmar'}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'.6rem',marginTop:'.8rem',flexWrap:'wrap'}}>
                    <Link to="/precarga"><button className="ghost">Hacer mi precarga</button></Link>
                    <Link to="/campanas"><button className="ghost">Ver detalles</button></Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="small">No hay una campaña activa en este momento.</p>
                  <Link to="/campanas"><button className="ghost">Ver todas las campañas</button></Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ¿CÓMO FUNCIONA? */}
      <div className="card">
        <h3 className="mt-0">¿Cómo funciona?</h3>
        <div className="grid cols-2">
          <div className="card" style={{margin:0}}>
            <h4 className="mt-0">1) Precargá</h4>
            <p className="small">Completá tu <strong>nombre</strong>, <strong>barrio</strong> y los <strong>ítems</strong> a entregar. Te damos un <strong>código único</strong> que podés copiar.</p>
            <Link to="/precarga"><button className="ghost">Ir a Precarga</button></Link>
          </div>
          <div className="card" style={{margin:0}}>
            <h4 className="mt-0">2) Entregá</h4>
            <p className="small">Acercate el día de la campaña activa. Mostrá tu <strong>código</strong> y un voluntario validará las cantidades.</p>
            <Link to="/campanas"><button className="ghost">Ver campaña activa</button></Link>
          </div>
        </div>
        <div className="card" style={{marginTop:'.8rem'}}>
          <h4 className="mt-0">3) Confirmación</h4>
          <p className="small">El equipo confirma tu precarga y queda registrada. Si sos voluntario o admin, también podés confirmar desde la app.</p>
          {role ? (
            <Link to="/confirmar"><button className="ghost">Confirmar por código</button></Link>
          ) : (
            <Link to="/login"><button className="ghost">Ingresar como voluntario</button></Link>
          )}
        </div>
      </div>

      {/* CATEGORÍAS ACEPTADAS */}
      <div className="card">
        <h3 className="mt-0">¿Qué residuos recibimos?</h3>
        <p className="small">Estas son las <strong>11 categorías</strong> aceptadas. En Precarga vas a poder elegir el <strong>tipo</strong> específico (ej.: batería, lámpara LED, monitor, etc.).</p>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
          {categories.map((c, idx)=>(
            <div key={c.categoria} className="card" style={{margin:0}}>
              <div style={{display:'flex',alignItems:'center',gap:'.6rem'}}>
                <div style={{fontSize:'1.4rem'}} aria-hidden="true">{categoryEmojis[idx] || '♻️'}</div>
                <strong>{c.categoria}</strong>
              </div>
              <p className="small" style={{marginTop:'.4rem', opacity:.9}}>
                Ejemplos: {c.tipos.slice(0,4).join(', ')}{c.tipos.length>4?'…':''}
              </p>
            </div>
          ))}
        </div>
        <div className="info-card" style={{marginTop:'.8rem'}}>
          <strong>Importante:</strong> protegé las piezas frágiles (lámparas, tubos) y traé los objetos limpios y desconectados.
        </div>
      </div>

      {/* ACCESOS RÁPIDOS POR ROL */}
      {role && (
        <div className="card">
          <h3 className="mt-0">Accesos rápidos</h3>
          <div style={{display:'flex',gap:'.6rem',flexWrap:'wrap'}}>
            {role==='admin' && (
              <>
                <Link to="/admin"><button>Administración</button></Link>
                <Link to="/recolectados"><button className="ghost">Recolectados</button></Link>
                <Link to="/campanas"><button className="ghost">Campañas</button></Link>
              </>
            )}
            {role==='voluntario' && (
              <>
                <Link to="/confirmar"><button>Confirmar</button></Link>
                <Link to="/recolectados"><button className="ghost">Recolectados</button></Link>
                <Link to="/campanas"><button className="ghost">Campañas</button></Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* PIE CON VALOR */}
      <div className="card" style={{background:'#f8fafc'}}>
        <h3 className="mt-0">Compromiso IPES</h3>
        <p className="small">
          Nuestro objetivo es facilitar la <strong>recolección responsable</strong> de residuos peligrosos en Bahía Blanca
          con una herramienta <strong>simple, rápida y accesible</strong>. Toda la información se administra con criterios
          de seguridad y respeto por los datos de los vecinos.
        </p>
      </div>
    </section>
  )
}
