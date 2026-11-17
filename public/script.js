(() => {
  const STORAGE_KEY = "taskflow.tasks.v1";
  const priorityLabels = { low: "Basse", medium: "Moyenne", high: "Haute" };
  const elements = {
    list: document.querySelector("#task-list"),
    dialog: document.querySelector("#task-dialog"),
    form: document.querySelector("#task-form"),
    title: document.querySelector("#task-title"),
    description: document.querySelector("#task-description"),
    priority: document.querySelector("#task-priority"),
    dueDate: document.querySelector("#task-due-date"),
    dialogTitle: document.querySelector("#dialog-title"),
    search: document.querySelector("#task-search"),
    toast: document.querySelector("#toast"),
  };
  let shouldSaveStarterTasks = false;
  let tasks = loadTasks();
  let activeFilter = "all";
  let editingId = null;
  let toastTimer;
  if (shouldSaveStarterTasks) saveTasks();

  function createStarterTasks() {
    const createdAt = new Date().toISOString();
    return [
      {
        id: window.crypto.randomUUID(),
        title: "Planifier ma semaine",
        description: "Noter les priorités et les rendez-vous importants.",
        priority: "high",
        dueDate: "",
        completed: false,
        createdAt,
      },
      {
        id: window.crypto.randomUUID(),
        title: "Répondre aux e-mails importants",
        description: "Traiter les messages qui nécessitent une réponse.",
        priority: "medium",
        dueDate: "",
        completed: false,
        createdAt,
      },
      {
        id: window.crypto.randomUUID(),
        title: "Ranger mon espace de travail",
        description: "Faire un peu de place pour mieux se concentrer.",
        priority: "low",
        dueDate: "",
        completed: false,
        createdAt,
      },
    ];
  }

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        shouldSaveStarterTasks = true;
        return createStarterTasks();
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) throw new Error("Les données enregistrées ne sont pas une liste.");
      return parsed.filter((task) =>
        task && typeof task.id === "string" && typeof task.title === "string"
        && typeof task.completed === "boolean"
        && ["low", "medium", "high"].includes(task.priority),
      );
    } catch (error) {
      console.error("Impossible de charger les tâches sauvegardées.", error);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error("Impossible de sauvegarder les tâches.", error);
      showToast("La sauvegarde a échoué. Vérifiez l’espace disponible du navigateur.");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-").map(Number);
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" })
      .format(new Date(year, month - 1, day));
  }

  function dateIsPast(dateString) {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(`${dateString}T00:00:00`);
    return dueDate < today;
  }

  function createIcon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    if (name === "check") path.setAttribute("d", "m5 12 4 4L19 6");
    else path.setAttribute("d", "M8 3v3m8-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z");
    svg.append(path);
    return svg;
  }

  function createTaskCard(task) {
    const card = document.createElement("article");
    card.className = `task-card${task.completed ? " is-completed" : ""}`;

    const completeButton = document.createElement("button");
    completeButton.className = "task-check";
    completeButton.type = "button";
    completeButton.setAttribute("aria-label", task.completed ? "Marquer comme en cours" : "Marquer comme terminée");
    completeButton.setAttribute("aria-pressed", String(task.completed));
    if (task.completed) completeButton.append(createIcon("check"));
    completeButton.addEventListener("click", () => toggleTask(task.id));

    const content = document.createElement("div");
    content.className = "task-content";
    const titleRow = document.createElement("div");
    titleRow.className = "task-title-row";
    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;
    titleRow.append(title);
    content.append(titleRow);

    if (task.description) {
      const description = document.createElement("p");
      description.className = "task-description";
      description.textContent = task.description;
      content.append(description);
    }

    const meta = document.createElement("div");
    meta.className = "task-meta";
    const priority = document.createElement("span");
    priority.className = `priority priority-${task.priority}`;
    priority.textContent = priorityLabels[task.priority];
    meta.append(priority);
    if (task.dueDate) {
      const dueDate = document.createElement("span");
      dueDate.className = `due-date${!task.completed && dateIsPast(task.dueDate) ? " is-overdue" : ""}`;
      dueDate.append(createIcon("calendar"), document.createTextNode(formatDate(task.dueDate)));
      meta.append(dueDate);
    }
    content.append(meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const editButton = document.createElement("button");
    editButton.className = "icon-button";
    editButton.type = "button";
    editButton.setAttribute("aria-label", `Modifier ${task.title}`);
    editButton.textContent = "✎";
    editButton.addEventListener("click", () => openEditDialog(task));
    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-button delete-button";
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Supprimer ${task.title}`);
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => deleteTask(task.id));
    actions.append(editButton, deleteButton);
    card.append(completeButton, content, actions);
    return card;
  }

  function renderEmptyState() {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const icon = document.createElement("div");
    icon.className = "empty-illustration";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = elements.search.value.trim() ? "⌕" : "✳";
    const heading = document.createElement("h3");
    const message = document.createElement("p");
    const hasSearch = Boolean(elements.search.value.trim());

    if (hasSearch) {
      heading.textContent = "Aucun résultat";
      message.textContent = "Essayez un autre mot-clé pour retrouver vos tâches.";
    } else if (activeFilter === "completed") {
      heading.textContent = "Rien de terminé pour le moment";
      message.textContent = "Vos tâches accomplies apparaîtront ici.";
    } else if (activeFilter === "active" || tasks.length) {
      heading.textContent = "Tout est à jour !";
      message.textContent = "Aucune tâche en cours. Profitez de ce moment.";
    } else {
      heading.textContent = "Une page toute neuve";
      message.textContent = "Ajoutez votre première tâche et lancez-vous.";
      const addButton = document.createElement("button");
      addButton.className = "primary-button";
      addButton.type = "button";
      addButton.textContent = "+ Ajouter une tâche";
      addButton.addEventListener("click", openCreateDialog);
      empty.append(icon, heading, message, addButton);
      elements.list.append(empty);
      return;
    }
    empty.append(icon, heading, message);
    elements.list.append(empty);
  }

  function render() {
    const query = elements.search.value.trim().toLocaleLowerCase("fr");
    const filtered = tasks.filter((task) => {
      const matchesFilter = activeFilter === "all"
        || (activeFilter === "active" && !task.completed)
        || (activeFilter === "completed" && task.completed);
      const searchableText = `${task.title} ${task.description || ""}`.toLocaleLowerCase("fr");
      return matchesFilter && searchableText.includes(query);
    });

    elements.list.replaceChildren();
    if (filtered.length) filtered.forEach((task) => elements.list.append(createTaskCard(task)));
    else renderEmptyState();

    const completed = tasks.filter((task) => task.completed).length;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    document.querySelector("#total-stat").textContent = String(tasks.length);
    document.querySelector("#done-stat").textContent = String(completed);
    document.querySelector("#progress-stat").textContent = String(progress);
    document.querySelector("#progress-bar").style.width = `${progress}%`;
    document.querySelector("#heading-count").textContent = String(filtered.length);
    document.querySelector("#all-count").textContent = String(tasks.length);
    document.querySelector("#active-count").textContent = String(tasks.length - completed);
    document.querySelector("#completed-count").textContent = String(completed);
  }

  function syncFilterButtons(filter) {
    activeFilter = filter;
    document.querySelectorAll("[data-filter]").forEach((button) => {
      const selected = button.dataset.filter === filter;
      button.classList.toggle("is-active", selected && button.classList.contains("nav-item"));
      button.classList.toggle("is-selected", selected && button.classList.contains("filter-chip"));
      button.setAttribute("aria-pressed", String(selected));
    });
    render();
  }

  function openCreateDialog() {
    editingId = null;
    elements.form.reset();
    elements.priority.value = "medium";
    elements.dialogTitle.textContent = "Nouvelle tâche";
    elements.dialog.showModal();
    elements.title.focus();
  }

  function openEditDialog(task) {
    editingId = task.id;
    elements.title.value = task.title;
    elements.description.value = task.description || "";
    elements.priority.value = task.priority;
    elements.dueDate.value = task.dueDate || "";
    elements.dialogTitle.textContent = "Modifier la tâche";
    elements.dialog.showModal();
    elements.title.focus();
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
  }

  function toggleTask(id) {
    tasks = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
    saveTasks();
    render();
    showToast(tasks.find((task) => task.id === id).completed ? "Tâche terminée. Bravo !" : "Tâche remise en cours.");
  }

  function deleteTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    saveTasks();
    render();
    showToast("Tâche supprimée.");
  }

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => syncFilterButtons(button.dataset.filter));
  });
  document.querySelector("#open-task-form").addEventListener("click", openCreateDialog);
  document.querySelector(".dialog-close").addEventListener("click", () => elements.dialog.close());
  document.querySelector(".dialog-cancel").addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) elements.dialog.close();
  });
  elements.search.addEventListener("input", render);
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !elements.dialog.open && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      elements.search.focus();
    }
  });
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = elements.title.value.trim();
    if (!title) {
      elements.title.focus();
      return;
    }

    if (editingId) {
      tasks = tasks.map((task) => task.id === editingId
        ? { ...task, title, description: elements.description.value.trim(), priority: elements.priority.value, dueDate: elements.dueDate.value }
        : task);
      showToast("Modifications enregistrées.");
    } else {
      tasks.unshift({
        id: window.crypto.randomUUID(),
        title,
        description: elements.description.value.trim(),
        priority: elements.priority.value,
        dueDate: elements.dueDate.value,
        completed: false,
        createdAt: new Date().toISOString(),
      });
      showToast("Nouvelle tâche ajoutée.");
    }
    saveTasks();
    render();
    elements.dialog.close();
  });

  document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  }).format(new Date());
  render();
})();
