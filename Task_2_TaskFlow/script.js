
"use strict";

// ==========================================
// 1. DOM ELEMENTS
// ==========================================

const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskDescription = document.getElementById("task-description");
const taskPriority = document.getElementById("task-priority");
const taskDueDate = document.getElementById("task-due-date");

const submitButton = document.getElementById("submit-button");
const cancelEditButton = document.getElementById("cancel-edit");

const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");

const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const priorityFilter = document.getElementById("priority-filter");

const totalTasks = document.getElementById("total-tasks");
const pendingTasks = document.getElementById("pending-tasks");
const completedTasks = document.getElementById("completed-tasks");

const clearCompletedButton = document.getElementById("clear-completed");
const exportTasksButton = document.getElementById("export-tasks");
const importTasksButton = document.getElementById("import-tasks");
const importFileInput = document.getElementById("import-file");

// ==========================================
// 2. APPLICATION STATE
// ==========================================

const STORAGE_KEY = "taskflow-tasks";

let tasks = [];

let editingTaskId = null;

// Load saved tasks safely
try {
  const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));

  if (Array.isArray(savedTasks)) {
    tasks = savedTasks.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string"
    );
  }
} catch (error) {
  console.error("Could not load saved tasks:", error);
}

// ==========================================
// 3. SAVE TASKS
// ==========================================

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Could not save tasks:", error);
    alert("Unable to save tasks. Check your browser storage.");
  }
}

// ==========================================
// 4. UPDATE STATISTICS
// ==========================================

function updateStatistics() {
  const completed = tasks.filter(task => task.completed).length;
  const pending = tasks.length - completed;

  totalTasks.textContent = tasks.length;
  pendingTasks.textContent = pending;
  completedTasks.textContent = completed;

  clearCompletedButton.hidden = completed === 0;
}

// ==========================================
// 5. DISPLAY TASKS
// ==========================================

function createTaskElement(task) {
  const card = document.createElement("article");

  card.className = `task-card priority-${task.priority}`;

  if (task.completed) {
    card.classList.add("completed");
  }

  const header = document.createElement("div");
  header.className = "task-card-header";

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const status = document.createElement("span");
  status.textContent = task.completed ? "Completed" : "Pending";

  header.append(title, status);

  const description = document.createElement("p");
  description.className = "task-description";
  description.textContent = task.description || "No description provided.";

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const priority = document.createElement("span");
  priority.textContent = `Priority: ${task.priority}`;

  const dueDate = document.createElement("span");
  dueDate.textContent = task.dueDate
    ? `Due: ${task.dueDate}`
    : "No due date";

  meta.append(priority, dueDate);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = "complete-button";
  completeButton.textContent = task.completed
    ? "Mark Pending"
    : "Complete";

  completeButton.addEventListener("click", () => {
    toggleTaskStatus(task.id);
  });

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "edit-button";
  editButton.textContent = "Edit";

  editButton.addEventListener("click", () => {
    editTask(task.id);
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", () => {
    deleteTask(task.id);
  });

  actions.append(completeButton, editButton, deleteButton);

  card.append(header, description, meta, actions);

  return card;
}

// ==========================================
// 6. RENDER TASKS
// ==========================================

function renderTasks() {
  taskList.replaceChildren();

  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedPriority = priorityFilter.value;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm) ||
      (task.description || "").toLowerCase().includes(searchTerm);

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "completed" && task.completed) ||
      (selectedStatus === "pending" && !task.completed);

    const matchesPriority =
      selectedPriority === "all" ||
      task.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  filteredTasks.forEach(task => {
    taskList.appendChild(createTaskElement(task));
  });

  emptyState.hidden = filteredTasks.length > 0;

  if (tasks.length === 0) {
    emptyState.querySelector("h3").textContent = "No tasks yet";
    emptyState.querySelector("p").textContent =
      "Add a new task to start organizing your work.";
  } else if (filteredTasks.length === 0) {
    emptyState.querySelector("h3").textContent = "No matching tasks";
    emptyState.querySelector("p").textContent =
      "Try changing your search or filters.";
  }

  updateStatistics();
}

// ==========================================
// 7. CREATE TASK
// ==========================================

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskTitle.value.trim();
  const description = taskDescription.value.trim();

  if (!title) {
    alert("Please enter a task title.");
    taskTitle.focus();
    return;
  }

  if (editingTaskId) {
    updateTask(editingTaskId, {
      title,
      description,
      priority: taskPriority.value,
      dueDate: taskDueDate.value
    });

    return;
  }

  const newTask = {
    id: crypto.randomUUID(),
    title,
    description,
    priority: taskPriority.value,
    dueDate: taskDueDate.value,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);

  saveTasks();
  taskForm.reset();

  taskPriority.value = "medium";

  renderTasks();
});

