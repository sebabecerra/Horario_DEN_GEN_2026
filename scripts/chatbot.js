/* =====================================================
DEN Chatbot – chatbot.js
===================================================== */

/* =========================
DOM
========================= */

const denChatWindow = document.getElementById("den-chat-window")
const chatToggle = document.getElementById("chat-toggle")
const chatbot = document.getElementById("den-chatbot")

/* =========================
UTILS
========================= */

function chatbotDate(dateStr){

const d = new Date(dateStr+"T00:00:00")

return d.toLocaleDateString("es-CL",{
weekday:"long",
day:"2-digit",
month:"long"
})

}

/* =========================
MAIN MENU
========================= */

function showMainMenu(){

if(!denChatWindow) return

denChatWindow.innerHTML = `

<div class="den-bot">
¿Qué quieres saber?
</div>

<div class="den-buttons">

<button onclick="nextClassToday()">
Clases de hoy
</button>

<button onclick="nextClassWeek()">
Clases esta semana
</button>

<button onclick="nextClassGlobal()">
Próxima clase
</button>

<button onclick="coursesByProfessor()">
Cursos por profesor
</button>

</div>

`

}

/* =========================
SHOW ANSWER
========================= */

function showAnswer(events){

let html = `
<button onclick="showMainMenu()">← Volver</button>
<br><br>
`

if(!events || !events.length){

html += "No encontré clases."
denChatWindow.innerHTML = html
return

}

events.forEach(e=>{

html += `

<b>${e.course}</b><br>
Profesor: ${e.professor || "-"}<br>
Fecha: ${chatbotDate(e.date)}<br>
Horario: ${e.time || "-"}<br>
Sala: ${e.location || "-"}<br><br>

`

})

denChatWindow.innerHTML = html

}

/* =========================
TODAY
========================= */

function nextClassToday(){

if(!schedule) return

const today = new Date().toISOString().slice(0,10)

const events = schedule.filter(e => e.date === today)

showAnswer(events)

}

/* =========================
THIS WEEK
========================= */

function nextClassWeek(){

if(!schedule) return

const today = new Date()

const weekday = (today.getDay()+6)%7
today.setDate(today.getDate()-weekday)

const monday = today.toISOString().slice(0,10)

const events = schedule.filter(e => mondayOf(e.date) === monday)

showAnswer(events)

}

/* =========================
NEXT CLASS
========================= */

function nextClassGlobal(){

if(!schedule) return

const today = new Date().toISOString().slice(0,10)

const future = schedule
.filter(e => e.date >= today)
.sort((a,b)=> new Date(a.date) - new Date(b.date))

if(!future.length){

showAnswer([])
return

}

showAnswer([future[0]])

}

/* =========================
COURSES BY PROFESSOR
========================= */

function coursesByProfessor(){

if(!schedule) return

const profs = [...new Set(schedule.map(e=>e.professor).filter(Boolean))]

let html = `
<button onclick="showMainMenu()">← Volver</button>
<br><br>
`

profs.forEach(p=>{

html += `
<button onclick="showProfessorCourses('${p}')">
${p}
</button>
<br>
`

})

denChatWindow.innerHTML = html

}

function showProfessorCourses(prof){

const events = schedule.filter(e => e.professor === prof)

showAnswer(events)

}

/* =========================
MINIMIZE
========================= */

if(chatToggle && chatbot){

chatToggle.addEventListener("click",()=>{

chatbot.classList.toggle("minimized")

chatToggle.textContent =
chatbot.classList.contains("minimized") ? "+" : "−"

})

}

/* =========================
INIT
========================= */

document.addEventListener("DOMContentLoaded",()=>{

showMainMenu()

})