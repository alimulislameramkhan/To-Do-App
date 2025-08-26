document.addEventListener('DOMContentLoaded', () => {
  const taskInput = document.getElementById('taskInput');
  const categoryInput = document.getElementById('categoryInput');
  const dueDateInput = document.getElementById('dueDateInput');
  const priorityInput = document.getElementById('priorityInput');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskList = document.getElementById('taskList');
  const searchInput = document.getElementById('searchInput');
  const filterInput = document.getElementById('filterInput');
  const sortInput = document.getElementById('sortInput');
  const clearCompletedBtn = document.getElementById('clearCompletedBtn');
  const themeToggle = document.getElementById('themeToggle');

  let tasks = [];
  let isDarkMode = localStorage.getItem('theme') === 'dark';

  const API_URL = "http://localhost:5000/api/tasks";

  const applyTheme = () => {
    document.body.classList.toggle('dark', isDarkMode);
    themeToggle.innerHTML = isDarkMode
      ? '<i class="fas fa-sun text-lg"></i>'
      : '<i class="fas fa-moon text-lg"></i>';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  };
  applyTheme();

  const fetchTasks = async () => {
    try {
      const res = await fetch(API_URL);
      tasks = await res.json();
      renderTasks();
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const getCountdown = (dueDate) => {
    if (!dueDate) return '';
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff > 1) return `Due in ${diff} days`;
    if (diff === 1) return 'Due Tomorrow';
    if (diff === 0) return 'Due Today';
    if (diff < 0) return `Overdue by ${Math.abs(diff)} days`;
    return '';
  };

  const renderTasks = () => {
    taskList.innerHTML = '';
    let filtered = tasks.filter(task => {
      const matchSearch = task.text.toLowerCase().includes(searchInput.value.toLowerCase());
      const matchFilter = filterInput.value === 'All' ||
        (filterInput.value === 'Completed' && task.completed) ||
        (filterInput.value === 'Pending' && !task.completed);
      return matchSearch && matchFilter;
    });

    filtered.sort((a, b) => {
      if (sortInput.value === 'DueDate') {
        return new Date(a.dueDate || '2100-01-01') - new Date(b.dueDate || '2100-01-01');
      }
      if (sortInput.value === 'Priority') {
        const priorityMap = { Low: 1, Medium: 2, High: 3 };
        return priorityMap[b.priority] - priorityMap[a.priority];
      }
      return 0;
    });

    filtered.forEach(task => {
      const li = document.createElement('li');
      const overdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
      li.className = `task-item ${task.completed ? 'completed' : ''} ${overdue ? 'overdue' : ''}`;

      const countdown = getCountdown(task.dueDate);
      li.innerHTML = `
        <div class="flex items-center gap-2">
          <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task as complete">
          <span class="task-text">${task.text}</span>
        </div>
        <div class="text-sm flex items-center flex-wrap gap-2">
          <span>${task.category}</span> 
          <span>${task.dueDate || ''}</span> 
          <span>${task.priority}</span>
          ${countdown ? `<span class="task-countdown ${overdue ? 'urgent' : ''}">${countdown}</span>` : ''}
          <button class="edit text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
          <button class="delete text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
        </div>
      `;

      li.querySelector('input').addEventListener('change', () => toggleTask(task.id));
      li.querySelector('.delete').addEventListener('click', () => deleteTask(task.id));
      li.querySelector('.edit').addEventListener('click', () => editTask(task.id, task.text));
      taskList.appendChild(li);
    });
  };

  const addTask = async () => {
    const taskText = taskInput.value.trim();
    if (!taskText) {
      alert("Please enter a task!");
      return;
    }
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: taskText,
        category: categoryInput.value,
        dueDate: dueDateInput.value,
        priority: priorityInput.value
      })
    });
    taskInput.value = '';
    dueDateInput.value = '';
    fetchTasks();
  };

  const toggleTask = async (id) => {
    await fetch(`${API_URL}/${id}/toggle`, { method: "PUT" });
    fetchTasks();
  };

  const deleteTask = async (id) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchTasks();
    }
  };

  const editTask = async (id, oldText) => {
    const newText = prompt("Edit task:", oldText);
    if (newText && newText.trim()) {
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText.trim() })
      });
      fetchTasks();
    }
  };

  clearCompletedBtn.addEventListener('click', async () => {
    if (confirm("Clear all completed tasks?")) {
      await fetch(API_URL, { method: "DELETE" });
      fetchTasks();
    }
  });

  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
  searchInput.addEventListener('input', renderTasks);
  filterInput.addEventListener('change', renderTasks);
  sortInput.addEventListener('change', renderTasks);
  themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    applyTheme();
  });

  fetchTasks();
});

