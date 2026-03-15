/* =====================================================
DEN Portal – portal.js
===================================================== */

/* =========================
DOM
========================= */

const facultyGrid = document.getElementById("facultyGrid")
const coursesGrid = document.getElementById("coursesGrid")

/* =========================
FACULTY
========================= */

function renderFaculty(){

if(!facultyGrid || !schedule) return

const professors = [...new Set(
schedule.map(e=>e.professor).filter(Boolean)
)]

facultyGrid.innerHTML = professors.map(p=>`

<div class="faculty-card">

<h3>${p}</h3>

<div class="faculty-links">

<a href="${scholarLinks[p] || "#"}" target="_blank">
Google Scholar
</a>

<button onclick="showProfessorCourses('${p}')">
Ver cursos
</button>

</div>

</div>

`).join("")

}


/* =========================
COURSES
========================= */

function renderCourses(){

if(!coursesGrid || !schedule) return

const courses = [...new Set(
schedule.map(e=>e.course)
)]

coursesGrid.innerHTML = courses.map(c=>`

<div class="course-card">

<h3>${c}</h3>

<button onclick="selectCourse('${c}')">
Ver horario
</button>

</div>

`).join("")

}


/* =========================
SELECT COURSE
========================= */

function selectCourse(course){

if(!courseSelector) return

courseSelector.value = course

const match = schedule.find(e=>e.course===course)

if(match && match.professor)
profSelector.value = match.professor

updateFilters()
renderWeek()

}


/* =========================
PROFESSOR COURSES
========================= */

function showProfessorCourses(prof){

if(!coursesGrid) return

const courses = [...new Set(
schedule
.filter(e=>e.professor===prof)
.map(e=>e.course)
)]

coursesGrid.innerHTML = `

<h2>${prof}</h2>

${courses.map(c=>`

<div class="course-card">

<h3>${c}</h3>

<button onclick="selectCourse('${c}')">
Ver horario
</button>

</div>

`).join("")}

`

}


/* =========================
PORTAL INIT
========================= */

function initPortal(){

renderFaculty()
renderCourses()

}

document.addEventListener("DOMContentLoaded", initPortal)