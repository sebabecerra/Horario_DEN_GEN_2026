/* =====================================================
DEN Chatbot – chatbot.js
===================================================== */

(function(){
let app = null
let snapshot = null

const dom = {}

document.addEventListener("DOMContentLoaded", () => {
  dom.window = document.getElementById("den-chat-window")
  dom.toggle = document.getElementById("chat-toggle")
  dom.chatbot = document.getElementById("den-chatbot")

  dom.toggle.addEventListener("click", toggleChat)

  if(window.DENApp){
    app = window.DENApp
    app.subscribe(nextSnapshot => {
      snapshot = nextSnapshot
      if(!dom.window.dataset.view){
        renderMenu()
      }
    })
  }

  renderMenu()
})

function toggleChat(){
  const isMinimized = dom.chatbot.classList.toggle("minimized")
  dom.toggle.textContent = isMinimized ? "+" : "−"
  dom.toggle.setAttribute("aria-expanded", String(!isMinimized))
}

function renderMenu(){
  dom.window.dataset.view = "menu"
  dom.window.innerHTML = ""

  const intro = document.createElement("div")
  intro.className = "chat-copy"
  intro.textContent = "¿Qué quieres revisar?"

  const buttons = document.createElement("div")
  buttons.className = "den-buttons"

  ;[
    { label: "Clases Semana Pasada", action: showClassesLastWeek },
    { label: "Clases Proxima Semana", action: showClassesNextWeek },
    { label: "Clases Esta Semana", action: showClassesThisWeek },
    { label: "Cursos por profesor", action: showProfessors }
  ].forEach(item => {
    const button = document.createElement("button")
    button.type = "button"
    button.textContent = item.label
    button.addEventListener("click", item.action)
    buttons.appendChild(button)
  })

  dom.window.append(intro, buttons)
}

function showClassesThisWeek(){
  if(!snapshot){
    return
  }

  const today = snapshot.helpers.formatLocalDate(new Date())
  const monday = snapshot.helpers.mondayOf(today)
  renderWeekEvents("Clases de esta semana", monday)
}

function showClassesLastWeek(){
  if(!snapshot){
    return
  }

  const today = new Date()
  today.setDate(today.getDate() - 7)
  const monday = snapshot.helpers.mondayOf(snapshot.helpers.formatLocalDate(today))
  renderWeekEvents("Clases de la semana pasada", monday)
}

function showClassesNextWeek(){
  if(!snapshot){
    return
  }

  const today = new Date()
  today.setDate(today.getDate() + 7)
  const monday = snapshot.helpers.mondayOf(snapshot.helpers.formatLocalDate(today))
  renderWeekEvents("Clases de la próxima semana", monday)
}

function renderWeekEvents(title, monday){
  const events = snapshot.schedule.filter(item =>
    snapshot.helpers.mondayOf(item.date) === monday &&
    isTeachingClass(item)
  )
  renderEvents(title, events)
}

function isTeachingClass(event){
  const course = String(event.course || "").toLowerCase()
  return !course.includes("inducci") && !course.includes("evaluaci")
}

function showProfessors(){
  if(!snapshot){
    return
  }

  dom.window.dataset.view = "professors"
  dom.window.innerHTML = ""
  dom.window.appendChild(createBackButton())

  const list = document.createElement("div")
  list.className = "den-buttons"

  const professors = [...new Set(snapshot.schedule.map(item => item.professor).filter(Boolean))]

  professors.forEach(name => {
    const button = document.createElement("button")
    button.type = "button"
    button.textContent = name
    button.addEventListener("click", () => {
      const events = snapshot.schedule.filter(item => item.professor === name)
      renderEvents(name, events)
    })
    list.appendChild(button)
  })

  dom.window.appendChild(list)
}

function renderEvents(title, events){
  dom.window.dataset.view = "results"
  dom.window.innerHTML = ""
  dom.window.appendChild(createBackButton())

  const heading = document.createElement("div")
  heading.className = "chat-copy"
  heading.textContent = title
  dom.window.appendChild(heading)

  if(!events.length){
    const empty = document.createElement("p")
    empty.className = "chat-empty"
    empty.textContent = "No encontré actividades para esa consulta."
    dom.window.appendChild(empty)
    return
  }

  const list = document.createElement("div")
  list.className = "chat-results"

  events.forEach(event => {
    const card = document.createElement("article")
    card.className = "chat-card"

    const course = document.createElement("h3")
    course.textContent = event.course

    const meta = document.createElement("p")
    meta.className = "chat-meta"
    meta.textContent = [
      event.professor || "Sin profesor asignado",
      formatChatDate(event.date),
      event.time || "Horario por definir",
      event.location || "Sala por definir"
    ].join(" | ")

    const action = document.createElement("button")
    action.type = "button"
    action.className = "chat-inline-btn"
    action.textContent = "Aplicar filtros"
    action.addEventListener("click", () => {
      app.setFilter("week", snapshot.helpers.mondayOf(event.date))
      app.setFilter("course", event.course)
      if(event.professor){
        app.setFilter("professor", event.professor)
      }
    })

    card.append(course, meta, action)
    list.appendChild(card)
  })

  dom.window.appendChild(list)
}

function createBackButton(){
  const button = document.createElement("button")
  button.type = "button"
  button.className = "chat-inline-btn"
  button.textContent = "← Volver"
  button.addEventListener("click", renderMenu)
  return button
}

function formatChatDate(dateStr){
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  })
}
})()
