// utils/adapters/httpAdapter.js
// Stub listo para backend. No rompe el build aunque VITE_DATA_SOURCE=api.
// Implementa las mismas firmas que LocalStorageAdapter.

function unimpl(method){
  throw new Error(`[HttpAdapter] ${method} no implementado. Configurá la API del backend.`)
}

export const HttpAdapter = {
  auth: {
    getSession(){ return null },
    async login(email, password){ unimpl('auth.login') },
    logout(){ /* noop */ },
  },

  usuarios: {
    list(){ unimpl('usuarios.list') },
    create(u){ unimpl('usuarios.create') },
    update(u){ unimpl('usuarios.update') },
    remove(id){ unimpl('usuarios.remove') },
  },

  campanas: {
    list(){ unimpl('campanas.list') },
    getActiva(){ unimpl('campanas.getActiva') },
    create(c){ unimpl('campanas.create') },
    update(c){ unimpl('campanas.update') },
    activate(id){ unimpl('campanas.activate') },
    close(id){ unimpl('campanas.close') },
    remove(id){ unimpl('campanas.remove') },
  },

  precargas: {
    list(params){ unimpl('precargas.list') },
    getByCodigo(codigo){ unimpl('precargas.getByCodigo') },
    create(payload, opts){ unimpl('precargas.create') },
    update(codigo, changes){ unimpl('precargas.update') },
    confirm(codigo, voluntario){ unimpl('precargas.confirm') },
    removeByCodigo(codigo){ unimpl('precargas.removeByCodigo') },
    remove(codigo){ unimpl('precargas.remove') },
  },
}
