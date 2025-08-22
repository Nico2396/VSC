export default function NumberInput({ value=0, onChange=()=>{}, min=0, step=1 }){
  const dec = ()=> onChange(Math.max(min, Number(value)-step))
  const inc = ()=> onChange(Number(value)+step)
  return (
    <div style={{display:'inline-flex',gap:'.4rem',alignItems:'center'}}>
      <button type="button" className="ghost" onClick={dec}>−</button>
      <input type="number" value={value} min={min} step={step} onChange={e=>onChange(Number(e.target.value))} style={{width:'6rem',textAlign:'center'}}/>
      <button type="button" className="ghost" onClick={inc}>+</button>
    </div>
  )
}
