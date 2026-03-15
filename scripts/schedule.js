/* =====================================================
DEN Horario 2026 – schedule.js
===================================================== */

(function(){
const scholarLinks = {
  "Luis Torres": "https://scholar.google.com/citations?user=QHzMa7MAAAAJ&hl=en",
  "Carlos Poblete": "https://scholar.google.com/citations?user=s0uM4qcAAAAJ&hl=es",
  "Nélyda Campos": "https://scholar.google.com/citations?user=Nh6N6mQAAAAJ&hl=es",
  "Florencia Gabrielli": "https://scholar.google.com/citations?user=TnxT694AAAAJ&hl=es",
  "Claudio Aqueveque": "https://scholar.google.com/citations?user=JLauNGgAAAAJ&hl=es"
}

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

const state = {
  schedule: [],
  courseColorMap: {},
  filters: {
    week: "all",
    professor: "all",
    course: "all",
    query: ""
  },
  subscribers: []
}

const dom = {}

document.addEventListener("DOMContentLoaded", init)

function init(){
  cacheDom()
  bindEvents()
  fetchSchedule()
}

function cacheDom(){
  dom.weekSelector = document.getElementById("weekSelector")
  dom.profSelector = document.getElementById("profSelector")
  dom.courseSelector = document.getElementById("courseSelector")
  dom.searchInput = document.getElementById("searchInput")
  dom.resetFilters = document.getElementById("resetFilters")
  dom.downloadICS = document.getElementById("downloadICS")
  dom.summary = document.getElementById("summary")
  dom.weekTitle = document.getElementById("weekTitle")
  dom.weekSubtitle = document.getElementById("weekSubtitle")
  dom.legend = document.getElementById("legend")
  dom.tableWrap = document.getElementById("tableWrap")
}

function bindEvents(){
  dom.weekSelector.addEventListener("change", event => {
    state.filters.week = event.target.value
    syncDependentFilters()
    render()
  })

  dom.profSelector.addEventListener("change", event => {
    state.filters.professor = event.target.value
    syncDependentFilters()
    render()
  })

  dom.courseSelector.addEventListener("change", event => {
    state.filters.course = event.target.value
    syncDependentFilters()
    render()
  })

  dom.searchInput.addEventListener("input", event => {
    state.filters.query = event.target.value.trim()
    syncDependentFilters()
    render()
  })

  dom.resetFilters.addEventListener("click", resetFilters)
  dom.downloadICS.addEventListener("click", downloadCalendar)
}

function fetchSchedule(){
  fetch("data/schedule.json")
    .then(response => {
      if(!response.ok){
        throw new Error("No se pudo cargar schedule.json")
      }

      return response.json()
    })
    .then(data => {
      state.schedule = data
        .map(normalizeEvent)
        .sort((a, b) => a.date.localeCompare(b.date) || a.sortStart.localeCompare(b.sortStart))

      state.filters.week = getDefaultWeek()
      renderSelectors()
      syncDependentFilters()
      render()
    })
    .catch(error => {
      console.error(error)
      renderError("Error al cargar los datos del horario.")
    })
}

function normalizeEvent(item){
  const professor = typeof item.professor === "string" ? item.professor.trim() : ""
  const location = typeof item.location === "string" ? item.location.trim() : ""
  const time = typeof item.time === "string" ? item.time.trim() : ""
  const blocks = parseTimeBlocks(time)

  return {
    date: item.date,
    course: item.course.trim(),
    professor,
    location,
    time,
    timeBlocks: blocks,
    hasProfessor: Boolean(professor),
    sortStart: blocks[0]?.start ?? "99:99"
  }
}

function parseTimeBlocks(timeLabel){
  if(!timeLabel){
    return []
  }

  return timeLabel
    .split("·")
    .map(part => part.trim())
    .map(part => {
      const match = part.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/)
      if(!match){
        return null
      }

      return {
        start: match[1],
        end: match[2],
        label: `${match[1]} - ${match[2]}`
      }
    })
    .filter(Boolean)
}

function formatLocalDate(date){
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function mondayOf(dateStr){
  const date = new Date(`${dateStr}T00:00:00`)
  const weekday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - weekday)
  return formatLocalDate(date)
}

function prettyDate(dateStr){
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  })
}

