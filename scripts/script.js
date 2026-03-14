let schedule = [];
let weeks = [];

fetch("data/schedule.json")
  .then(response => {
    if (!response.ok) {
      throw new Error(`No se pudo cargar schedule.json: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    schedule = data;

    schedule.sort((a, b) => new Date(a.date) - new Date(b.date));

    setDefaultWeek();
    updateFilters();
    renderWeek();
    showMainMenu();
  })
  .catch(error => {
    console.error("Error cargando el horario:", error);
    const wrap = document.getElementById("tableWrap");
    if (wrap) {
      wrap.innerHTML = `<div class="empty">Error al cargar los datos del horario.</div>`;
    }
  });

function mondayOf(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function prettyDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function courseClass(course){

const c = course
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"")

if(c.includes("probabilidad")) return "b-blue"

if(c.includes("matematica")) return "b-green"

if(c.includes("micro")) return "b-green"

if(c.includes("management")) return "b-violet"

if(c.includes("research")) return "b-rose"

if(c.includes("fundamentos")) return "b-blue"


if(c.includes("induccion")) return "b-slate"

if(c.includes("evaluacion")) return "b-slate"

return "b-slate"

}


function renderSummary(rows) {
  const classes = rows.filter(
    r =>
      !r.course.toLowerCase().includes("evaluación") &&
      !r.course.toLowerCase().includes("inducción")
  ).length;

  const courses = new Set(rows.map(r => r.course)).size;
  const profs = new Set(rows.map(r => r.professor).filter(Boolean)).size;

  document.getElementById("summary").innerHTML = `
    <article class="sum-card"><div class="k">${rows.length}</div><div class="v">actividades en la semana</div></article>
    <article class="sum-card"><div class="k">${classes}</div><div class="v">clases programadas</div></article>
    <article class="sum-card"><div class="k">${courses}</div><div class="v">cursos / hitos distintos</div></article>
    <article class="sum-card"><div class="k">${profs}</div><div class="v">profesores en la semana</div></article>
  `;
}

function setDefaultWeek() {
  const today = new Date();
  const weekday = (today.getDay() + 6) % 7;
  today.setDate(today.getDate() - weekday);

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const monday = `${year}-${month}-${day}`;

  const selector = document.getElementById("weekSelector");
  for (const option of selector.options) {
    if (option.value === monday) {
      selector.value = monday;
      return;
    }
  }
  selector.value = "all";
}

function updateFilters() {
  const weekStart = document.getElementById("weekSelector").value;
  const profSelector = document.getElementById("profSelector");
  const courseSelector = document.getElementById("courseSelector");

  const selectedProf = profSelector.value || "all";
  const selectedCourse = courseSelector.value || "all";

  let base = schedule;
  if (weekStart !== "all") {
    base = base.filter(r => mondayOf(r.date) === weekStart);
  }

  let professorOptionsBase = base;
  if (selectedCourse !== "all") {
    professorOptionsBase = professorOptionsBase.filter(r => r.course === selectedCourse);
  }

  let courseOptionsBase = base;
  if (selectedProf !== "all") {
    if (selectedProf === "sin_profesor") {
      courseOptionsBase = courseOptionsBase.filter(r => !r.professor);
    } else {
      courseOptionsBase = courseOptionsBase.filter(r => r.professor === selectedProf);
    }
  }

  const professors = [...new Set(professorOptionsBase.map(r => r.professor).filter(Boolean))];
  const hasNoProfessor = professorOptionsBase.some(r => !r.professor);
  const courses = [...new Set(courseOptionsBase.map(r => r.course))];

  const validProfValues = ["all", ...professors, ...(hasNoProfessor ? ["sin_profesor"] : [])];
  profSelector.innerHTML =
    `<option value="all">Todos</option>` +
    professors.map(p => `<option value="${p}">${p}</option>`).join("") +
    (hasNoProfessor ? `<option value="sin_profesor">Sin profesor asignado</option>` : ``);

  profSelector.value = validProfValues.includes(selectedProf) ? selectedProf : "all";

  const validCourseValues = ["all", ...courses];
  courseSelector.innerHTML =
    `<option value="all">Todos</option>` +
    courses.map(c => `<option value="${c}">${c}</option>`).join("");

  courseSelector.value = validCourseValues.includes(selectedCourse) ? selectedCourse : "all";
}

function renderWeek() {
  const weekStart = document.getElementById("weekSelector").value;
  const profValue = document.getElementById("profSelector").value;
  const courseValue = document.getElementById("courseSelector").value;

  const rows = schedule
    .filter(r => weekStart === "all" || mondayOf(r.date) === weekStart)
    .filter(r => {
      if (profValue === "all") return true;
      if (profValue === "sin_profesor") return !r.professor;
      return r.professor === profValue;
    })
    .filter(r => {
      if (courseValue === "all") return true;
      return r.course === courseValue;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (weekStart === "all") {
    document.getElementById("weekTitle").textContent = "Programación completa";
  } else {
    const titleOpt = document.querySelector(`#weekSelector option[value="${weekStart}"]`);
    document.getElementById("weekTitle").textContent = titleOpt ? titleOpt.textContent : "Semana seleccionada";
  }

  let subtitle = rows.length
    ? `Se encontraron ${rows.length} actividades registradas en la planificación para esta selección.`
    : "No hay actividades registradas para esta selección.";

  const subtitleParts = [];
  if (profValue !== "all") {
    subtitleParts.push(
      profValue === "sin_profesor" ? "sin profesor asignado" : `profesor: ${profValue}`
    );
  }
  if (courseValue !== "all") {
    subtitleParts.push(`curso: ${courseValue}`);
  }
  if (subtitleParts.length) {
    subtitle += ` Filtros activos: ${subtitleParts.join(" · ")}.`;
  }

  document.getElementById("weekSubtitle").textContent = subtitle;

  renderSummary(rows);

  const wrap = document.getElementById("tableWrap");
  if (!rows.length) {
    wrap.innerHTML = `<div class="empty">No hay actividades cargadas para la combinación de filtros seleccionada.</div>`;
    return;
  }

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Curso / actividad</th>
          <th>Profesor</th>
          <th>Horario</th>
          <th>Sala / modalidad</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td data-label="Fecha">
              <div class="datebox">
                <div class="day">${prettyDate(r.date).split(",")[0]}</div>
                <div class="date">${prettyDate(r.date).replace(/^[^,]+,\s*/, "")}</div>
              </div>
            </td>
            <td data-label="Curso / actividad">
              <span class="course badge ${courseClass(r.course)}">${r.course}</span>
            </td>
            <td data-label="Profesor"><div class="meta">${r.professor || "-"}</div></td>
            <td data-label="Horario"><div class="meta">${r.time || "-"}</div></td>
            <td data-label="Sala / modalidad"><div class="meta">${r.location || "-"}</div></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function formatICSDate(dateStr, timeStr, isEnd = false) {
  if (!timeStr) return null;

  const firstBlock = timeStr.split("·")[0].trim();
  const parts = firstBlock.split("-");

  if (parts.length < 2) return null;

  let time = isEnd ? parts[1].trim() : parts[0].trim();
  const [h, m] = time.split(":");

  return dateStr.replace(/-/g, "") + "T" + h.padStart(2, "0") + m.padStart(2, "0") + "00";
}

function generateICS() {
  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DEN UDD//Horario 2026//ES
CALSCALE:GREGORIAN
`;

  schedule.forEach((ev, i) => {
    const start = formatICSDate(ev.date, ev.time, false);
    const end = formatICSDate(ev.date, ev.time, true);

    if (!start || !end) return;

    ics += `
BEGIN:VEVENT
UID:den-${i}@udd.cl
DTSTAMP:${start}
DTSTART:${start}
DTEND:${end}
SUMMARY:${ev.course}
DESCRIPTION:Profesor ${ev.professor || "TBA"} - Doctorado Economía y Negocios UDD
LOCATION:${ev.location || ""}
END:VEVENT
`;
  });

  ics += `
END:VCALENDAR`;

  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "den_horario_2026.ics";
  a.click();

  URL.revokeObjectURL(url);
}

document.getElementById("weekSelector").addEventListener("change", () => {
  updateFilters();
  renderWeek();
});

document.getElementById("profSelector").addEventListener("change", () => {
  updateFilters();
  renderWeek();
});

document.getElementById("courseSelector").addEventListener("change", () => {
  updateFilters();
  renderWeek();
});

document.getElementById("downloadICS").addEventListener("click", generateICS);

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function nextClass(course) {
  const today = new Date().toISOString().slice(0, 10);

  const future = schedule
    .filter(e => e.course.toLowerCase().includes(course))
    .filter(e => e.date >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return future[0];
}

function classesThisWeek() {
  const today = new Date();
  const weekday = (today.getDay() + 6) % 7;
  today.setDate(today.getDate() - weekday);

  const monday = today.toISOString().slice(0, 10);

  return schedule.filter(e => mondayOf(e.date) === monday);
}

function askDEN() {
  const input = document.getElementById("den-question");
  if (!input) return;

  const q = normalize(input.value);
  let answer = "No encontré información.";

  if (q.includes("mañana")) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const date = d.toISOString().slice(0, 10);

    const events = schedule.filter(e => e.date === date);

    if (events.length) {
      answer = events.map(e =>
        `${e.course}<br>
Profesor: ${e.professor || "-"}<br>
Horario: ${e.time}`
      ).join("<br><br>");
    } else {
      answer = "No tienes clases mañana.";
    }
  } else if (q.includes("semana")) {
    const events = classesThisWeek();
    answer = events.map(e => `${e.date} — ${e.course}`).join("<br>");
  } else if (q.includes("profesor") || q.includes("da")) {
    const prof = schedule.find(e => q.includes(normalize(e.professor || "")));

    if (prof) {
      const courses = schedule
        .filter(e => e.professor === prof.professor)
        .map(e => e.course);

      answer = `${prof.professor} dicta:<br>` + [...new Set(courses)].join("<br>");
    }
  } else {
    for (const ev of schedule) {
      const courseNorm = normalize(ev.course);

      if (q.includes(courseNorm.split(" ")[0])) {
        const next = nextClass(courseNorm);

        if (next) {
          answer = `
Próxima clase de ${next.course}<br>
Fecha: ${next.date}<br>
Profesor: ${next.professor}<br>
Horario: ${next.time}
`;
        }
      }
    }
  }

  const chat = document.getElementById("den-chat-window");
  if (!chat) return;

  chat.innerHTML += `<div class="den-msg den-user">Tú: ${input.value}</div>`;
  chat.innerHTML += `<div class="den-msg den-bot">${answer}</div>`;
  chat.scrollTop = chat.scrollHeight;

  input.value = "";
}

function nextClassToday() {
  const today = new Date().toISOString().slice(0, 10);
  const events = schedule.filter(e => e.date === today);
  showAnswer(events);
}

function nextClassWeek() {
  const today = new Date();
  const weekday = (today.getDay() + 6) % 7;
  today.setDate(today.getDate() - weekday);

  const monday = today.toISOString().slice(0, 10);
  const events = schedule.filter(e => mondayOf(e.date) === monday);

  showAnswer(events);
}

function nextClassGlobal() {
  const today = new Date().toISOString().slice(0, 10);

  const future = schedule
    .filter(e => e.date >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!future.length) {
    showAnswer([]);
    return;
  }

  showAnswer([future[0]]);
}

function coursesByProfessor() {
  const profs = [...new Set(schedule.map(e => e.professor).filter(Boolean))];

  let html = `
<button class="den-back-btn" onclick="showMainMenu()">← Volver</button>
<br><br>
<b>Selecciona profesor</b><br><br>
`;

  profs.forEach(p => {
    html += `<button class="den-back-btn" onclick="showProfessorCourses('${p.replace(/'/g, "\\'")}')">${p}</button><br>`;
  });

  document.getElementById("den-chat-window").innerHTML = html;
}