// ===== Premium Hero Text Animation =====
(function initAnimatedHero() {
  const phraseEl = document.getElementById('animatedPhrase');
  const emojiEl  = document.getElementById('animatedEmoji');
  if (!phraseEl || !emojiEl) return;

  const items = [
    { text: "Plan your day",  emoji: "📅" },
    { text: "Stay focused",   emoji: "🎯" },
    { text: "Achieve more",   emoji: "🚀" },
    { text: "Organize life",  emoji: "✨" },
    { text: "Crush tasks",    emoji: "💪" }
  ];

  let idx = 0, char = 0, deleting = false;
  const TYPE_MS = 55;         // typing per character
  const DELETE_MS = 32;       // deleting per character
  const HOLD_MS = 1200;       // pause when fully typed
  const BETWEEN_MS = 220;     // pause just before starting next

  function setEmoji(emoji) {
    // exit current emoji if visible
    emojiEl.classList.remove('emoji-enter');
    emojiEl.classList.add('emoji-exit');
    // after exit, swap and enter
    setTimeout(() => {
      emojiEl.textContent = emoji;
      emojiEl.classList.remove('emoji-exit');
      emojiEl.classList.add('emoji-enter');
    }, 180);
  }

  function tick() {
    const { text, emoji } = items[idx];

    // when starting a new phrase from empty, set fresh emoji
    if (!deleting && char === 0) {
      setEmoji(emoji);
      phraseEl.classList.remove('phrase-exit');
      phraseEl.classList.add('phrase-enter');
    }

    if (!deleting) {
      // type forward
      phraseEl.textContent = text.slice(0, char + 1);
      char++;

      if (char === text.length) {
        // fully typed: hold, then start deleting with bounce-out
        setTimeout(() => {
          phraseEl.classList.remove('phrase-enter');
          phraseEl.classList.add('phrase-exit');
          deleting = true;
          // start deleting slightly after exit begins for overlap feel
          setTimeout(tick, 220);
        }, HOLD_MS);
        return;
      }

      setTimeout(tick, TYPE_MS);
    } else {
      // deleting backward
      phraseEl.textContent = text.slice(0, char - 1);
      char--;

      if (char === 0) {
        // move to next phrase
        deleting = false;
        phraseEl.classList.remove('phrase-exit');
        idx = (idx + 1) % items.length;
        setTimeout(tick, BETWEEN_MS);
        return;
      }

      setTimeout(tick, DELETE_MS);
    }
  }

  // Start!
  tick();
}
)();
// document.addEventListener("DOMContentLoaded", () => {
//   const heading = document.getElementById("animatedHeading");
//   const phrases = [
//     "Plan Smart, Live Better ✨",
//     "Your Day, Organized 📅",
//     "Track. Achieve. Repeat ✅"
//   ];
  
//   let index = 0;
  
//   function fadeText(newText) {
//     heading.style.opacity = 0;
//     setTimeout(() => {
//       heading.textContent = newText;
//       heading.style.opacity = 1;
//     }, 400);
//   }
  
//   fadeText(phrases[index]);
  
//   setInterval(() => {
//     index = (index + 1) % phrases.length;
//     fadeText(phrases[index]);
//   }, 3500);

//   // Floating particles
//   const canvas = document.getElementById("particlesCanvas");
//   const ctx = canvas.getContext("2d");
//   canvas.width = canvas.offsetWidth;
//   canvas.height = canvas.offsetHeight;
  
//   const particles = Array.from({length: 25}, () => ({
//     x: Math.random() * canvas.width,
//     y: Math.random() * canvas.height,
//     r: Math.random() * 2 + 1,
//     d: Math.random() * 0.5 + 0.2
//   }));

//   function drawParticles() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     particles.forEach(p => {
//       ctx.beginPath();
//       ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
//       ctx.fillStyle = "rgba(255,255,255,0.6)";
//       ctx.fill();
//       p.y += p.d;
//       if (p.y > canvas.height) {
//         p.y = -5;
//         p.x = Math.random() * canvas.width;
//       }
//     });
//     requestAnimationFrame(drawParticles);
//   }
  
//   drawParticles();
// });
document.addEventListener('mousemove', (e) => {
  const orbLayer = document.getElementById('parallaxOrbs');
  const moveX = (e.clientX / window.innerWidth - 0.5) * 20; // range -10px to 10px
  const moveY = (e.clientY / window.innerHeight - 0.5) * 20;
  
  orbLayer.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

// Optional: Reset position when mouse leaves window
document.addEventListener('mouseleave', () => {
  const orbLayer = document.getElementById('parallaxOrbs');
  orbLayer.style.transform = `translate(0px, 0px)`;
});



