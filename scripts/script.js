/* =====================================================
   DEN Horario 2026 – script.js
   ===================================================== */

let schedule = []

/* =========================
DOM
========================= */

const weekSelector = document.getElementById("weekSelector")
const profSelector = document.getElementById("profSelector")
const courseSelector = document.getElementById("courseSelector")

const summary = document.getElementById("summary")
const tableWrap = document.getElementById("tableWrap")
const legend = document.getElementById("legend")

const downloadICS = document.getElementById("downloadICS")

const denChatWindow = document.getElementById("den-chat-window")
const chatToggle = document.getElementById("chat-toggle")
const chatbot = document.getElementById("den-chatbot")

/* =========================
LOAD DATA
========================= */

fetch("data/schedule.json")
.then(r=>{
if(!r.ok) throw new Error("No se pudo cargar schedule.json")
return r.json()
})
.then(data=>{

schedule = data

schedule.sort((a,b)=>new Date(a.date)-new Date(b.date))

setDefaultWeek()
updateFilters()
renderWeek()
renderLegend()
showMainMenu()

})
.catch(err=>{
console.error(err)
tableWrap.innerHTML =
`<div class="empty">Error al cargar los datos del horario.</div>`
})

/* =========================
UTILS
========================= */

function mondayOf(dateStr){

const d = new Date(dateStr+"T00:00:00")
const weekday = (d.getDay()+6)%7
d.setDate(d.getDate()-weekday)

return d.toISOString().slice(0,10)

}

function prettyDate(dateStr){

const d = new Date(dateStr+"T00:00:00")

return d.toLocaleDateString("es-CL",{
weekday:"long",
day:"2-digit",
month:"long",
year:"numeric"
})

}

/* =========================
COURSE COLORS AUTO
========================= */

const courseColorMap = {}

const palette = [
"c-blue",
"c-green",
"c-orange",
"c-purple",
"c-pink",
"c-indigo",
"c-teal",
"c-yellow",
"c-red"
]

function getCourseColor(course){

if(!courseColorMap[course]){

const index = Object.keys(courseColorMap).length % palette.length
courseColorMap[course] = palette[index]

}

return courseColorMap[course]

}

/* =========================
DEFAULT WEEK
========================= */

function setDefaultWeek(){

const today = new Date()
const weekday = (today.getDay()+6)%7
today.setDate(today.getDate()-weekday)

const monday = today.toISOString().slice(0,10)

for(const option of weekSelector.options){

if(option.value===monday){
weekSelector.value=monday
return
}

}

weekSelector.value="all"

}

/* =========================
FILTERS
========================= */

function updateFilters(){

const week = weekSelector.value
let prof = profSelector.value
let course = courseSelector.value

let base = schedule

if(week!=="all")
base = base.filter(e=>mondayOf(e.date)===week)

let profBase = base
if(course!=="all")
profBase = profBase.filter(e=>e.course===course)

let courseBase = base
if(prof!=="all"){

if(prof==="sin_profesor")
courseBase = courseBase.filter(e=>!e.professor)

else
courseBase = courseBase.filter(e=>e.professor===prof)

}

const profs = [...new Set(profBase.map(e=>e.professor).filter(Boolean))]
const courses = [...new Set(courseBase.map(e=>e.course))]

/* PROF SELECT */

profSelector.innerHTML =
`<option value="all">Todos</option>` +
profs.map(p=>`<option value="${p}">${p}</option>`).join("") +
`<option value="sin_profesor">Sin profesor asignado</option>`

/* COURSE SELECT */

courseSelector.innerHTML =
`<option value="all">Todos</option>` +
courses.map(c=>`<option value="${c}">${c}</option>`).join("")

/* RESTORE SELECTION */

if(profSelector.querySelector(`option[value="${prof}"]`))
profSelector.value = prof

if(courseSelector.querySelector(`option[value="${course}"]`))
courseSelector.value = course

}

/* =========================
SUMMARY
========================= */

function renderSummary(rows){

const classes = rows.filter(r=>
!r.course.toLowerCase().includes("evaluacion") &&
!r.course.toLowerCase().includes("induccion")
).length

const courses = new Set(rows.map(r=>r.course)).size
const profs = new Set(rows.map(r=>r.professor).filter(Boolean)).size

summary.innerHTML =

`
<article class="sum-card">
<div class="k">${rows.length}</div>
<div class="v">actividades</div>
</article>

<article class="sum-card">
<div class="k">${classes}</div>
<div class="v">clases</div>
</article>

<article class="sum-card">
<div class="k">${courses}</div>
<div class="v">cursos</div>
</article>

<article class="sum-card">
<div class="k">${profs}</div>
<div class="v">profesores</div>
</article>
`

}

/* =========================
RENDER WEEK
========================= */

