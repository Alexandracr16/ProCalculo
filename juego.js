// ----------------------
// Referencias del DOM
// ----------------------
const turnoTxt = document.getElementById("turno");
const tiempoTxt = document.getElementById("tiempo");
const letras = document.querySelectorAll(".letra");
const nuevaMesa = document.getElementById("nuevaMesa");
const botones = [
  document.getElementById("j1"),
  document.getElementById("j2"),
  document.getElementById("j3"),
  document.getElementById("j4")
];
const finalizarJuego = document.getElementById("finalizarJuego");

// ----------------------
// Variables de estado
// ----------------------
let jugadorActivo = null;
let tiempo = 0;
let intervalo = null;
let letrasCompletadas = 0;
let letrasIngresadas = Array.from(letras).fill("_");
let juegoFinalizado = false;

// Palabra correcta a adivinar
// ----------------------
// Palabra correcta desde IndexedDB
// ----------------------
let respuestaCorrecta = "";
let preguntaTexto = "";

async function cargarPreguntaActiva() {
  const id = localStorage.getItem("preguntaActivaId");
  if (!id) {
    alert("⚠️ No se ha seleccionado una pregunta en los datos. Ve a datos.html y elige una.");
    window.location.href = "datos.html";
    return;
  }

  const pregunta = await DB.getPreguntaById(Number(id));
  if (!pregunta) {
    alert("❌ No se encontró la pregunta en la base de datos.");
    window.location.href = "datos.html";
    return;
  }

  preguntaTexto = pregunta.pregunta;
  respuestaCorrecta = pregunta.respuesta.toUpperCase().trim();

  // Sincronizar longitud de letras
  letrasIngresadas = Array(respuestaCorrecta.length).fill("_");

  document.querySelector(".titulo").textContent = `Adivina: ${preguntaTexto}`;

  letras.forEach((el, i) => {
    if (i < respuestaCorrecta.length) {
      el.textContent = "_";
      el.style.display = "inline-block";
    } else {
      el.style.display = "none";
    }
  });

  // Marcar la primera posición seleccionada
  letraActual = 0;
  letras[0].classList.add("letra-seleccionada");


  
}


// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", cargarPreguntaActiva);


// ----------------------
// Obtener datos del grupo y jugadores desde URL
// ----------------------
const params = new URLSearchParams(window.location.search);
const grupo = params.get("grupo") || "—";
document.getElementById("nombreGrupo").textContent = grupo;
const nombres = [
  params.get("j1") || "",
  params.get("j2") || "",
  params.get("j3") || "",
  params.get("j4") || ""
];

// ----------------------
// Mostrar nombres en pantalla
// ----------------------
nombres.forEach((nombre, i) => {
  if (nombre) {
    botones[i].textContent = nombre;
  } else {
    botones[i].style.display = "none";
  }
});

// ----------------------
// Mostrar guiones según la longitud de la palabra
// ----------------------
letras.forEach((el, i) => {
  if (i < respuestaCorrecta.length) {
    el.textContent = "_";
    el.style.display = "inline-block";
  } else {
    el.style.display = "none";
  }
});

// ----------------------
// Tiempo
// ----------------------
function iniciarTiempo() {
  if (!intervalo) {
    intervalo = setInterval(() => {
      tiempo++;
      tiempoTxt.textContent = tiempo;
    }, 1000);
  }
}

function detenerTiempo() {
  if (intervalo) {
    clearInterval(intervalo);
    intervalo = null;
  }
}

// ----------------------
// Selección de jugador (sin iniciar tiempo todavía)
// ----------------------
botones.forEach(btn => {
  btn.addEventListener("click", () => {
    jugadorActivo = btn.textContent;
    turnoTxt.textContent = `Turno de: ${jugadorActivo}`;

    // Visual: resaltar jugador activo
    botones.forEach(b => b.classList.remove("jugador-activo"));
    btn.classList.add("jugador-activo");
  });
});

// ----------------------
// Juego: clic en letra
// ----------------------

let letraActual = 0;

// Permitir seleccionar posición haciendo clic
letras.forEach((el, i) => {
  el.addEventListener("click", () => {
    letraActual = i;
    letras.forEach(l => l.classList.remove("letra-seleccionada"));
    el.classList.add("letra-seleccionada");
  });
});