function shortDate(dateStr){
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short"
  })
}

function getDefaultWeek(){
  const today = formatLocalDate(new Date())
  const currentMonday = mondayOf(today)
  const weeks = getWeeks()
  return weeks.includes(currentMonday) ? currentMonday : "all"
}

function getWeeks(){
  return [...new Set(state.schedule.map(item => mondayOf(item.date)))]
}

function getVisibleEvents(filters = state.filters){
  const query = normalizeSearchText(filters.query)

  return state.schedule.filter(item => {
    if(filters.week !== "all" && mondayOf(item.date) !== filters.week){
      return false
    }

    if(filters.professor === "sin_profesor" && item.hasProfessor){
      return false
    }

    if(filters.professor !== "all" && filters.professor !== "sin_profesor" && item.professor !== filters.professor){
      return false
    }

    if(filters.course !== "all" && item.course !== filters.course){
      return false
    }

    if(!query){
      return true
    }

    const haystack = normalizeSearchText([item.course, item.professor, item.location, item.time].join(" "))
    return haystack.includes(query)
  })
}

function normalizeSearchText(value){
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function getVisibleProfessors(filters = state.filters){
  const scopedFilters = { ...filters, professor: "all" }
  const items = getVisibleEvents(scopedFilters)
  return [...new Set(items.map(item => item.professor).filter(Boolean))]
}

function getVisibleCourses(filters = state.filters){
  const scopedFilters = { ...filters, course: "all" }
  const items = getVisibleEvents(scopedFilters)
  return [...new Set(items.map(item => item.course))]
}

function renderSelectors(){
  renderWeekOptions()
  syncDependentFilters()
  syncControls()
}

function renderWeekOptions(){
  const weeks = getWeeks()
  dom.weekSelector.innerHTML = ""
  dom.weekSelector.appendChild(createOption("all", "Todas las semanas"))

  weeks.forEach(week => {
    dom.weekSelector.appendChild(createOption(week, getWeekLabel(week)))
  })
}

function syncDependentFilters(){
  const availableProfessors = getVisibleProfessors()
  const availableCourses = getVisibleCourses()

  if(state.filters.professor !== "all" &&
    state.filters.professor !== "sin_profesor" &&
    !availableProfessors.includes(state.filters.professor)){
    state.filters.professor = "all"
  }

  if(state.filters.course !== "all" && !availableCourses.includes(state.filters.course)){
    state.filters.course = "all"
  }

  renderFilterOptions(dom.profSelector, [
    { value: "all", label: "Todos" },
    ...availableProfessors.map(name => ({ value: name, label: name })),
    { value: "sin_profesor", label: "Sin profesor asignado" }
  ], state.filters.professor)

  renderFilterOptions(dom.courseSelector, [
    { value: "all", label: "Todos" },
    ...availableCourses.map(name => ({ value: name, label: name }))
  ], state.filters.course)

  syncControls()
}

function renderFilterOptions(select, options, selectedValue){
  select.innerHTML = ""
  options.forEach(option => {
    select.appendChild(createOption(option.value, option.label))
  })
  select.value = selectedValue
}

function syncControls(){
  dom.weekSelector.value = state.filters.week
  dom.profSelector.value = state.filters.professor
  dom.courseSelector.value = state.filters.course
  dom.searchInput.value = state.filters.query
}

function createOption(value, label){
  const option = document.createElement("option")
  option.value = value
  option.textContent = label
  return option
}

function render(){
  const rows = getVisibleEvents()
  renderSummary(rows)
  renderHeading(rows)
  renderLegend(rows)
  renderTable(rows)
  notifySubscribers(rows)
}

function renderSummary(rows){
  const totalClasses = rows.filter(row => !isSpecialActivity(row.course)).length
  const totalCourses = new Set(rows.map(row => row.course)).size
  const totalProfessors = new Set(rows.map(row => row.professor).filter(Boolean)).size
  const totalLocations = new Set(rows.map(row => normalizeLocationLabel(row.location))).size

  dom.summary.innerHTML = ""

  ;[
    { value: rows.length, label: "actividades visibles" },
    { value: totalClasses, label: "clases formales" },
    { value: totalCourses, label: "cursos activos" },
    { value: totalProfessors, label: "profesores visibles" },
    { value: totalLocations, label: "salas o modalidades" }
  ].forEach(item => {
    const card = document.createElement("article")
    card.className = "sum-card"

    const number = document.createElement("div")
    number.className = "k"
    number.textContent = String(item.value)

    const label = document.createElement("div")
    label.className = "v"
    label.textContent = item.label

    card.append(number, label)
    dom.summary.appendChild(card)
  })
}

function renderHeading(rows){
  if(state.filters.week === "all"){
    dom.weekTitle.textContent = "Programación completa"
    dom.weekSubtitle.textContent = `${rows.length} actividades encontradas en el periodo enero-julio 2026.`
    return
  }

  dom.weekTitle.textContent = getWeekLabel(state.filters.week)
  dom.weekSubtitle.textContent = `${rows.length} actividades registradas para la semana seleccionada.`
}

function renderLegend(rows){
  const courses = [...new Set(rows.map(item => item.course))]
  dom.legend.innerHTML = ""

  courses.forEach(course => {
    const button = document.createElement("button")
    button.type = "button"
    button.className = `badge legend-course ${getCourseColor(course)}`
    button.textContent = course
    button.setAttribute("aria-pressed", String(state.filters.course === course))
    button.addEventListener("click", () => {
      state.filters.course = state.filters.course === course ? "all" : course
      syncDependentFilters()
      render()
    })
    dom.legend.appendChild(button)
  })
}

function renderTable(rows){
  dom.tableWrap.innerHTML = ""

  if(!rows.length){
    const empty = document.createElement("div")
    empty.className = "empty"
    empty.textContent = "No hay actividades que coincidan con los filtros actuales."
    dom.tableWrap.appendChild(empty)
    return
  }

  const table = document.createElement("table")
  const thead = document.createElement("thead")
  const headerRow = document.createElement("tr")

  ;["Fecha", "Curso", "Profesor", "Horario", "Sala / modalidad"].forEach(label => {
    const th = document.createElement("th")
    th.scope = "col"
    th.textContent = label
    headerRow.appendChild(th)
  })

  thead.appendChild(headerRow)

  const tbody = document.createElement("tbody")
  rows.forEach(row => {
    tbody.appendChild(renderRow(row))
  })

  table.append(thead, tbody)
  dom.tableWrap.appendChild(table)
}

function renderRow(row){
  const tr = document.createElement("tr")
  tr.appendChild(renderDateCell(row.date))
  tr.appendChild(renderCourseCell(row.course))
  tr.appendChild(renderProfessorCell(row.professor))
  tr.appendChild(renderTextCell("Horario", row.time || "Sin bloque horario"))
  tr.appendChild(renderTextCell("Sala / modalidad", row.location || "Por definir"))
  return tr
}

function renderDateCell(date){
  const td = document.createElement("td")
  td.dataset.label = "Fecha"

  const wrapper = document.createElement("div")
  wrapper.className = "datebox"

  const parts = prettyDate(date).split(",")

  const day = document.createElement("div")
  day.className = "day"
  day.textContent = parts[0]

  const detail = document.createElement("div")
  detail.className = "date"
  detail.textContent = parts.slice(1).join(",").trim()

  wrapper.append(day, detail)
  td.appendChild(wrapper)
  return td
}

function renderCourseCell(course){
  const td = document.createElement("td")
  td.dataset.label = "Curso"

  const button = document.createElement("button")
  button.type = "button"
  button.className = `badge badge-button ${getCourseColor(course)}`
  button.textContent = course
  button.addEventListener("click", () => {
    state.filters.course = course
    syncDependentFilters()
    render()
  })

  td.appendChild(button)
  return td
}

function renderProfessorCell(name){
  const td = document.createElement("td")
  td.dataset.label = "Profesor"

  if(!name){
    td.textContent = "Sin profesor asignado"
    return td
  }

  const wrapper = document.createElement("div")
  wrapper.className = "professor-cell"

  const trigger = document.createElement("button")
  trigger.type = "button"
  trigger.className = "text-btn professor-trigger"
  trigger.textContent = name
  trigger.addEventListener("click", () => {
    state.filters.professor = name
    syncDependentFilters()
    render()
  })
  wrapper.appendChild(trigger)

  if(scholarLinks[name]){
    const link = document.createElement("a")
    link.href = scholarLinks[name]
    link.className = "scholar-link"
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    link.textContent = "Scholar"
    wrapper.appendChild(link)
  }

  td.appendChild(wrapper)
  return td
}

function renderTextCell(label, value){
  const td = document.createElement("td")
  td.dataset.label = label
  td.textContent = value
  return td
}

function renderError(message){
  dom.weekTitle.textContent = "Horario no disponible"
  dom.weekSubtitle.textContent = "No se pudieron cargar los datos."
  dom.summary.innerHTML = ""
  dom.legend.innerHTML = ""
  dom.tableWrap.innerHTML = ""

  const empty = document.createElement("div")
  empty.className = "empty"
  empty.textContent = message
  dom.tableWrap.appendChild(empty)
}

function getWeekLabel(weekStart){
  const start = new Date(`${weekStart}T00:00:00`)
  const end = new Date(`${weekStart}T00:00:00`)
  end.setDate(end.getDate() + 4)

  const startLabel = start.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long"
  })

  const endLabel = end.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })

  return `Semana ${startLabel} - ${endLabel}`
}

