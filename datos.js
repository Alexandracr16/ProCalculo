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
function seleccionarPregunta(id) {
  localStorage.setItem("preguntaActivaId", id);
  alert("Pregunta seleccionada para la próxima mesa");
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
function seleccionarPregunta(id) {
  localStorage.setItem("preguntaActivaId", id);
  alert("Pregunta seleccionada para la próxima mesa");
}
// Inicializar todo al cargar

function mostrarJuegos() {
  const contAciertos = document.getElementById("tablaAciertos");
  const contFallas = document.getElementById("tablaFallas");
  contAciertos.innerHTML = "";
  contFallas.innerHTML = "";

  const juegos = JSON.parse(localStorage.getItem("juegos") || "[]");
  if (juegos.length === 0) {
    contAciertos.innerHTML = "<p>No hay registros de juegos.</p>";
    contFallas.innerHTML = "<p>No hay registros de juegos.</p>";
    return;
  }

  // Crear tablas para aciertos y fallas
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
          <th>Jugador</th>
          <th>Tiempo (s)</th>
          <th>Palabra</th>
          <th>Posición</th>
          <th>Letra</th>
          <th>Correcta</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    div.appendChild(table);
    return { div, tbody: table.querySelector("tbody") };
  };

  const aciertos = crearTabla("✅ ACIERTOS");
  const fallas = crearTabla("❌ FALLAS");

  const jugadoresRegistrados = localStorage.getItem("jugadores") || "-";

  juegos.forEach(j => {
    if (j.posiciones && Array.isArray(j.posiciones)) {
      j.posiciones.forEach(pos => {
        const fila = `
          <tr>
            <td>${j.grupo || "-"}</td>
            <td>${jugadoresRegistrados}</td>
            <td>${j.jugador}</td>
            <td>${j.tiempo}</td>
            <td>${j.palabra}</td>
            <td>${pos.posicion}</td>
            <td style="font-weight:bold; color:${pos.correcta ? '#3cff7a' : '#ff3c3c'}">${pos.letra || '_'}</td>
            <td>${pos.correcta ? '✅' : '❌'}</td>
          </tr>
        `;
        if (pos.correcta) aciertos.tbody.innerHTML += fila;
        else fallas.tbody.innerHTML += fila;
      });
    }
  });

  contAciertos.appendChild(aciertos.div);
  contFallas.appendChild(fallas.div);
}


document.addEventListener("DOMContentLoaded", () => {
  mostrarJuegos();
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
  const aciertos = document.querySelector("#tablaAciertos table");
  const fallas = document.querySelector("#tablaFallas table");

  if (!aciertos && !fallas) {
    alert("No hay tablas para exportar.");
    return;
  }

  // Crear el documento PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  doc.setFontSize(18);
  doc.text("Registro de Juegos", 40, 40);

  let y = 70;

  // Función auxiliar para convertir tabla HTML en array
  const tableToArray = (table) => {
    const rows = Array.from(table.querySelectorAll("tr"));
    return rows.map(row => Array.from(row.querySelectorAll("th, td")).map(cell => cell.innerText));
  };

  // ACIERTOS
  if (aciertos) {
    doc.setFontSize(14);
    doc.text("✅ ACIERTOS", 40, y);
    y += 10;
    doc.autoTable({
      startY: y + 10,
      head: [tableToArray(aciertos.querySelector("thead"))[0]],
      body: tableToArray(aciertos.querySelector("tbody")),
      styles: { fontSize: 9, halign: "center" },
      theme: "grid"
    });
    y = doc.lastAutoTable.finalY + 30;
  }

  // FALLAS
  if (fallas) {
    doc.setFontSize(14);
    doc.text("❌ FALLAS", 40, y);
    y += 10;
    doc.autoTable({
      startY: y + 10,
      head: [tableToArray(fallas.querySelector("thead"))[0]],
      body: tableToArray(fallas.querySelector("tbody")),
      styles: { fontSize: 9, halign: "center" },
      theme: "grid"
    });
  }

  // Descargar
  doc.save("registro_juegos.pdf");
});

