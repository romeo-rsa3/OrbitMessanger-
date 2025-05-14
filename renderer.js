// renderer.js (Improved with avatar initials, timestamps, and live chat display)

console.log("Renderer script loaded");

const API_BASE = "https://orbitmessanger-backend.onrender.com";
const socket = io(API_BASE);

let currentUser = "";
let currentChatType = "private";
let currentTarget = "";

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password)
    return alert("Username and password are required.");

  fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then((res) => res.json())
    .then((data) => {
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

  if (!username || !password)
    return alert("Username and password are required.");

  fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then((res) => res.json())
    .then((data) => {
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
    const defaultRecipient = document.getElementById("recipientList").value;
    if (defaultRecipient) {
      currentTarget = defaultRecipient;
      loadPrivateHistory(currentUser, currentTarget);
    }
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
      .then((res) => res.json())
      .then((users) => {
        const dropdown = document.getElementById("recipientList");
        dropdown.innerHTML = "";
        users.forEach((user) => {
          if (user !== currentUser) {
            const option = document.createElement("option");
            option.value = user;
            option.textContent = user;
            dropdown.appendChild(option);
          }
        });
      }),

    fetch(`${API_BASE}/groups`)
      .then((res) => res.json())
      .then((groups) => {
        const dropdown = document.getElementById("groupList");
        dropdown.innerHTML = "";
        groups.forEach((group) => {
          const option = document.createElement("option");
          option.value = group;
          option.textContent = group;
          dropdown.appendChild(option);
        });
      })
  ]);
}

function clearMessages() {
  document.getElementById("messages").innerHTML = "";
}

function loadPrivateHistory(user1, user2) {
  clearMessages();
  fetch(`${API_BASE}/history/private?user1=${user1}&user2=${user2}`)
    .then((res) => res.json())
    .then((messages) => {
      messages.forEach((msg) => renderMessage(msg));
    });
}

function loadGroupHistory(group) {
  clearMessages();
  fetch(`${API_BASE}/history/group?group=${group}`)
    .then((res) => res.json())
    .then((messages) => {
      messages.forEach((msg) => renderMessage(msg));
    });
}

function toggleChatTarget() {
  const type = document.getElementById("chatType").value;
  currentChatType = type;

  if (type === "private") {
    document.getElementById("recipientList").style.display = "inline-block";
    document.getElementById("groupList").style.display = "none";
    currentTarget = document.getElementById("recipientList").value;
    if (currentTarget) loadPrivateHistory(currentUser, currentTarget);
  } else {
    document.getElementById("recipientList").style.display = "none";
    document.getElementById("groupList").style.display = "inline-block";
    currentTarget = document.getElementById("groupList").value;
    if (currentTarget) loadGroupHistory(currentTarget);
  }
}

function sendMessage() {
  const message = document.getElementById("msgInput").value.trim();
  if (!message) return;

  const messageData = {
    from: currentUser,
    message,
    timestamp: new Date().toISOString()
  };

  if (currentChatType === "private") {
    messageData.to = currentTarget;
    socket.emit("private_message", messageData);
  } else {
    messageData.group = currentTarget;
    socket.emit("group_message", messageData);
  }

  renderMessage(messageData); // Show sent message instantly
  document.getElementById("msgInput").value = "";
}

function getInitials(name) {
  return name.slice(0, 2).toUpperCase();
}

function renderMessage({ from, message, timestamp }) {
  const container = document.getElementById("messages");
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
  const div = document.createElement("div");
  div.className =
    from === currentUser ? "message-entry sent" : "message-entry received";

  div.innerHTML = `
    <div class="avatar">${getInitials(from)}</div>
    <div class="message-bubble">
      <div class="sender">${from}</div>
      <div class="text">${message}</div>
      <div class="timestamp">${time}</div>
    </div>
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

socket.on("receive_message", (msg) => {
  const isRelevant =
    (msg.type === "private" &&
      ((msg.from === currentUser && msg.to === currentTarget) ||
        (msg.from === currentTarget && msg.to === currentUser))) ||
    (msg.type === "group" && msg.group === currentTarget);

  if (isRelevant) {
    renderMessage(msg);
  }
});

document
  .getElementById("chatType")
  .addEventListener("change", toggleChatTarget);
document.getElementById("recipientList").addEventListener("change", () => {
  currentTarget = document.getElementById("recipientList").value;
  loadPrivateHistory(currentUser, currentTarget);
});
document.getElementById("groupList").addEventListener("change", () => {
  currentTarget = document.getElementById("groupList").value;
  loadGroupHistory(currentTarget);
});
// Logout functionality
function logout() {
  currentUser = "";
  currentTarget = "";
  document.getElementById("msgInput").value = "";
  clearMessages();
  document.getElementById("chat").style.display = "none";
  document.getElementById("login").style.display = "block";
}

// Attach the logout function to the button
document.getElementById("logoutBtn").addEventListener("click", logout);
