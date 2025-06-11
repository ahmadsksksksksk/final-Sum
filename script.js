// === AUTH ===
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login successful!");
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert("Login error: " + error.message);
    });
}

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Sign up successful!");
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert("Signup error: " + error.message);
    });
}

function logout() {
  firebase.auth().signOut().then(() => {
    alert("Logged out!");
    location.reload();
  });
}

firebase.auth().onAuthStateChanged((user) => {
  const userStatus = document.getElementById("user-status");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    userStatus.textContent = "Hi, " + user.email;
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    userStatus.textContent = "Hi,";
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});

// === SUMMARIZER FUNCTION ===
document.getElementById("summarizeForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const text = document.getElementById("inputText").value;
  const minLength = parseInt(document.getElementById("minLength").value);
  const maxLength = parseInt(document.getElementById("maxLength").value);
  const reference = document.getElementById("referenceText").value;
  const output = document.getElementById("output");

  output.innerHTML = "<em>⏳ Summarizing...</em>";

  try {
    const response = await fetch("http://127.0.0.1:5000/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        min_length: minLength,
        max_length: maxLength,
        reference: reference
      })
    });

    const data = await response.json();

    let formattedSummary = data.summary
      .split(". ")
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => "• " + s + (s.endsWith(".") ? "" : "."))
      .join("<br>");

    let rougeInfo = "";
    if (data.rouge1 !== undefined) {
      rougeInfo = `
        <div class="rouge-scores">
          <strong>ROUGE-1:</strong> ${data.rouge1}%<br>
          <strong>ROUGE-L:</strong> ${data.rougeL}%
        </div>
      `;
    }

    output.innerHTML = `
      <div class="summary-box">
        ${formattedSummary}
      </div>
      ${rougeInfo}
    `;

    saveToHistory(text, data.summary, data.rouge1 || "-", data.rougeL || "-");

  } catch (error) {
    output.innerHTML = "❌ Error: " + error;
  }
});

// === HISTORY FUNCTIONS ===
function saveToHistory(text, summary, rouge1, rougeL) {
  const history = JSON.parse(localStorage.getItem("summarizerHistory") || "[]");

  const newEntry = {
    time: new Date().toLocaleString(),
    input: text,
    summary,
    rouge1,
    rougeL
  };

  history.unshift(newEntry);
  localStorage.setItem("summarizerHistory", JSON.stringify(history));
  displayHistory();
}

function displayHistory() {
  const historyContainer = document.getElementById("history");
  if (!historyContainer) return;

  const history = JSON.parse(localStorage.getItem("summarizerHistory") || "[]");

  if (history.length === 0) {
    historyContainer.innerHTML = "<p>No history yet.</p>";
    return;
  }

  historyContainer.innerHTML = history.map(entry => `
    <div class="history-item">
      <div class="history-time">${entry.time}</div>
      <div class="history-summary"><strong>Summary:</strong><br>${entry.summary.replace(/\. /g, ".<br>")}</div>
      <div class="history-rouge">ROUGE-1: ${entry.rouge1}% | ROUGE-L: ${entry.rougeL}%</div>
    </div>
  `).join("<hr>");
}

document.addEventListener("DOMContentLoaded", displayHistory);
