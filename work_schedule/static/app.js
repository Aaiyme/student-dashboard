const API_URL = "https://student-dashboard-mtze.onrender.com";
let currentSubjectId = null;

function checkAuth() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "login.html";
  } else {
    fetchSubjects();
  }
}

function handleLogout() {
  localStorage.removeItem("authToken");
  window.location.href = "login.html";
}

async function fetchSubjects() {
  try {
    const response = await fetch(`${API_URL}/subjects`);
    if (!response.ok) throw new Error("Could not fetch subjects");
    const subjects = await response.json();
    const grid = document.getElementById("subjects-grid");
    grid.innerHTML = "";

    subjects.forEach((sub) => {
      grid.innerHTML += `
                <div class="card subject-card">
                    <div onclick="selectSubject(${sub.id}, '${sub.code} - ${sub.name}')" style="cursor:pointer; flex: 1;">
                        <span class="badge">${sub.code}</span>
                        <h3>${sub.name}</h3>
                        <p style="color:#ffb703; font-size:0.9em; font-weight:bold;">View Tasks ➔</p>
                    </div>
                    <button onclick="deleteSubject(${sub.id})" class="danger-btn compact-btn">Delete</button>
                </div>
            `;
    });
  } catch (err) {
    console.error("Error loading dashboard items:", err);
  }
}

async function addSubject() {
  const name = document.getElementById("sub-name-input").value;
  const code = document.getElementById("sub-code-input").value;
  if (!name || !code) {
    alert("Please enter both Subject Name and Course Code!");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    });

    if (!response.ok) throw new Error();

    document.getElementById("sub-name-input").value = "";
    document.getElementById("sub-code-input").value = "";
    fetchSubjects();
  } catch (err) {
    alert(
      "Failed to create subject. Ensure your Render backend server is fully awake!",
    );
  }
}

async function deleteSubject(id) {
  if (
    !confirm(
      "Are you sure? Removing this subject will delete all related tasks!",
    )
  )
    return;
  try {
    await fetch(`${API_URL}/subjects/${id}`, { method: "DELETE" });
    fetchSubjects();
  } catch (err) {
    console.error("Delete failed:", err);
  }
}

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

async function fetchTasks() {
  if (!currentSubjectId) return;
  try {
    const response = await fetch(
      `${API_URL}/subjects/${currentSubjectId}/tasks`,
    );
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
                        ${isComp ? "Reopen" : "Mark Done"}
                    </button>
                </div>
            `;
    });
  } catch (err) {
    console.error("Error rendering task grids:", err);
  }
}

async function addTask() {
  const title = document.getElementById("task-title-input").value;
  if (!title || !currentSubjectId) return;

  try {
    await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, subject_id: currentSubjectId }),
    });

    document.getElementById("task-title-input").value = "";
    fetchTasks();
  } catch (err) {
    console.error("Add task failed:", err);
  }
}

async function toggleTask(id, currentStatus) {
  const newStatus = currentStatus === "pending" ? "completed" : "pending";
  try {
    await fetch(`${API_URL}/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  } catch (err) {
    console.error("Status toggle error:", err);
  }
}

checkAuth();
