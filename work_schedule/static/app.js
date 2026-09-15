const API_URL = "https://onrender.com";

let currentSubjectId = null;

// 🔒 GATEKEEPER AUTH CHECK: Run immediately
function checkAuth() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    // Kick unauthenticated users out to the login page
    window.location.href = "login.html";
  } else {
    fetchSubjects();
  }
}

function handleLogout() {
  localStorage.removeItem("authToken");
  window.location.href = "login.html";
}

// --- SUBJECT ACTIONS ---
async function fetchSubjects() {
  const response = await fetch(`${API_URL}/subjects`);
  const subjects = await response.json();
  const grid = document.getElementById("subjects-grid");
  grid.innerHTML = "";

  subjects.forEach((sub) => {
    grid.innerHTML += `
            <div class="card subject-card">
                <div onclick="selectSubject(${sub.id}, '${sub.code} - ${sub.name}')" style="cursor:pointer; flex: 1;">
                    <span class="badge">${sub.code}</span>
                    <h3>${sub.name}</h3>
                    <p style="color:#007bff; font-size:0.9em; font-weight:bold;">View Tasks ➔</p>
                </div>
                <button onclick="deleteSubject(${sub.id})" class="danger-btn compact-btn">Delete</button>
            </div>
        `;
  });
}

async function addSubject() {
  const name = document.getElementById("sub-name-input").value;
  const code = document.getElementById("sub-code-input").value;
  if (!name || !code) return;

  await fetch(`${API_URL}/subjects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, code }),
  });

  document.getElementById("sub-name-input").value = "";
  document.getElementById("sub-code-input").value = "";
  fetchSubjects();
}

async function deleteSubject(id) {
  if (
    !confirm("Are you sure? Removing this subject will wipe out all its tasks!")
  )
    return;
  await fetch(`${API_URL}/subjects/${id}`, { method: "DELETE" });
  fetchSubjects();
}

// --- VIEW NAVIGATION ---
function selectSubject(id, title) {
  currentSubjectId = id;
  document.getElementById("active-subject-title").innerText = title;
  document.getElementById("subjects-dashboard").classList.add("hidden");
  document.getElementById("subject-details-view").classList.remove("hidden");
  fetchTasks();
}

function backToDashboard() {
  currentSubjectId = null;
  document.getElementById("subjects-dashboard").classList.remove("hidden");
  document.getElementById("subject-details-view").classList.add("hidden");
  fetchSubjects();
}

// --- TASK VIEWS ---
async function fetchTasks() {
  if (!currentSubjectId) return;
  const response = await fetch(`${API_URL}/subjects/${currentSubjectId}/tasks`);
  const tasks = await response.json();

  const pendingList = document.getElementById("pending-tasks-list");
  const completedList = document.getElementById("completed-tasks-list");
  pendingList.innerHTML = "";
  completedList.innerHTML = "";

  tasks.forEach((task) => {
    const isComp = task.status === "completed";
    const targetDiv = isComp ? completedList : pendingList;

    targetDiv.innerHTML += `
            <div class="item task-item">
                <span class="${isComp ? "completed" : ""}">${task.title}</span>
                <button onclick="toggleTask(${task.id}, '${task.status}')" class="toggle-btn ${isComp ? "completed-style" : ""}">
                    ${isComp ? "Reopen" : "Done"}
                </button>
            </div>
        `;
  });
}

async function addTask() {
  const title = document.getElementById("task-title-input").value;
  if (!title || !currentSubjectId) return;

  await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, subject_id: currentSubjectId }),
  });

  document.getElementById("task-title-input").value = "";
  fetchTasks();
}

async function toggleTask(id, currentStatus) {
  const newStatus = currentStatus === "pending" ? "completed" : "pending";
  await fetch(`${API_URL}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  fetchTasks();
}

// Run the safety routing check when script runs
checkAuth();
