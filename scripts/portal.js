/* =====================================================
DEN Portal – portal.js
===================================================== */

(function(){
let app = null

const dom = {}

document.addEventListener("DOMContentLoaded", () => {
  dom.facultyGrid = document.getElementById("facultyGrid")
  dom.showAllFaculty = document.getElementById("showAllFaculty")

  dom.showAllFaculty.addEventListener("click", () => {
    app?.setFilter("professor", "all")
  })

  if(window.DENApp){
    app = window.DENApp
    app.subscribe(snapshot => {
      renderFaculty(snapshot)
    })
  }
})

function renderFaculty(snapshot = app?.getState()){
  if(!snapshot || !dom.facultyGrid){
    return
  }

  const selectedProfessor = snapshot.filters.professor
  const professors = [...new Set(snapshot.schedule.map(item => item.professor).filter(Boolean))]
  dom.facultyGrid.innerHTML = ""

  professors.forEach(name => {
    const items = snapshot.schedule.filter(item => item.professor === name)
    const courses = new Set(items.map(item => item.course)).size

    const card = document.createElement("article")
    card.className = "info-card"

    const header = document.createElement("div")
    header.className = "info-card-head"

    const title = document.createElement("h3")
    title.textContent = name

    if(selectedProfessor === name){
      const pill = document.createElement("span")
      pill.className = "mini-pill"
      pill.textContent = "Activo"
      header.append(title, pill)
    } else {
      header.appendChild(title)
    }

    const meta = document.createElement("p")
    meta.className = "muted-copy"
    meta.textContent = `${courses} cursos | ${items.length} actividades`

    const actions = document.createElement("div")
    actions.className = "card-actions"

    const viewButton = document.createElement("button")
    viewButton.type = "button"
    viewButton.className = "text-btn"
    viewButton.textContent = "Filtrar horario"
    viewButton.addEventListener("click", () => {
      app.setFilter("professor", name)
    })

    actions.appendChild(viewButton)

    if(snapshot.scholarLinks[name]){
      const scholarLink = document.createElement("a")
      scholarLink.href = snapshot.scholarLinks[name]
      scholarLink.target = "_blank"
      scholarLink.rel = "noopener noreferrer"
      scholarLink.className = "text-link"
      scholarLink.textContent = "Google Scholar"
      actions.appendChild(scholarLink)
    }

    card.append(header, meta, actions)
    dom.facultyGrid.appendChild(card)
  })
}
})()