// Escuchar teclas
document.addEventListener("keydown", (e) => {
  if (!jugadorActivo) {
    alert("Selecciona un jugador antes de escribir.");
    return;
  }

  const key = e.key.toUpperCase();

  // Si es una letra válida
  if (key.length === 1 && key.match(/[A-ZÑÁÉÍÓÚÜ]/)) {
    if (!intervalo) iniciarTiempo();
    letrasIngresadas[letraActual] = key;
    letras[letraActual].textContent = key;

    // Avanza automáticamente
    letraActual = (letraActual + 1) % respuestaCorrecta.length;
    verificarEstadoPalabra();
  }

  // Permitir borrar con Backspace
  if (e.key === "Backspace") {
    letrasIngresadas[letraActual] = "_";
    letras[letraActual].textContent = "_";
    verificarEstadoPalabra();
  }

  // Mover con flechas
  if (e.key === "ArrowRight") {
    letraActual = (letraActual + 1) % respuestaCorrecta.length;
  }
  if (e.key === "ArrowLeft") {
    letraActual = (letraActual - 1 + respuestaCorrecta.length) % respuestaCorrecta.length;
  }
});

function verificarEstadoPalabra() {
  if (!respuestaCorrecta) return;

  letras.forEach((letraEl, i) => {
    const letraIngresada = letrasIngresadas[i] || "_";
    if (letraIngresada === "_") {
      letraEl.classList.remove("ok", "error");
    } else if (letraIngresada === respuestaCorrecta[i]) {
      letraEl.classList.add("ok");
      letraEl.classList.remove("error");
    } else {
      letraEl.classList.add("error");
      letraEl.classList.remove("ok");
    }
  });

  // Verificar si todas las letras son correctas
  const todasCorrectas = letrasIngresadas.every(
    (letra, i) => letra === respuestaCorrecta[i]
  );

  if (todasCorrectas && !juegoFinalizado) {
    detenerTiempo();
    juegoFinalizado = true;
    mostrarResultadoFinal();
  }
}


// ----------------------
// Mostrar resultado final
// ----------------------
function mostrarResultadoFinal() {
  letras.forEach((letraEl, index) => {
    const correcta = respuestaCorrecta[index] === letrasIngresadas[index];
    if (correcta) {
      letraEl.classList.add("ok"); // verde
    } else {
      letraEl.classList.add("error"); // rojo
    }
  });

  const aciertos = letrasIngresadas.filter(
    (l, i) => l === respuestaCorrecta[i]
  ).length;

  // Mostrar resultado debajo del tiempo
  const listaRegistros = document.getElementById("lista-registros");
  let letrasHTML = "";
  for (let i = 0; i < respuestaCorrecta.length; i++) {
    const letra = letrasIngresadas[i] || "_";
    if (letra === respuestaCorrecta[i]) {
      letrasHTML += `<span style='color: #3cff7a; font-weight:bold;'>${letra}</span>`;
    } else {
      letrasHTML += `<span style='color: #ff3c3c; font-weight:bold;'>${letra}</span>`;
    }
  }
  listaRegistros.innerHTML = `
    <div class="registro-item">
      <strong>Juego terminado</strong><br>
      <span class="registro-meta">Jugador: ${jugadorActivo}</span><br>
      <span class="registro-meta">Grupo: ${grupo}</span><br>
      <span class="registro-meta">Aciertos: ${aciertos}/${respuestaCorrecta.length}</span><br>
      <span class="registro-meta">Tiempo: ${tiempo} segundos</span><br>
      <span class="registro-meta">Palabra: ${respuestaCorrecta}</span><br>
      <span class="registro-meta">Letras: ${letrasHTML}</span>
    </div>
  `;

  // Guardar en localStorage
  const posiciones = [];
  for (let i = 0; i < respuestaCorrecta.length; i++) {
    posiciones.push({
      letra: letrasIngresadas[i],
      correcta: letrasIngresadas[i] === respuestaCorrecta[i],
      posicion: i + 1
    });
  }
  const resultado = {
    grupo,
    jugador: jugadorActivo,
    tiempo,
    palabra: respuestaCorrecta,
    ingresadas: letrasIngresadas.join(""),
    posiciones,
    fecha: new Date().toISOString(),
  };

  const juegos = JSON.parse(localStorage.getItem("juegos") || "[]");
  juegos.push(resultado);
  localStorage.setItem("juegos", JSON.stringify(juegos));
}

// ----------------------
// Reiniciar juego
// ----------------------
nuevaMesa.addEventListener("click", () => {
  detenerTiempo();
  window.location.href = "index.html";
});
