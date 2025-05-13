// Connect to Node.js backend (change to production domain/IP when needed)
console.log("Renderer script loaded");

const socket = io("http://127.0.0.1:5000");

let currentUser = "";
let currentChatType = "private";
let currentTarget = "";

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    showMessage("Username and password are required.");
    return;
  }

  alert("Sending login request...");

  fetch("http://127.0.0.1:5000/auth/login", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Login successful");
        startChatSession(username);
      } else {
        showMessage("Login failed: " + (data.message || "Unknown error"));
      }
    })
    .catch(err => {
      console.error("Login error:", err);
      showMessage("Login failed: could not connect to server.");
    });
}

function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    showMessage("Username and password are required.");
    return;
  }

  alert("Sending register request...");

  fetch("http://127.0.0.1:5000/auth/register", {  // ✅ fixed path
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
    .catch(err => {
      console.error("Register error:", err);
      showMessage("Registration failed: could not connect to server.");
    });
}


// ========== CHAT SESSION START ==========
function startChatSession(username) {
  currentUser = username;
  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
  document.getElementById("userDisplay").innerText = username;
  socket.emit("login", { username });

  loadUsersAndGroups().then(() => {
    const defaultRecipient = document.getElementById("recipientList").value;
    const defaultGroup = document.getElementById("groupList").value;

    if (currentChatType === "private" && defaultRecipient) {
      loadPrivateHistory(currentUser, defaultRecipient);
    } else if (defaultGroup) {
      loadGroupHistory(defaultGroup);
    }
  });
}

// ========== GUEST LOGIN ==========
function continueAsGuest() {
  currentUser = "Guest" + Math.floor(Math.random() * 1000);
  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
  document.getElementById("userDisplay").innerText = currentUser;
  loadUsersAndGroups();
}

// ========== LOAD USERS AND GROUPS ==========
function loadUsersAndGroups() {
  return Promise.all([
    fetch("http://127.0.0.1:5000/users")
      .then(res => res.json())
      .then(users => {
        const recipientDropdown = document.getElementById("recipientList");
        recipientDropdown.innerHTML = "";
        users.forEach(user => {
          if (user !== currentUser) {
            const option = document.createElement("option");
            option.value = user;
            option.textContent = user;
            recipientDropdown.appendChild(option);
          }
        });
      }),

    fetch("http://127.0.0.1:5000/groups")
      .then(res => res.json())
      .then(groups => {
        const groupDropdown = document.getElementById("groupList");
        groupDropdown.innerHTML = "";
        groups.forEach(group => {
          const option = document.createElement("option");
          option.value = group;
          option.textContent = group;
          groupDropdown.appendChild(option);
        });
      })
  ]);
}

// ========== SWITCH CHAT MODE ==========
function toggleChatTarget() {
  const type = document.getElementById("chatType").value;
  currentChatType = type;

  if (type === "private") {
    document.getElementById("recipientList").style.display = "inline-block";
    document.getElementById("groupList").style.display = "none";
    const selectedUser = document.getElementById("recipientList").value;
    currentTarget = selectedUser;
    if (selectedUser) loadPrivateHistory(currentUser, selectedUser);
  } else {
    document.getElementById("recipientList").style.display = "none";
    document.getElementById("groupList").style.display = "inline-block";
    const selectedGroup = document.getElementById("groupList").value;
    currentTarget = selectedGroup;
    if (selectedGroup) loadGroupHistory(selectedGroup);
  }
}

// ========== SEND MESSAGE ==========
function sendMessage() {
  const message = document.getElementById("msgInput").value.trim();
  if (!message) return;

  if (currentChatType === "private") {
    const to = document.getElementById("recipientList").value;
    currentTarget = to;
    socket.emit("private_message", { from: currentUser, to, message });
    loadPrivateHistory(currentUser, to);
  } else {
    const group = document.getElementById("groupList").value;
    currentTarget = group;
    socket.emit("group_message", { from: currentUser, group, message });
    loadGroupHistory(group);
  }

  document.getElementById("msgInput").value = "";
}

// ========== HISTORY LOADING ==========
async function loadPrivateHistory(user1, user2) {
  const res = await fetch(`http://127.0.0.1:5000/history/private?user1=${user1}&user2=${user2}`);
  const messages = await res.json();
  displayHistory(messages);
}

async function loadGroupHistory(group) {
  const res = await fetch(`http://127.0.0.1:5000/history/group?group=${group}`);
  const messages = await res.json();
  displayHistory(messages);
}

function displayHistory(messages) {
  const container = document.getElementById("messages");
  container.innerHTML = "";
  messages.forEach(renderMessage);
}

// ========== RENDER MESSAGE ==========
function renderMessage(data) {
  const messagesDiv = document.getElementById("messages");
  const msgWrapper = document.createElement("div");
  msgWrapper.classList.add("message");
  const isSender = data.from === currentUser;
  msgWrapper.classList.add(isSender ? "sent" : "received");

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.innerText = data.from.charAt(0).toUpperCase();

  const msgContent = document.createElement("div");
  msgContent.classList.add("text");
  msgContent.innerText = (data.group ? `[${data.group}] ` : "") + `${data.from}: ${data.message}`;

  if (isSender) {
    msgWrapper.appendChild(msgContent);
    msgWrapper.appendChild(avatar);
  } else {
    msgWrapper.appendChild(avatar);
    msgWrapper.appendChild(msgContent);
  }

  messagesDiv.appendChild(msgWrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ========== USER STATUS ==========
function updateUserStatus(data) {
  const options = document.querySelectorAll("#recipientList option");
  options.forEach(opt => {
    if (opt.value === data.user) {
      opt.textContent = `${data.user} ${data.status === "online" ? "🟢" : "🔘"}`;
    }
  });
}

// ========== LOGOUT ==========
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

// ========== ALERT UTIL ==========
function showMessage(text) {
  alert(text);
}

// ========== SOCKET EVENTS ==========
socket.on("receive_message", renderMessage);
socket.on("user_status", updateUserStatus);
