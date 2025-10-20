// Limpieza defensiva
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.equation').forEach(el => el.remove());
});

// ----------------------------
// FUNCIÓN PARA INICIAR JUEGO
// ----------------------------
async function iniciarJuego() {
  const j1 = document.getElementById("jugador1").value.trim();
  const j2 = document.getElementById("jugador2").value.trim();
  const j3 = document.getElementById("jugador3").value.trim();
  const j4 = document.getElementById("jugador4").value.trim();
  const grupo = (document.getElementById("grupo")?.value || "").trim();

  if (!j1 && !j2 && !j3 && !j4) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Por favor, ingresa al menos un nombre.",
    });
    return;
  }

  const preguntaId = localStorage.getItem("preguntaActivaId") || null;
  const jugadores = [j1, j2, j3, j4];

  // Crear mesa
  const mesaId = await DB.addMesa({
    grupo,
    jugadores,
    preguntaId: preguntaId ? Number(preguntaId) : null,
    inicio: Date.now(),
    tiempoTotal: null,
    jugadorQueJugo: null
  });

  // Redirigir al juego
  window.location.href = `juego.html?mesaId=${mesaId}`;
}

// ----------------------------
// EVENTOS DE BOTONES
// ----------------------------
document.getElementById("btnIniciar").addEventListener("click", iniciarJuego);

// Este es el que te falta:
document.getElementById("btnDatos").addEventListener("click", () => {
  window.location.href = "datos.html";
});