function isSpecialActivity(course){
  const label = course.toLowerCase()
  return label.includes("evaluaci") || label.includes("inducci")
}

function normalizeLocationLabel(location){
  return location || "Por definir"
}

function getCourseColor(course){
  if(!state.courseColorMap[course]){
    const index = Object.keys(state.courseColorMap).length % palette.length
    state.courseColorMap[course] = palette[index]
  }

  return state.courseColorMap[course]
}

function downloadCalendar(){
  const visible = getVisibleEvents()
  const timestampDate = formatLocalDate(new Date())
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DEN//Horario 2026//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ]

  visible.forEach((event, index) => {
    event.timeBlocks.forEach((block, blockIndex) => {
      lines.push("BEGIN:VEVENT")
      lines.push(`UID:den-${index}-${blockIndex}@udd.cl`)
      lines.push(`DTSTAMP:${toICSDateTime(timestampDate, "00:00")}`)
      lines.push(`DTSTART:${toICSDateTime(event.date, block.start)}`)
      lines.push(`DTEND:${toICSDateTime(event.date, block.end)}`)
      lines.push(`SUMMARY:${escapeICS(event.course)}`)
      lines.push(`DESCRIPTION:${escapeICS(buildDescription(event))}`)
      lines.push(`LOCATION:${escapeICS(event.location || "Por definir")}`)
      lines.push("END:VEVENT")
    })
  })

  lines.push("END:VCALENDAR")

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "den_horario_2026.ics"
  anchor.click()
  URL.revokeObjectURL(url)
}