function renderWeek(){

const week = weekSelector.value
const prof = profSelector.value
const course = courseSelector.value

const rows = schedule
.filter(e=>week==="all"||mondayOf(e.date)===week)
.filter(e=>{
if(prof==="all") return true
if(prof==="sin_profesor") return !e.professor
return e.professor===prof
})
.filter(e=>course==="all"||e.course===course)
.sort((a,b)=>new Date(a.date)-new Date(b.date))

renderSummary(rows)

if(!rows.length){

tableWrap.innerHTML =
`<div class="empty">No hay actividades.</div>`

return

}

tableWrap.innerHTML =

`
<table>

<thead>
<tr>
<th>Fecha</th>
<th>Curso</th>
<th>Profesor</th>
<th>Horario</th>
<th>Sala</th>
</tr>
</thead>

<tbody>

${rows.map(r=>`

<tr>

<td data-label="Fecha">
<div class="datebox">
<div class="day">${prettyDate(r.date).split(",")[0]}</div>
<div class="date">${prettyDate(r.date).replace(/^[^,]+,\s*/,"")}</div>
</div>
</td>

<td data-label="Curso">
<span class="badge ${getCourseColor(r.course)}">${r.course}</span></td>

<td data-label="Profesor">${r.professor||"-"}</td>

<td data-label="Horario">${r.time||"-"}</td>

<td data-label="Sala">${r.location||"-"}</td>

</tr>

`).join("")}

</tbody>
</table>
`

}

/* =========================
LEGEND
========================= */


function renderLegend(){

const uniqueCourses = [...new Set(schedule.map(e => e.course))]

legend.innerHTML = uniqueCourses
.map(course => `
<span class="badge ${getCourseColor(course)} legend-course"
data-course="${course}">
${course}
</span>
`)
.join("")

document.querySelectorAll(".legend-course").forEach(badge => {

badge.addEventListener("click", () => {

const course = badge.dataset.course

/* marcar badge activo */

document.querySelectorAll(".legend-course")
.forEach(b => b.classList.remove("active"))

badge.classList.add("active")

/* sincronizar selector */

courseSelector.value = course

/* render directo */

renderWeek()

})

})

}

/* =========================
ICS GENERATOR
========================= */

function formatICSDate(date,time,isEnd=false){

if(!time) return null

const block = (time.split("·")[0] || time)
const parts = block.split("-")

if(parts.length<2) return null

let t = isEnd ? parts[1] : parts[0]
t=t.trim()

const [h,m]=t.split(":")

return date.replace(/-/g,"")+"T"+h+m+"00"

}

function generateICS(){

let ics=`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DEN//Horario 2026//ES
`

schedule.forEach((ev,i)=>{

const start = formatICSDate(ev.date,ev.time,false)
const end = formatICSDate(ev.date,ev.time,true)

if(!start||!end) return

ics+=`

BEGIN:VEVENT
UID:den${i}@udd.cl
DTSTART:${start}
DTEND:${end}
SUMMARY:${ev.course}
DESCRIPTION:Profesor ${ev.professor||"TBA"}
LOCATION:${ev.location||""}
END:VEVENT
`

})

ics+=`\nEND:VCALENDAR`

const blob = new Blob([ics],{type:"text/calendar"})
const url = URL.createObjectURL(blob)

const a=document.createElement("a")
a.href=url
a.download="den_horario_2026.ics"
a.click()

}

/* =========================
EVENTS
========================= */

weekSelector.addEventListener("change",()=>{

updateFilters()
renderWeek()

})

profSelector.addEventListener("change",()=>{

updateFilters()
renderWeek()

})

courseSelector.addEventListener("change",()=>{

updateFilters()
renderWeek()

})

downloadICS.addEventListener("click",generateICS)

/* =========================
CHATBOT
========================= */

function showMainMenu(){

denChatWindow.innerHTML=`

<div class="den-bot">
¿Qué quieres saber?
</div>

<div class="den-buttons">

<button onclick="nextClassToday()">Clases de hoy</button>
<button onclick="nextClassWeek()">Clases esta semana</button>
<button onclick="nextClassGlobal()">Próxima clase</button>
<button onclick="coursesByProfessor()">Cursos por profesor</button>

</div>
`

}

function showAnswer(events){

let html=`<button onclick="showMainMenu()">← Volver</button><br><br>`

if(!events.length){

html+="No encontré clases."
denChatWindow.innerHTML=html
return

}

events.forEach(e=>{

html+=`

<b>${e.course}</b><br>
Profesor: ${e.professor||"-"}<br>
Fecha: ${e.date}<br>
Horario: ${e.time}<br><br>

`

})

denChatWindow.innerHTML=html

}

function nextClassToday(){

const today=new Date().toISOString().slice(0,10)
const events=schedule.filter(e=>e.date===today)

showAnswer(events)

}

function nextClassWeek(){

const today=new Date()
const weekday=(today.getDay()+6)%7
today.setDate(today.getDate()-weekday)

const monday=today.toISOString().slice(0,10)

const events=schedule.filter(e=>mondayOf(e.date)===monday)

showAnswer(events)

}

function nextClassGlobal(){

const today=new Date().toISOString().slice(0,10)

const future=schedule
.filter(e=>e.date>=today)
.sort((a,b)=>new Date(a.date)-new Date(b.date))

if(!future.length) showAnswer([])
else showAnswer([future[0]])

}

function coursesByProfessor(){

const profs=[...new Set(schedule.map(e=>e.professor).filter(Boolean))]

let html=`<button onclick="showMainMenu()">← Volver</button><br><br>`

profs.forEach(p=>{
html+=`<button onclick="showProfessorCourses('${p}')">${p}</button><br>`
})

denChatWindow.innerHTML=html

}

function showProfessorCourses(p){

const events=schedule.filter(e=>e.professor===p)
showAnswer(events)

}

/* =========================
CHATBOT MINIMIZE
========================= */

if(chatToggle && chatbot){

chatToggle.addEventListener("click",()=>{

chatbot.classList.toggle("minimized")

chatToggle.textContent =
chatbot.classList.contains("minimized") ? "+" : "−"

})

}