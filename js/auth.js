const API_BASE = window.AUTH_API_BASE;

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Invalid credentials");
        }
        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", username);
        window.location.href = "dashboard.html";
    } catch (err) {
        document.getElementById("error").textContent = err.message;
    }
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Registration failed");
        }
        alert("Registration successful! Please log in.");
        localStorage.setItem("username", username);
        showLogin();
    } catch (err) {
        document.getElementById("error").textContent = err.message;
    }
});

function showLogin() {
    document.getElementById("login-form").style.display = "block";
    document.getElementById("register-form").style.display = "none";
    document.getElementById("error").textContent = "";
}

function showRegister() {
    document.getElementById("login-form").style.display = "none";
    document.getElementById("register-form").style.display = "block";
    document.getElementById("error").textContent = "";
}
