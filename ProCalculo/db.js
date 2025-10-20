// db.js
// Agrega <script src="db.js"></script> en tus páginas antes de usar DB.*

(function () {
  const DB_NAME = "JuegoCienciasDB";
  const DB_VERSION = 1;
  let dbInstance = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (dbInstance) return resolve(dbInstance);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        // store preguntas: { id(auto), pregunta, respuesta }
        if (!db.objectStoreNames.contains("preguntas")) {
          db.createObjectStore("preguntas", { keyPath: "id", autoIncrement: true });
        }
        // store mesas: { id(auto), jugadores:[], preguntaId, inicio, tiempoTotal }
        if (!db.objectStoreNames.contains("mesas")) {
          db.createObjectStore("mesas", { keyPath: "id", autoIncrement: true });
        }
        // store movimientos: { id(auto), mesaId, jugador, letra, posicion, tiempo }
        if (!db.objectStoreNames.contains("movimientos")) {
          const os = db.createObjectStore("movimientos", { keyPath: "id", autoIncrement: true });
          os.createIndex("mesaId", "mesaId", { unique: false });
        }
      };
      req.onsuccess = (e) => {
        dbInstance = e.target.result;
        resolve(dbInstance);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // Helpers
  async function tx(storeName, mode = "readonly") {
    const db = await openDB();
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  // Preguntas CRUD
  async function addPregunta(preguntaObj) {
    // preguntaObj: { pregunta: '...', respuesta: '...' }
    const store = await tx("preguntas", "readwrite");
    return new Promise((res, rej) => {
      const r = store.add(preguntaObj);
      r.onsuccess = (e) => res(e.target.result);
      r.onerror = (e) => rej(e.target.error);
    });
  }
  async function getPreguntas() {
    const store = await tx("preguntas", "readonly");
    return new Promise((res, rej) => {
      const r = store.getAll();
      r.onsuccess = (e) => res(e.target.result);
      r.onerror = (e) => rej(e.target.error);
    });
  }
  async function getPreguntaById(id) {
    const store = await tx("preguntas", "readonly");
    return new Promise((res, rej) => {
      const r = store.get(Number(id));
      r.onsuccess = (e) => res(e.target.result);
      r.onerror = (e) => rej(e.target.error);
    });
  }
  async function updatePregunta(obj) {
    const store = await tx("preguntas", "readwrite");
    return new Promise((res, rej) => {
      const r = store.put(obj);
      r.onsuccess = (e) => res(e.target.result);
      r.onerror = (e) => rej(e.target.error);
    });
  }
  async function deletePregunta(id) {
    const store = await tx("preguntas", "readwrite");
    return new Promise((res, rej) => {
      const r = store.delete(Number(id));
      r.onsuccess = () => res(true);
      r.onerror = (e) => rej(e.target.error);
    });
  }

  // Mesas
  async function addMesa(mesaObj) {
    // mesaObj: { jugadores: ['a','b',...], preguntaId, inicio: Date.now(), tiempoTotal: null }
    const store = await tx("mesas", "readwrite");
    return new Promise((res, rej) => {
      const r = store.add(mesaObj);
      r.onsuccess = (e) => res(e.target.result);
      r.onerror = (e) => rej(e.target.error);
    });
  }
  async function getMesaById(id) {
    const store = await tx("mesas", "readonly");
    return new Promise((res, rej) => {
      const r = store.get(Number(id));
      r.onsuccess = (e) => res(e.target.result);
      r.onerror = (e) => rej(e.target.error);
    });
  }
  async function updateMesa(obj) {
    const store = await tx("mesas", "readwrite");
    return new Promise((res, rej) => {
      const r = store.put(obj);
      r.onsuccess = (e) => res(e.target.result);
      r.onerror = (e) => rej(e.target.error);
    });
  }
  async function getMesas() {
    const store = await tx("mesas", "readonly");
    return new Promise((res, rej) => {
      const r = store.getAll();
      r.onsuccess = (e) => res(e.target.result);
      r.onerror = (e) => rej(e.target.error);
    });
  }

  // Movimientos
  async function addMovimiento(mov) {
    // mov: { mesaId, jugador, letra, posicion, tiempo }
    const store = await tx("movimientos", "readwrite");
    return new Promise((res, rej) => {
      const r = store.add(mov);
      r.onsuccess = (e) => res(e.target.result);
      r.onerror = (e) => rej(e.target.error);
    });
  }
  async function getMovimientosByMesa(mesaId) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const txn = db.transaction("movimientos", "readonly");
      const store = txn.objectStore("movimientos");
      const idx = store.index("mesaId");
      const r = idx.getAll(Number(mesaId));
      r.onsuccess = (e) => res(e.target.result);
      r.onerror = (e) => rej(e.target.error);
    });
  }

  // Exponer API globalmente
  window.DB = {
    openDB,
    // preguntas
    addPregunta,
    getPreguntas,
    getPreguntaById,
    updatePregunta,
    deletePregunta,
    // mesas
    addMesa,
    getMesaById,
    updateMesa,
    getMesas,
    // movimientos
    addMovimiento,
    getMovimientosByMesa
  };
})();