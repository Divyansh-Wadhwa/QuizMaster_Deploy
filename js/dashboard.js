// Host Quiz and Join Quiz button handlers

// Hide quiz list by default
document.addEventListener("DOMContentLoaded", function () {
    // document.getElementById("quiz-list").style.display = "none";
    // document.getElementById("quiz-list-title").style.display = "none";
    document.getElementById("join-quiz-section").style.display = "none";

    document.getElementById("host-quiz-btn").onclick = function () {
        window.location.href = "host.html";
    };
    document.getElementById("join-quiz-btn").onclick = function () {
        document.getElementById("join-quiz-section").style.display = "block";
    };
    document.getElementById("published-quizzes-btn").onclick = function () {
        window.location.href = "admin.html";
    };

    // Enter quiz by pressing Enter or clicking button
    document.getElementById("quiz-id-input").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            joinQuizById();
        }
    });
    document.getElementById("enter-quiz-btn").onclick = joinQuizById;
});

function joinQuizById() {
    const quizId = document.getElementById("quiz-id-input").value.trim();
    if (!quizId) {
        alert("Please enter a Quiz ID.");
        return;
    }
    localStorage.setItem("currentQuizId", quizId);
    window.location.href = "quiz.html";
}
const API_BASE = window.QUESTION_API_BASE;

const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "index.html";
}

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
};

async function fetchQuizzes() {
    try {
        const res = await fetch(`${API_BASE}/quiz/all`, { headers });
        if (!res.ok) throw new Error("Failed to fetch quizzes");

        const quizzes = await res.json();
        renderQuizzes(quizzes);
    } catch (err) {
        document.getElementById("quiz-list").innerHTML = `<p>${err.message}</p>`;
    }
}

function renderQuizzes(quizzes) {
    const container = document.getElementById("published-quizzes-list");
    container.innerHTML = "";
    if (!quizzes || quizzes.length === 0) {
        container.innerHTML = "<li style='color:#ffe066;padding:12px 0;'>No quizzes available.</li>";
        return;
    }
    quizzes.forEach((quiz) => {
        const quizName = quiz.name || quiz.title || quiz.quizName || quiz || 'Quiz';
        const quizId = quiz.id || quiz.quizId || quiz._id || quizName;
        const li = document.createElement("li");
        li.style = "background:rgba(34,40,49,0.92);border-radius:12px;padding:18px 22px;margin-bottom:14px;box-shadow:0 2px 12px #00f2fe22;display:flex;align-items:center;justify-content:space-between;gap:12px;";
        li.innerHTML = `
            <span style='font-weight:700;'>${quizName}</span>
            <span>
                <button class='dashboard-btn' style='padding:8px 18px;width:auto;font-size:1rem;margin-right:8px;' onclick="viewQuizAdmin('${quizId}')">View</button>
                <button class='dashboard-btn' style='padding:8px 18px;width:auto;font-size:1rem;' onclick="joinQuizByIdFromList('${quizId}')">Start Quiz</button>
            </span>
        `;
        container.appendChild(li);
    });
}

function joinQuizByIdFromList(quizId) {
    document.getElementById('quiz-id-input').value = quizId;
    joinQuizById();
}

function viewQuizAdmin(quizId) {
    window.location.href = `admin.html?quizId=${encodeURIComponent(quizId)}`;
}

function startQuiz(quizId) {
    localStorage.setItem("currentQuizId", quizId);
    window.location.href = "quiz.html";
}

function logout() {
    console.log('[Logout] Dashboard logout initiated');
    
    // Stop heartbeat
    if (window.stopHeartbeat) {
        window.stopHeartbeat();
    }
    
    // Call logout endpoint
    const username = localStorage.getItem('username');
    console.log('[Logout] Username:', username);
    
    if (username) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/logout`, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        try {
            const payload = JSON.stringify({ username: username });
            console.log('[Logout] Sending:', payload);
            xhr.send(payload);
            console.log('[Logout] Response:', xhr.status, xhr.responseText);
        } catch (err) {
            console.error('[Logout] Failed:', err);
        }
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "index.html";
}

// On page load, fetch quizzes
if (document.getElementById('published-quizzes-list')) fetchQuizzes();


