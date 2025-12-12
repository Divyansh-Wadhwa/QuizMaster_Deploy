function goToDashboard() {
    window.location.href = "dashboard.html";
}

// If result came from API response
const result = JSON.parse(localStorage.getItem("lastResult"));

function getMessage(percentage) {
    if (percentage >= 80) return "Congratulations!";
    if (percentage >= 50) return "Great!";
    if (percentage >= 20) return "Good!";
    return "Better luck next time";
}

if (!result) {
    document.querySelector(".result-box").innerHTML = "<p>No result data available.</p>";
} else {
    const score = result.score || 0;
    const total = result.totalQuestions || 0;
    const correct = result.correctAnswers || 0;
    document.getElementById("score").textContent = `${score}/${total}`;
    document.getElementById("total").textContent = total;
    document.getElementById("correct").textContent = correct;
    let percent = total > 0 ? (score / total) * 100 : 0;
    let message = getMessage(percent);
    // Set the message in the .celebrate element if present
    const celebrate = document.querySelector('.celebrate');
    if (celebrate) celebrate.textContent = message;
}
