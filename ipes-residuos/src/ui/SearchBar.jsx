import { useEffect, useMemo, useState } from 'react'

export default function SearchBar({ placeholder='Buscar...', onChange=()=>{}, delay=300 }){
  const [value, setValue] = useState('')
  const debounced = useMemo(()=>{
    let t
    return (v)=>{ clearTimeout(t); t=setTimeout(()=>onChange(v), delay) }
  },[onChange, delay])

  useEffect(()=>{ debounced(value) },[value])
  return (
    <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
      <span aria-hidden="true">🔍</span>
      <input placeholder={placeholder} value={value} onChange={e=>setValue(e.target.value)} />
    </div>
  )
}
