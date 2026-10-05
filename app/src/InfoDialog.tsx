import { useEffect, useRef } from 'react'
import { glossary } from './glossary'

export type Inspect = { kind: string; name?: string; tip?: string; onRemove?: () => void }

export function InfoDialog({ info, onClose }: { info: Inspect | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current!
    if (info && !d.open) d.showModal()
    if (!info && d.open) d.close()
  }, [info])
  const g = info && (info.tip ? { name: info.name ?? info.kind, what: info.tip, use: '', watch: '' } : glossary[info.kind])

  return (
    <dialog ref={ref} className="info" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      {g && info && (
        <>
          <h2>{g.name}</h2>
          <h3>What it is</h3>
          <p>{g.what}</p>
          {g.use && <><h3>What it’s for</h3><p>{g.use}</p></>}
          {g.watch && <><h3>Watch out for</h3><p>{g.watch}</p></>}
          <div className="actions">
            {info.onRemove && <button className="danger" onClick={() => { info.onRemove!(); onClose() }}>Remove from canvas</button>}
            <button autoFocus onClick={onClose}>Close</button>
          </div>
        </>
      )}
    </dialog>
  )
}