function buildDescription(event){
  const professor = event.professor || "Sin profesor asignado"
  return `Profesor: ${professor} | Horario: ${event.time || "Por definir"}`
}

function toICSDateTime(date, time){
  const [hours, minutes] = time.split(":")
  return `${date.replace(/-/g, "")}T${hours}${minutes}00`
}

function escapeICS(value){
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
}

function notifySubscribers(rows){
  const snapshot = getSnapshot(rows)
  state.subscribers.forEach(listener => listener(snapshot))
}

function getSnapshot(rows = getVisibleEvents()){
  return {
    filters: { ...state.filters },
    schedule: [...state.schedule],
    visibleEvents: [...rows],
    scholarLinks: { ...scholarLinks },
    helpers: {
      formatLocalDate,
      mondayOf,
      prettyDate,
      shortDate,
      getCourseColor,
      getWeekLabel
    }
  }
}

function subscribe(listener){
  state.subscribers.push(listener)

  if(state.schedule.length){
    listener(getSnapshot())
  }

  return () => {
    state.subscribers = state.subscribers.filter(item => item !== listener)
  }
}

function setFilter(name, value){
  if(!(name in state.filters)){
    return
  }

  state.filters[name] = value
  syncDependentFilters()
  render()
}

function resetFilters(){
  state.filters.week = getDefaultWeek()
  state.filters.professor = "all"
  state.filters.course = "all"
  state.filters.query = ""
  syncControls()
  syncDependentFilters()
  render()
}

window.DENApp = {
  subscribe,
  setFilter,
  resetFilters,
  getState: () => getSnapshot(),
  getVisibleEvents: () => getVisibleEvents(),
  getWeekLabel
}
})()
