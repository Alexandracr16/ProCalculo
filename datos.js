// datos.js

const form = document.getElementById("formPregunta");
const tablaPreguntas = document.getElementById("tablaPreguntas");
const tablaMovimientos = document.getElementById("tablaMovimientos");

// ----------------------
// CRUD PREGUNTAS
// ----------------------
async function cargarPreguntas() {
  const preguntas = await DB.getPreguntas();
  tablaPreguntas.innerHTML = "";

  preguntas.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.pregunta}</td>
      <td>${p.respuesta}</td>
      <td>
        <button onclick="editarPregunta(${p.id})">Editar</button>
        <button onclick="eliminarPregunta(${p.id})">Eliminar</button>
        <button onclick="seleccionarPregunta(${p.id})">Usar</button>
      </td>
    `;
    tablaPreguntas.appendChild(tr);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("idPregunta").value;
  const pregunta = document.getElementById("pregunta").value.trim();
  const respuesta = document.getElementById("respuesta").value.trim();

  if (!pregunta || !respuesta) {
    alert("Completa ambos campos");
    return;
  }

  if (id) {
    await DB.updatePregunta({ id: Number(id), pregunta, respuesta });
  } else {
    await DB.addPregunta({ pregunta, respuesta });
  }

  form.reset();
  cargarPreguntas();
});

// Editar pregunta
async function editarPregunta(id) {
  const p = await DB.getPreguntaById(id);
  document.getElementById("idPregunta").value = p.id;
  document.getElementById("pregunta").value = p.pregunta;
  document.getElementById("respuesta").value = p.respuesta;
}

// Eliminar pregunta
async function eliminarPregunta(id) {
  if (confirm("¿Seguro que quieres eliminar esta pregunta?")) {
    await DB.deletePregunta(id);
    cargarPreguntas();
  }
}

// Seleccionar pregunta para el juego
async function seleccionarPregunta(id) {
  try {
    const pregunta = await DB.getPreguntaById(id);
    if (pregunta) {
      localStorage.setItem("preguntaActivaId", id);
      if (confirm(`¿Quieres iniciar el juego con la palabra "${pregunta.respuesta}"?`)) {
        window.location.href = "index.html";
      }
    }
  } catch (error) {
    alert("Error al seleccionar la pregunta");
  }
}

// ----------------------
// MOSTRAR MOVIMIENTOS
// ----------------------
async function cargarMovimientos() {
  const mesas = await DB.getMesas();
  tablaMovimientos.innerHTML = "";

  for (const mesa of mesas) {
    const movimientos = await DB.getMovimientosByMesa(mesa.id);
    movimientos.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${mesa.id}</td>
        <td>${m.jugador}</td>
        <td>${m.letra}</td>
        <td>${m.posicion + 1}</td>
        <td>${m.tiempo}s</td>
        <td>${m.correcta ? "✅" : "❌"}</td>
      `;
      tablaMovimientos.appendChild(tr);
    });
  }
}

// Inicializar todo al cargar

async function mostrarJuegos() {
  const contAciertos = document.getElementById("tablaAciertos");
  const contFallas = document.getElementById("tablaFallas");
  contAciertos.innerHTML = "";
  contFallas.innerHTML = "";

  try {
    // Obtener todos los juegos de la base de datos
    const juegos = await DB.getResultados();

    if (!juegos || juegos.length === 0) {
      contAciertos.innerHTML = "<p>No hay registros de juegos.</p>";
      contFallas.innerHTML = "<p>No hay registros de juegos.</p>";
      return;
    }

    // Función para crear tabla
    const crearTabla = (titulo) => {
      const div = document.createElement("div");
      div.innerHTML = `<h3>${titulo}</h3>`;
      const table = document.createElement("table");
      table.style.margin = "10px auto";
      table.style.width = "95%";
      table.innerHTML = `
        <thead>
          <tr>
            <th>Grupo</th>
            <th>Jugadores</th>
            <th>Tiempo (s)</th>
            <th>Palabra</th>
            <th>Aciertos</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      div.appendChild(table);
      return div;
    };

    // Crear tablas
    const tablaAciertos = crearTabla("Aciertos ✅");
    const tablaFallas = crearTabla("Fallas ❌");

    juegos.forEach(j => {
      const esAcierto = j.aciertos === j.totalLetras;
      const fila = `
        <tr>
          <td>${j.grupo || "-"}</td>
          <td>${j.jugadores || "-"}</td>
          <td>${j.tiempo || "-"}</td>
          <td><span style="color: ${esAcierto ? '#28a745' : '#dc3545'}">${j.palabra || "-"}</span></td>
          <td>${j.aciertos}/${j.totalLetras}</td>
        </tr>
      `;

      if (esAcierto) tablaAciertos.querySelector("tbody").innerHTML += fila;
      else tablaFallas.querySelector("tbody").innerHTML += fila;
    });

    contAciertos.appendChild(tablaAciertos);
    contFallas.appendChild(tablaFallas);

  } catch (err) {
    console.error('Error mostrando juegos:', err);
    contAciertos.innerHTML = "<p>Error al cargar registros.</p>";
    contFallas.innerHTML = "<p>Error al cargar registros.</p>";
  }
}


document.addEventListener("DOMContentLoaded", async () => {
  await mostrarJuegos();
  // ...botón datos y otros...
  const btnDatos = document.getElementById("btnDatos");
  if (btnDatos) {
    btnDatos.addEventListener("click", () => {
      window.location.href = "datos.html";
    });
  }
});

// ---------------------------
// GENERAR PDF CON DATOS
// ---------------------------
document.getElementById("btnPDF").addEventListener("click", () => {
  // Cargar las tablas en memoria
  const tablaAciertos = document.querySelector("#tablaAciertos table");
  const tablaFallas = document.querySelector("#tablaFallas table");
  if (!tablaAciertos && !tablaFallas) {
    alert("No hay registros para exportar.");
    return;
  }

  // Crear el documento PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  // Función auxiliar para convertir tabla HTML en array
  const tableToArray = (table) => {
    if (!table) return { head: [], body: [] };
    const rows = Array.from(table.querySelectorAll("tr"));
    const data = rows.map(row => Array.from(row.querySelectorAll("th, td")).map(cell => cell.innerText));
    return {
      head: [data[0]],
      body: data.slice(1)
    };
  };

  let yPos = 40;

  // Título principal
  doc.setFontSize(18);
  doc.text("Registro de Juegos", 40, yPos);
  yPos += 40;

  // Tabla de Aciertos
  if (tablaAciertos) {
    doc.setFontSize(14);
    doc.text("Aciertos ✓", 40, yPos);
    yPos += 20;
    const dataAciertos = tableToArray(tablaAciertos);
    doc.autoTable({
      startY: yPos,
      head: dataAciertos.head,
      body: dataAciertos.body,
      styles: { fontSize: 9, halign: "center" },
      theme: "grid"
    });
    yPos = doc.lastAutoTable.finalY + 30;
  }

  // Tabla de Fallas
  if (tablaFallas) {
    doc.setFontSize(14);
    doc.text("Fallas ✗", 40, yPos);
    yPos += 20;
    const dataFallas = tableToArray(tablaFallas);
    doc.autoTable({
      startY: yPos,
      head: dataFallas.head,
      body: dataFallas.body,
      styles: { fontSize: 9, halign: "center" },
      theme: "grid"
    });
  }

  // Descargar
  doc.save("registro_juegos.pdf");
});
