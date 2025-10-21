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
  // Obtener el ID de la pregunta seleccionada
  const id = localStorage.getItem("preguntaActivaId");
  
  if (id) {
    try {
      const pregunta = await DB.getPreguntaById(Number(id));
      if (pregunta) {
        // Keep the original response so special characters and digits are preserved
        respuestaCorrecta = pregunta.respuesta.trim();
        preguntaTexto = pregunta.pregunta;
      } else {
        // Si no se encuentra la pregunta, usar valores predeterminados
        respuestaCorrecta = "CIENCIAS";
        preguntaTexto = "Palabra del juego";
      }
    } catch (error) {
      // En caso de error, usar valores predeterminados
      respuestaCorrecta = "CIENCIAS";
      preguntaTexto = "Palabra del juego";
    }
  } else {
    // Si no hay ID seleccionado, usar valores predeterminados
    respuestaCorrecta = "CIENCIAS";
    preguntaTexto = "Palabra del juego";
  }

  // Sincronizar longitud de letras
  letrasIngresadas = Array(16).fill("_");

  document.querySelector(".titulo-pregunta").textContent = preguntaTexto;

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
document.addEventListener("DOMContentLoaded", async () => {
  await cargarPreguntaActiva();
  actualizarInterfazJuego();
  
  // Mostrar el grupo en el panel de información
  const jugadoresLista = nombres.filter(n => n).join(", ");
  turnoTxt.textContent = `Grupo: ${grupo}`;
  
  // Iniciar el tiempo automáticamente
  iniciarTiempo();
});