// ==========================================
// 8. EDIT TASK
// ==========================================

function editTask(id) {
  const task = tasks.find(item => item.id === id);

  if (!task) {
    return;
  }

  editingTaskId = id;

  taskTitle.value = task.title;
  taskDescription.value = task.description || "";
  taskPriority.value = task.priority;
  taskDueDate.value = task.dueDate || "";

  submitButton.textContent = "Update Task";
  cancelEditButton.hidden = false;

  document.getElementById("form-heading").textContent = "Edit Task";

  taskTitle.focus();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function updateTask(id, updatedData) {
  tasks = tasks.map(task => {
    if (task.id === id) {
      return {
        ...task,
        ...updatedData
      };
    }

    return task;
  });

  saveTasks();
  resetForm();
  renderTasks();
}

// ==========================================
// 9. DELETE TASK
// ==========================================

function deleteTask(id) {
  const confirmed = confirm("Are you sure you want to delete this task?");

  if (!confirmed) {
    return;
  }

  tasks = tasks.filter(task => task.id !== id);

  if (editingTaskId === id) {
    resetForm();
  }

  saveTasks();
  renderTasks();
}

// ==========================================
// 10. TOGGLE TASK STATUS
// ==========================================

function toggleTaskStatus(id) {
  tasks = tasks.map(task => {
    if (task.id === id) {
      return {
        ...task,
        completed: !task.completed
      };
    }

    return task;
  });

  saveTasks();
  renderTasks();
}

// ==========================================
// 11. CLEAR COMPLETED TASKS
// ==========================================

clearCompletedButton.addEventListener("click", () => {
  const confirmed = confirm("Delete all completed tasks?");

  if (!confirmed) {
    return;
  }

  tasks = tasks.filter(task => !task.completed);

  saveTasks();
  renderTasks();
});

// ==========================================
// 12. RESET FORM
// ==========================================

function resetForm() {
  taskForm.reset();

  editingTaskId = null;

  submitButton.textContent = "Add Task";
  cancelEditButton.hidden = true;

  taskPriority.value = "medium";

  document.getElementById("form-heading").textContent =
    "Add a New Task";
}

cancelEditButton.addEventListener("click", resetForm);

// ==========================================
// 13. SEARCH AND FILTER
// ==========================================

searchInput.addEventListener("input", renderTasks);

statusFilter.addEventListener("change", renderTasks);

priorityFilter.addEventListener("change", renderTasks);

// ==========================================
// ==========================================
// 14. EXPORT AND IMPORT TASK BACKUPS
// ==========================================

function exportTasks() {
  const backup = {
    app: "TaskFlow",
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: tasks
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function importTasks(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result);
      const importedTasks = Array.isArray(backup)
        ? backup
        : backup.tasks;

      if (!Array.isArray(importedTasks)) {
        throw new Error("The backup does not contain a task list.");
      }

      const validPriorities = ["low", "medium", "high"];
      const ids = new Set();

      const validTasks = importedTasks.every(task => {
        if (
          !task ||
          typeof task.id !== "string" ||
          !task.id.trim() ||
          typeof task.title !== "string" ||
          !task.title.trim() ||
          typeof task.completed !== "boolean" ||
          !validPriorities.includes(task.priority) ||
          typeof task.description !== "string" ||
          typeof task.dueDate !== "string" ||
          typeof task.createdAt !== "string" ||
          ids.has(task.id)
        ) {
          return false;
        }

        ids.add(task.id);
        return true;
      });

      if (!validTasks) {
        throw new Error("One or more tasks have invalid data.");
      }

      if (!confirm(
        `Import ${importedTasks.length} task(s)? This will replace your current tasks.`
      )) {
        return;
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(importedTasks)
      );

      tasks = importedTasks;
      resetForm();
      renderTasks();

      alert("Tasks imported successfully!");
    } catch (error) {
      console.error("Import failed:", error);
      alert(`Import failed: ${error.message}`);
    } finally {
      importFileInput.value = "";
    }
  };

  reader.onerror = () => {
    alert("Could not read the selected backup file.");
    importFileInput.value = "";
  };

  reader.readAsText(file);
}

exportTasksButton.addEventListener("click", exportTasks);

importTasksButton.addEventListener("click", () => {
  importFileInput.click();
});

importFileInput.addEventListener("change", () => {
  const file = importFileInput.files[0];

  if (file) {
    importTasks(file);
  }
});

// 14. INITIALIZE APPLICATION
// ==========================================

renderTasks();