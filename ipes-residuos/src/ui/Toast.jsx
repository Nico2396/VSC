// Placeholder de Toast para usar luego. Por ahora, sin implementación.
export function ToastProvider({ children }){ return children }
export function useToast(){ return { push: (msg)=>console.log('[toast]', msg) } }
