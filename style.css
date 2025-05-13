// renderer.js
console.log("Renderer script loaded");

const API_BASE = "https://orbitmessanger-backend.onrender.com";
const socket = io(API_BASE);

let currentUser = "";
let currentChatType = "private";
let currentTarget = "";

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return alert("Username and password are required.");

  fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      startChatSession(username);
    } else {
      alert("Login failed: " + (data.message || "Unknown error"));
    }
  })
  .catch(() => alert("Login failed: could not connect to server."));
}

function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return alert("Username and password are required.");

  fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("Registration successful. You can now log in.");
    } else {
      alert("Registration failed: " + data.message);
    }
  })
  .catch(() => alert("Registration failed: could not connect to server."));
}

function startChatSession(username) {
  currentUser = username;
  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
  document.getElementById("userDisplay").innerText = username;
  socket.emit("login", { username });

loadUsersAndGroups().then(() => {
  setTimeout(() => {
    const defaultRecipient = document.getElementById("recipientList").value;
    if (defaultRecipient) {
      currentTarget = defaultRecipient;
      loadPrivateHistory(currentUser, defaultRecipient);
    }
  }, 300); // Give time for dropdown to populate
});

}

function continueAsGuest() {
  currentUser = "Guest" + Math.floor(Math.random() * 1000);
  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
  document.getElementById("userDisplay").innerText = currentUser;
  loadUsersAndGroups();
}

function loadUsersAndGroups() {
  return Promise.all([
    fetch(`${API_BASE}/users`)
      .then(res => res.json())
      .then(users => {
        const dropdown = document.getElementById("recipientList");
        dropdown.innerHTML = "";
        users.forEach(user => {
          if (user !== currentUser) {
            const option = document.createElement("option");
            option.value = user;
            option.textContent = user;
            dropdown.appendChild(option);
          }
        });
      }),

    fetch(`${API_BASE}/groups`)
      .then(res => res.json())
      .then(groups => {
        const dropdown = document.getElementById("groupList");
        dropdown.innerHTML = "";
        groups.forEach(group => {
          const option = document.createElement("option");
          option.value = group;
          option.textContent = group;
          dropdown.appendChild(option);
        });
      })
  ]);
}

function toggleChatTarget() {
  const type = document.getElementById("chatType").value;
  currentChatType = type;

  if (type === "private") {
    document.getElementById("recipientList").style.display = "inline-block";
    document.getElementById("groupList").style.display = "none";
    const target = document.getElementById("recipientList").value;
    currentTarget = target;
    if (target) loadPrivateHistory(currentUser, target);
  } else {
    document.getElementById("recipientList").style.display = "none";
    document.getElementById("groupList").style.display = "inline-block";
    const target = document.getElementById("groupList").value;
    currentTarget = target;
    if (target) loadGroupHistory(target);
  }
}

function sendMessage() {
  const message = document.getElementById("msgInput").value.trim();
  if (!message) return;

  if (currentChatType === "private") {
    socket.emit("private_message", { from: currentUser, to: currentTarget, message });
    loadPrivateHistory(currentUser, currentTarget);
  } else {
    socket.emit("group_message", { from: currentUser, group: currentTarget, message });
    loadGroupHistory(currentTarget);
  }

  document.getElementById("msgInput").value = "";
}

async function loadPrivateHistory(user1, user2) {
  const res = await fetch(`${API_BASE}/history/private?user1=${user1}&user2=${user2}`);
  const messages = await res.json();
  displayHistory(messages);
}

async function loadGroupHistory(group) {
  const res = await fetch(`${API_BASE}/history/group?group=${group}`);
  const messages = await res.json();
  displayHistory(messages);
}

function displayHistory(messages) {
  const container = document.getElementById("messages");
  container.innerHTML = "";
  messages.forEach(renderMessage);
  container.scrollTop = container.scrollHeight;
}

function renderMessage(data) {
  const container = document.getElementById("messages");
  const msgWrapper = document.createElement("div");
  msgWrapper.classList.add("message", data.from === currentUser ? "sent" : "received");

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.innerText = (data.from.split(" ").map(p => p[0]).join("").substring(0, 2) || "U").toUpperCase();

  const text = document.createElement("div");
  text.classList.add("text");
  text.innerText = `${data.from}: ${data.message}`;

  if (data.from === currentUser) {
    msgWrapper.appendChild(text);
    msgWrapper.appendChild(avatar);
  } else {
    msgWrapper.appendChild(avatar);
    msgWrapper.appendChild(text);
  }

  container.appendChild(msgWrapper);
}

function logout() {
  if (confirm("Are you sure you want to log out?")) {
    document.getElementById("chat").style.display = "none";
    document.getElementById("login").style.display = "block";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("msgInput").value = "";
    document.getElementById("messages").innerHTML = "";
    location.reload();
  }
}

socket.on("receive_message", renderMessage);
socket.on("user_status", updateUserStatus);

function updateUserStatus(data) {
  const options = document.querySelectorAll("#recipientList option");
  options.forEach(opt => {
    if (opt.value === data.user) {
      opt.textContent = `${data.user} ${data.status === "online" ? "🟢" : "🔘"}`;
    }
  });
}