// Función para actualizar la interfaz del juego
function actualizarInterfazJuego() {
  // Siempre mostrar 16 espacios
  letrasIngresadas = Array(16).fill("_");

  document.querySelector(".titulo-pregunta").textContent = preguntaTexto;

  letras.forEach((el, i) => {
    if (i < 16) {
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

// Los botones ahora son solo para mostrar los jugadores
botones.forEach(btn => {
  // Removemos el evento click
  btn.style.cursor = 'default'; // Quitar el cursor pointer
});

// ----------------------
// Juego: clic en letra
// ----------------------

let letraActual = 0;

// Permitir seleccionar posición haciendo clic
letras.forEach((el, i) => {
  el.addEventListener("click", () => {
    if (!juegoFinalizado) {
      letraActual = i;
      letras.forEach(l => l.classList.remove("letra-seleccionada"));
      el.classList.add("letra-seleccionada");
    }
  });
});

// Escuchar teclas
document.addEventListener("keydown", (e) => {
  // Si el juego ya terminó, no permitir más entrada de letras
  if (juegoFinalizado) {
    e.preventDefault();
    return;
  }

  const key = e.key;

  // Si es un caracter imprimible (letra, número o especial) aceptarlo
  if (key.length === 1 && !e.ctrlKey && !e.metaKey) {
    if (!intervalo) iniciarTiempo();
    letrasIngresadas[letraActual] = key;
    letras[letraActual].textContent = key;

    // Avanza automáticamente
    letraActual = (letraActual + 1) % 16;
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
    letraActual = (letraActual + 1) % 16;
  }
  if (e.key === "ArrowLeft") {
    letraActual = (letraActual - 1 + 16) % 16;
  }
});

function verificarEstadoPalabra() {
  if (!respuestaCorrecta) return;

  let espaciosLlenos = true;
  let cantidadAciertos = 0;
  // Regex para detectar letras (incluye acentos y ñ)
  const letterRegex = /[A-Za-zÀ-ÖØ-öø-ÿÑñÁÉÍÓÚáéíóúÜü]/;

  letras.forEach((letraEl, i) => {
    const letraIngresada = letrasIngresadas[i] || "_";
    if (letraIngresada === "_") {
      espaciosLlenos = false;
    }
    if (i < respuestaCorrecta.length) {
      const esperado = respuestaCorrecta[i];
      if (letraIngresada === "_") {
        letraEl.classList.remove("ok", "error");
      } else {
        // Comparación: letras insensible a mayúsculas, otros caracteres exactos
        if (letterRegex.test(esperado)) {
          if (letraIngresada.toUpperCase() === esperado.toUpperCase()) {
            letraEl.classList.add("ok");
            letraEl.classList.remove("error");
            cantidadAciertos++;
          } else {
            letraEl.classList.add("error");
            letraEl.classList.remove("ok");
          }
        } else {
          if (letraIngresada === esperado) {
            letraEl.classList.add("ok");
            letraEl.classList.remove("error");
            cantidadAciertos++;
          } else {
            letraEl.classList.add("error");
            letraEl.classList.remove("ok");
          }
        }
      }
    } else {
      // Para espacios después de la respuesta correcta
      letraEl.classList.remove("ok", "error");
    }
  });

  // Si todos los espacios están llenos, detener el tiempo y mostrar resultados
  if (espaciosLlenos && !juegoFinalizado) {
    // Stop the timer and mark finished, then delegate display & save to mostrarResultadoFinal
    detenerTiempo();
    juegoFinalizado = true;
    mostrarResultadoFinal();
  }

  // Verificar si todas las letras de la respuesta correcta están bien
  const todasCorrectas = respuestaCorrecta.split('').every((esperado, i) => {
    const ingresada = letrasIngresadas[i] || "";
    if (letterRegex.test(esperado)) {
      return ingresada.toUpperCase() === esperado.toUpperCase();
    }
    return ingresada === esperado;
  });

  if (todasCorrectas && !juegoFinalizado) {
    detenerTiempo();
    juegoFinalizado = true;
    mostrarResultadoFinal();
  }
}


// ----------------------
// Mostrar resultado final
// ----------------------
async function mostrarResultadoFinal() {
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
  // Preparar datos para mostrar y guardar
  const jugadoresLista = nombres.filter(n => n).join(", ");
  const fecha = new Date().toISOString();

  // No mostrar el registro detallado en la UI principal (se guarda en DB/localStorage)
  listaRegistros.innerHTML = "";

  // Mostrar caja compacta debajo del timer: sólo aciertos, tiempo y si lo logró
  const contResultados = document.querySelector('.resultados-inmediatos');
  if (contResultados) {
    const logro = aciertos === respuestaCorrecta.length;
    contResultados.innerHTML = `
      <div class="resultado-compacto" style="background: rgba(0,0,0,0.35); padding: 12px; border-radius:8px; text-align:center; color:#fff;">
        <div style="font-weight:700; margin-bottom:6px;">Aciertos: <span style="color:#3cff7a">${aciertos}</span> de ${respuestaCorrecta.length}</div>
        <div style="margin-bottom:8px;">Tiempo final: <span style="color:#4f9cff; font-weight:700">${tiempo}</span> segundos</div>
        <div style="font-size:1.1em; font-weight:800; color:${logro ? '#3cff7a' : '#ff3c3c'};">
          ${logro ? '¡Lo lograste! 🎉' : 'No lo lograste, ¡vuelve a intentarlo! 💪'}
        </div>
      </div>
    `;
  }

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
    jugadores: jugadoresLista,
    tiempo,
    palabra: respuestaCorrecta,
    aciertos: aciertos,
    totalLetras: respuestaCorrecta.length,
    fecha
  };

  // Guardar en IndexedDB (no bloquear la UI)
  try {
    await DB.addResultado(resultado);
  } catch (error) {
    console.error("Error al guardar en la base de datos:", error);
  }

  // Guardar en localStorage para mantener la tabla de registros (detalle)
  const resultadoLocal = {
    grupo,
    jugadores: jugadoresLista,
    tiempo,
    palabra: respuestaCorrecta,
    ingresadas: letrasIngresadas.join(""),
    posiciones,
    fecha,
  };

  const juegos = JSON.parse(localStorage.getItem("juegos") || "[]");
  juegos.push(resultadoLocal);
  localStorage.setItem("juegos", JSON.stringify(juegos));
}

// ----------------------
// Reiniciar juego
// ----------------------
nuevaMesa.addEventListener("click", () => {
  detenerTiempo();
  window.location.href = "index.html";
});
