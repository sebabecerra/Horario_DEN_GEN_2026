/* =====================================================
DEN Portal – portal.js
===================================================== */

(function(){
let app = null

const facultyRoster = [
  { name: "Nélyda Campos", group: "Claustro" },
  { name: "Flavia Cardoso", group: "Claustro" },
  { name: "Vesna Mandakovic", group: "Claustro" },
  { name: "Carlos Poblete", group: "Claustro" },
  { name: "Roberto D. Ponce", group: "Claustro" },
  { name: "Tomás Santa María", group: "Claustro" },
  { name: "Luis Torres", group: "Claustro" },
  { name: "Felipe Vásquez", group: "Claustro" },
  { name: "Marcos Vergara", group: "Claustro" },
  { name: "Claudio Aqueveque", group: "Colaborador" },
  { name: "Florencia Gabrielli", group: "Colaborador" },
  { name: "Alejandra Parrao", group: "Colaborador" },
  { name: "Jean Sepúlveda", group: "Colaborador" },
  { name: "Ángel Sevil", group: "Colaborador" },
  { name: "Manuel Willington", group: "Colaborador" },
  { name: "José Ernesto Amorós", group: "Visitante" },
  { name: "Teemu Kautonen", group: "Visitante" },
  { name: "Daniel Lerner", group: "Visitante" }
]

const dom = {}

document.addEventListener("DOMContentLoaded", () => {
  dom.facultyGrid = document.getElementById("facultyGrid")
  dom.showAllFaculty = document.getElementById("showAllFaculty")

  if(dom.showAllFaculty){
    dom.showAllFaculty.addEventListener("click", () => {
      app?.setFilter("professor", "all")
    })
  }

  if(window.DENApp){
    app = window.DENApp
    app.subscribe(snapshot => {
      renderVisibleFaculty(snapshot)
    })
  }
})

function renderVisibleFaculty(snapshot = app?.getState()){
  if(!snapshot || !dom.facultyGrid){
    return
  }

  const programEvents = snapshot.schedule || []

  dom.facultyGrid.innerHTML = ""

  const facultyCards = facultyRoster
    .map(entry => {
      const items = programEvents.filter(item => sameProfessor(item.professor, entry.name))
      return {
        entry,
        items,
        courses: new Set(items.map(item => item.course)).size
      }
    })
    .sort((left, right) => {
      const leftHasSchedule = left.items.length > 0 ? 1 : 0
      const rightHasSchedule = right.items.length > 0 ? 1 : 0

      if(leftHasSchedule !== rightHasSchedule){
        return rightHasSchedule - leftHasSchedule
      }

      return left.entry.name.localeCompare(right.entry.name, "es")
    })

  const withSchedule = facultyCards.filter(card => card.items.length)
  const withoutSchedule = facultyCards.filter(card => !card.items.length)

  const grid = document.createElement("div")
  grid.className = "faculty-band-grid faculty-band-grid-mixed"
  dom.facultyGrid.appendChild(grid)

  withSchedule.forEach(({ entry, items, courses }) => {
    renderFacultyCard(snapshot, entry, items, courses, grid)
  })

  withoutSchedule.forEach(({ entry, items, courses }) => {
    renderFacultyCard(snapshot, entry, items, courses, grid)
  })
}

function renderFacultyCard(snapshot, entry, items, courses, container){
  const card = document.createElement("article")
  card.className = "faculty-spotlight faculty-card"
  if(items.length){
    card.classList.add("faculty-card-active")
  } else {
    card.classList.add("faculty-card-muted")
  }

  const top = document.createElement("div")
  top.className = "faculty-spotlight-top"

  const title = document.createElement("h3")
  title.textContent = entry.name
  top.appendChild(title)

  const meta = document.createElement("p")
  meta.className = "muted-copy"
  meta.textContent = items.length
    ? `${courses} cursos | ${items.length} actividades`
    : "Sin horario en el programa"

  const actions = document.createElement("div")
  actions.className = "card-actions compact-actions"

  if(items.length){
    const viewButton = document.createElement("button")
    viewButton.type = "button"
    viewButton.className = "text-btn"
    viewButton.textContent = "Ver horario"
    viewButton.addEventListener("click", () => {
      app.setFilter("week", "all")
      app.setFilter("professor", entry.name)
    })
    actions.appendChild(viewButton)
  } else {
    const noSchedule = document.createElement("span")
    noSchedule.className = "text-muted text-muted-alert"
    noSchedule.textContent = "Sin horario"
    actions.appendChild(noSchedule)
  }

  const scholarLink = document.createElement("a")
  scholarLink.href = snapshot.scholarLinks[entry.name] || getScholarSearchUrl(entry.name)
  scholarLink.target = "_blank"
  scholarLink.rel = "noopener noreferrer"
  scholarLink.className = "text-link"
  scholarLink.textContent = "Scholar"
  actions.appendChild(scholarLink)

  card.append(top, meta, actions)
  container.appendChild(card)
}

function sameProfessor(left, right){
  return normalizeProfessorName(left) === normalizeProfessorName(right)
}

function normalizeProfessorName(value){
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/,?\s*ph\.?d\.?/gi, "")
    .trim()
    .toLowerCase()
}

function getScholarSearchUrl(name){
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(name)}`
}
})()
