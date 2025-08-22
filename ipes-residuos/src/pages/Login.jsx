import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { dataSource } from '../utils/dataSource.js'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const nav = useNavigate()
  const from = useLocation().state?.from?.pathname || '/'

  const onSubmit = (e)=>{
    e.preventDefault()
    setErr('')
    try{
      const u = dataSource.auth.login(email.trim(), password)
      nav(from, { replace:true })
    }catch(e){
      setErr(e.message || 'Error de autenticación')
    }
  }

  return (
    <div className="container" style={{maxWidth:420, marginTop:'2rem'}}>
      <div className="card">
        <h2>Login</h2>
        <form onSubmit={onSubmit} className="grid">
          <div>
            <label>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@ipes.gob" autoFocus />
          </div>
          <div>
            <label>Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {err && <p className="small" style={{color:'#c62828'}}>{err}</p>}
          <button>Ingresar</button>
          <p className="small">Demo: <code>admin@ipes.gob</code> / <code>admin</code></p>
        </form>
      </div>
    </div>
  )
}