function showProfessorCourses(p) {
  const courses = schedule
    .filter(e => e.professor === p)
    .map(e => e.course);

  const unique = [...new Set(courses)];
  showAnswer(unique.map(c => ({ course: c, professor: p })));
}

function showAnswer(events) {
  let html = `
<button class="den-back-btn" onclick="showMainMenu()">← Volver</button>
<br><br>
`;

  if (!events || !events.length) {
    html += "No encontré clases.";
    document.getElementById("den-chat-window").innerHTML = html;
    return;
  }

  events.forEach(e => {
    html += `
<div>
<b>${e.course}</b><br>
Profesor: ${e.professor || "-"}<br>
Fecha: ${e.date || "-"}<br>
Horario: ${e.time || "-"}<br><br>
</div>
`;
  });

  document.getElementById("den-chat-window").innerHTML = html;
}

function showMainMenu() {
  const chat = document.getElementById("den-chat-window");
  if (!chat) return;

  chat.innerHTML = `
<div class="den-bot">
¿Qué quieres saber?
</div>

<div class="den-buttons">
<button onclick="nextClassToday()">Clases de hoy</button>
<button onclick="nextClassWeek()">Clases esta semana</button>
<button onclick="nextClassGlobal()">Próxima clase</button>
<button onclick="coursesByProfessor()">Cursos por profesor</button>
</div>
`;
}