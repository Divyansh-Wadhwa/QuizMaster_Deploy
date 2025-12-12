// admin.js
const API_BASE = window.QUESTION_API_BASE;
const RESULT_API = window.RESULT_API_BASE;
const token = localStorage.getItem("token");
let username = "";

// Try to extract username from JWT
try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    if (tokenPayload && tokenPayload.sub) {
        username = tokenPayload.sub;
    }
} catch (e) { }

if (!token) {
    window.location.href = "index.html";
}

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
};


function getUsernameFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.username;
    } catch (e) {
        return null;
    }
}

async function fetchMyQuizzes() {
    const username = getUsernameFromToken();
    if (!username) {
        document.getElementById("admin-quiz-list").innerHTML = "<p>Could not determine user.</p>";
        return;
    }

    console.log('Fetching quizzes for user:', username); // Debug log

    try {
        // Try to get quizzes with metadata first
        const metadataRes = await fetch(`${API_BASE}/host/${username}/detailed`, { headers });
        if (metadataRes.ok) {
            const detailedQuizzes = await metadataRes.json();
            console.log('Detailed quizzes fetched:', detailedQuizzes); // Debug log
            renderAdminQuizzes(detailedQuizzes);
            return;
        } else {
            console.log('Detailed endpoint failed with status:', metadataRes.status); // Debug log
        }
    } catch (error) {
        console.log('Detailed quiz endpoint not available, falling back to basic method:', error);
    }

    // Fallback: Get quiz IDs and try to fetch quiz names
    const res = await fetch(`${API_BASE}/host/${username}`, { headers });
    if (!res.ok) {
        console.error('Failed to fetch quiz IDs. Status:', res.status);
        document.getElementById("admin-quiz-list").innerHTML = `
            <div style="text-align: center; color: #ff6b6b; padding: 20px;">
                <p>Failed to fetch quizzes. Status: ${res.status}</p>
                <p>Please check if you're logged in properly.</p>
            </div>
        `;
        return;
    }
    const quizIds = await res.json();

    console.log('Quiz IDs fetched:', quizIds); // Debug log

    // Try to get quiz names for each quiz ID
    const quizzesWithNames = await Promise.all(
        quizIds.map(async (quizId) => {
            try {
                // Try to get quiz metadata
                const quizRes = await fetch(`${API_BASE}/quiz/${quizId}/metadata`, { headers });
                if (quizRes.ok) {
                    const metadata = await quizRes.json();
                    return {
                        quizId: quizId,
                        quizName: metadata.quizName || metadata.name || 'Untitled Quiz',
                        questionCount: metadata.questionCount || 0,
                        createdAt: metadata.createdAt || null
                    };
                }
            } catch (error) {
                console.log(`Could not fetch metadata for quiz ${quizId}`);
            }

            // Try to get quiz name from first question
            try {
                const questionsRes = await fetch(`${API_BASE}/quiz/${quizId}`, { headers });
                if (questionsRes.ok) {
                    const questions = await questionsRes.json();
                    console.log(`Questions for quiz ${quizId}:`, questions); // Debug log

                    let quizName = 'Untitled Quiz';

                    // Check if any question has a quizName field
                    if (questions.length > 0) {
                        // Try to get quizName from the first question that has it
                        for (const question of questions) {
                            if (question.quizName && question.quizName.trim()) {
                                quizName = question.quizName;
                                break;
                            }
                        }
                    }

                    return {
                        quizId: quizId,
                        quizName: quizName,
                        questionCount: questions.length,
                        createdAt: null
                    };
                }
            } catch (error) {
                console.log(`Could not fetch questions for quiz ${quizId}`, error);
            }

            // Fallback: return just the quiz ID
            return {
                quizId: quizId,
                quizName: 'Untitled Quiz',
                questionCount: 0,
                createdAt: null
            };
        })
    );

    renderAdminQuizzes(quizzesWithNames);
}

function renderAdminQuizzes(quizzes) {
    const container = document.getElementById("admin-quiz-list");
    container.innerHTML = "";

    // Store quizzes in sessionStorage for later access
    sessionStorage.setItem('adminQuizzes', JSON.stringify(quizzes));

    if (!quizzes.length) {
        container.innerHTML = `
            <div style="
                text-align: center; 
                color: rgba(255, 255, 255, 0.7); 
                font-style: italic; 
                font-size: 1.1rem;
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 30px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            ">
                <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.6;">📝</div>
                <p style="margin: 0; font-size: 1.2rem; color: #ffe066;">No quizzes found</p>
                <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255, 255, 255, 0.6);">Create your first quiz using the host page!</p>
            </div>
        `;
        return;
    }

    quizzes.forEach((quiz) => {
        // Handle both old format (just quiz ID strings) and new format (quiz objects)
        const quizId = typeof quiz === 'string' ? quiz : quiz.quizId;
        const quizName = typeof quiz === 'string' ? 'Untitled Quiz' : (quiz.quizName || 'Untitled Quiz');
        const questionCount = typeof quiz === 'string' ? 'Unknown' : (quiz.questionCount || 0);
        const createdDate = typeof quiz === 'string' ? null : quiz.createdAt;

        const div = document.createElement("div");
        div.className = "quiz-card";
        div.style.cssText = `
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            transition: all 0.3s ease;
            cursor: pointer;
        `;

        // Add hover effect with glassmorphism enhancement
        div.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 15px 40px rgba(31, 38, 135, 0.5)';
            this.style.background = 'rgba(255, 255, 255, 0.12)';
        });
        div.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.37)';
            this.style.background = 'rgba(255, 255, 255, 0.08)';
        });

        const formatDate = (dateStr) => {
            if (!dateStr) return 'Unknown';
            try {
                return new Date(dateStr).toLocaleDateString();
            } catch {
                return 'Unknown';
            }
        };

        div.innerHTML = `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; color: #ffffff; font-size: 1.4rem; font-weight: 700; text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);">
                    ${quizName}
                </h4>
                <div style="color: #ffe066; font-size: 1rem; margin-bottom: 10px; font-weight: 600; text-shadow: 0 0 8px rgba(255, 224, 102, 0.4);">
                    <strong>Quiz ID:</strong> <span style="background: rgba(255, 224, 102, 0.2); padding: 4px 8px; border-radius: 8px; font-family: 'Courier New', monospace; border: 1px solid rgba(255, 224, 102, 0.3); color: #fff;">${quizId}</span>
                </div>
                <div style="display: flex; gap: 20px; color: #ffffff; font-size: 0.9rem; opacity: 0.9;">
                    <span><strong style="color: #00f2fe; text-shadow: 0 0 5px rgba(0, 242, 254, 0.4);">Questions:</strong> <span style="color: #51cf66; font-weight: 700;">${questionCount}</span></span>
                    ${createdDate ? `<span><strong style="color: #00f2fe; text-shadow: 0 0 5px rgba(0, 242, 254, 0.4);">Created:</strong> <span style="color: #ffc107;">${formatDate(createdDate)}</span></span>` : ''}
                </div>
            </div>
            <div class="quiz-card-options" style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="editQuiz('${quizId}')" style="background: linear-gradient(90deg, #00f2fe 0%, #4f8cff 100%); color: white; border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 700; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3);">
                    ✏️ Edit
                </button>
                <button onclick="deleteQuiz('${quizId}')" style="background: linear-gradient(90deg, #ff6b6b 0%, #ee5a52 100%); color: white; border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 700; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">
                    🗑️ Delete
                </button>
                <button onclick="viewParticipants('${quizId}')" style="background: linear-gradient(90deg, #51cf66 0%, #37b24d 100%); color: white; border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 700; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(81, 207, 102, 0.3);">
                    👥 Participants
                </button>
                <button onclick="copyQuizId('${quizId}')" style="background: linear-gradient(90deg, #ffe066 0%, #ffc107 100%); color: #1e003a; border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 700; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(255, 224, 102, 0.3);">
                    📋 Copy ID
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Add copy quiz ID functionality
window.copyQuizId = function (quizId) {
    navigator.clipboard.writeText(quizId).then(() => {
        // Show temporary success message
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = 'linear-gradient(90deg, #51cf66 0%, #37b24d 100%)';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'linear-gradient(90deg, #ffd43b 0%, #ffc107 100%)';
        }, 2000);
    }).catch(() => {
        alert(`Quiz ID: ${quizId}\n\nCopy this ID to share with participants.`);
    });
};

window.editQuiz = function (quizId) {
    // Store quiz info in sessionStorage for better handling
    const currentQuizzes = JSON.parse(sessionStorage.getItem('adminQuizzes') || '[]');
    const selectedQuiz = currentQuizzes.find(q => (typeof q === 'string' ? q : q.quizId) === quizId);

    if (selectedQuiz) {
        sessionStorage.setItem('currentEditingQuiz', JSON.stringify(selectedQuiz));
    }

    // Navigate to edit mode
    window.location.href = `admin.html?quizId=${encodeURIComponent(quizId)}`;
};

window.deleteQuiz = async function (quizId) {
    if (!confirm("Are you sure you want to delete this quiz and all its questions?")) return;
    // Fetch all questions for this quiz and delete them one by one
    const res = await fetch(`${API_BASE}/quiz/${quizId}`, { headers });
    const questions = await res.json();
    let success = true;
    for (const q of questions) {
        const delRes = await fetch(`${API_BASE}/${q.id}`, { method: "DELETE", headers });
        if (!delRes.ok) success = false;
    }
    // Delete all results for this quiz
    const resultRes = await fetch(`${RESULT_API}/quiz/${quizId}`, { method: "DELETE", headers });
    if (success && resultRes.ok) {
        alert("Quiz and all its results deleted.");
        fetchMyQuizzes();
    } else {
        alert("Some questions or results could not be deleted.");
    }
};

window.viewParticipants = async function (quizId) {
    document.getElementById("admin-quizzes-section").style.display = "none";
    document.getElementById("participants-section").style.display = "block";

    // Try to get quiz name
    let quizName = 'Untitled Quiz';

    try {
        // Try to get quiz metadata first
        const metadataRes = await fetch(`${API_BASE}/quiz/${quizId}/metadata`, { headers });
        if (metadataRes.ok) {
            const metadata = await metadataRes.json();
            quizName = metadata.quizName || metadata.name || 'Untitled Quiz';
        } else {
            // Fallback: get quiz name from first question
            console.log(`Metadata not found, trying to fetch questions for ${quizId}...`);
            const questionsRes = await fetch(`${API_BASE}/quiz/${quizId}`, { headers });
            if (questionsRes.ok) {
                const questions = await questionsRes.json();
                if (questions.length > 0 && questions[0].quizName) {
                    quizName = questions[0].quizName;
                }
            } else {
                console.log(`Questions fetch failed: ${questionsRes.status}`);
            }
        }
    } catch (error) {
        console.log('Could not fetch quiz name:', error);
    }

    // Update the participants section header
    const participantsHeader = document.querySelector('#participants-section h3');
    participantsHeader.innerHTML = `
        Participants for Quiz: <br>
        <span style="color: #4f8cff; font-size: 1.1rem;">${quizName}</span><br>
        <span style="color: #ffe066; font-size: 0.9rem; font-family: monospace;">ID: ${quizId}</span>
    `;

    // Fetch all results for this quiz
    const res = await fetch(`${RESULT_API}/quiz/${quizId}`, { headers });
    const participants = await res.json();
    const list = document.getElementById("participants-list");
    list.innerHTML = "";
    if (!participants.length) {
        list.innerHTML = "<li style='color: #666; font-style: italic; text-align: center; padding: 20px;'>No participants yet.</li>";
        return;
    }
    participants.forEach((p) => {
        const li = document.createElement('li');
        li.style.cssText = `
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 15px;
            margin: 12px 0;
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 4px 20px rgba(31, 38, 135, 0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
        `;

        // Add hover effect
        li.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(31, 38, 135, 0.4)';
            this.style.background = 'rgba(255, 255, 255, 0.12)';
        });
        li.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 20px rgba(31, 38, 135, 0.3)';
            this.style.background = 'rgba(255, 255, 255, 0.08)';
        });

        const scoreColor = p.correctAnswers >= (p.totalQuestions * 0.8) ? '#51cf66' : p.correctAnswers >= (p.totalQuestions * 0.6) ? '#ffe066' : '#ff6b6b';

        // Use the actual score and correctAnswers from backend
        const scoreDisplay = `${p.correctAnswers}/${p.totalQuestions}`;

        // Debug logging
        console.log(`Participant: ${p.studentUsername}, Raw score: ${p.score}, Correct answers: ${p.correctAnswers}, Total questions: ${p.totalQuestions}, Display: ${scoreDisplay}`);

        li.innerHTML = `
            <div>
                <strong style="color: #00f2fe; font-size: 1.1rem; text-shadow: 0 0 8px rgba(0, 242, 254, 0.4);">${p.studentUsername}</strong><br>
                <span style="color: ${scoreColor}; font-weight: 700; font-size: 1rem; text-shadow: 0 0 8px ${scoreColor}66;">Score: ${scoreDisplay}</span>
                ${p.submittedAt ? `<br><span style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem;">Submitted: ${new Date(p.submittedAt).toLocaleString()}</span>` : ''}
            </div>
            <button class="delete-user-result-btn" style="
                background: linear-gradient(90deg, #ff6b6b 0%, #ee5a52 100%);
                color: white;
                border: none;
                padding: 8px 14px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.85rem;
                font-weight: 600;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            ">
                🗑️ Delete
            </button>
        `;

        li.querySelector('.delete-user-result-btn').onclick = async function () {
            if (!confirm(`Delete result for user ${p.studentUsername}?`)) return;
            const delRes = await fetch(`${RESULT_API}/quiz/${quizId}/user/${p.studentUsername}`, { method: "DELETE", headers });
            if (delRes.ok) {
                li.remove();
                alert("User's result deleted.");
            } else {
                alert("Failed to delete user's result.");
            }
        };
        list.appendChild(li);
    });
};

window.hideParticipants = function () {
    document.getElementById("participants-section").style.display = "none";
    document.getElementById("admin-quizzes-section").style.display = "block";
};


// Utility to get query param
function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

async function fetchQuizQuestions(quizId) {
    try {
        const res = await fetch(`${API_BASE}/quiz/${quizId}`, { headers });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const questions = await res.json();
        renderQuizQuestions(quizId, questions);
    } catch (error) {
        console.error('Error fetching quiz questions:', error);
        // Show error message and redirect back
        alert('Failed to load quiz questions. Redirecting back to main view.');
        window.location.href = 'admin.html';
    }
}

function renderQuizQuestions(quizId, questions) {
    // Get quiz name from stored data or use fallback
    let quizName = 'Unknown Quiz';
    let quizData = null;

    try {
        const storedQuiz = sessionStorage.getItem('currentEditingQuiz');
        if (storedQuiz) {
            quizData = JSON.parse(storedQuiz);
            quizName = typeof quizData === 'string' ? 'Untitled Quiz' : (quizData.quizName || 'Untitled Quiz');
        }
    } catch (e) {
        console.warn('Could not retrieve quiz name from storage');
    }

    // Try to get quiz name from the first question if available
    if (quizName === 'Unknown Quiz' && questions.length > 0 && questions[0].quizName) {
        quizName = questions[0].quizName;
    }

    // Use the questions section instead of the main quiz list
    const questionsSection = document.getElementById("admin-questions-section");
    const questionsList = document.getElementById("admin-question-list");

    // Update the questions title
    const questionsTitle = document.getElementById("questions-title");
    if (questionsTitle) {
        questionsTitle.innerHTML = `
            <div style="text-align: center;">
                <div style="
                    color: #ffffff;
                    font-size: 1.6rem;
                    font-weight: 700;
                    margin-bottom: 10px;
                    text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
                ">Editing: ${quizName}</div>
                <div style="
                    color: #ffe066;
                    font-size: 1rem;
                    margin-bottom: 15px;
                    text-shadow: 0 0 8px rgba(255, 224, 102, 0.4);
                ">Quiz ID: <span style="
                    background: rgba(255, 224, 102, 0.2);
                    padding: 4px 8px;
                    border-radius: 8px;
                    font-family: 'Courier New', monospace;
                    border: 1px solid rgba(255, 224, 102, 0.3);
                    color: #fff;
                ">${quizId}</span></div>
                <button onclick="window.location.href='admin.html'" style="
                    background: linear-gradient(90deg, #51cf66 0%, #37b24d 100%);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    box-shadow: 0 3px 10px rgba(81, 207, 102, 0.3);
                ">← Back to All Quizzes</button>
            </div>
        `;
    }

    // Clear the questions list
    if (questionsList) {
        questionsList.innerHTML = '';
    }

    const addBtn = document.getElementById("add-question-btn");
    addBtn.style.display = "inline-block";
    const deleteQuizBtn = document.getElementById("delete-entire-quiz-btn");
    deleteQuizBtn.style.display = "inline-block";
    deleteQuizBtn.onclick = async function () {
        if (!confirm("Are you sure you want to delete the entire quiz, all its questions, and all its results?")) return;
        // Delete all questions for this quiz
        const res = await fetch(`${API_BASE}/quiz/${quizId}`);
        const questions = await res.json();
        let success = true;
        for (const q of questions) {
            const delRes = await fetch(`${API_BASE}/${q.id}`, { method: "DELETE", headers });
            if (!delRes.ok) success = false;
        }
        // Delete all results for this quiz
        const resultRes = await fetch(`${RESULT_API}/quiz/${quizId}`, { method: "DELETE", headers });
        if (success && resultRes.ok) {
            alert("Quiz and all its results deleted.");
            window.location.href = "admin.html";
        } else {
            alert("Some questions or results could not be deleted.");
        }
    };
    addBtn.onclick = function () {
        // Add a new question block for this quiz
        const questionsList = document.getElementById("admin-question-list");
        const idx = questionsList.querySelectorAll('.question-block').length + 1;
        questionsList.insertAdjacentHTML('beforeend', createQuestionBlockWithData(idx, {}));
        // Add a save button for the new question
        const newBlock = questionsList.querySelector('.question-block:last-child');
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.style.cssText = `
            background: linear-gradient(90deg, #00f2fe 0%, #4f8cff 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 700;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3);
            margin-top: 10px;
        `;
        saveBtn.onclick = async function () {
            const questionText = newBlock.querySelector('.question-text').value.trim();
            const optionA = newBlock.querySelector('.optionA').value.trim();
            const optionB = newBlock.querySelector('.optionB').value.trim();
            const optionC = newBlock.querySelector('.optionC').value.trim();
            const optionD = newBlock.querySelector('.optionD').value.trim();
            const correct = newBlock.querySelector('.correct-answer').value;
            if (!questionText || !optionA || !optionB || !optionC || !optionD) {
                alert("All fields are required for each question.");
                return;
            }

            // Get quiz name from storage for the payload
            let quizName = 'Untitled Quiz';
            try {
                const storedQuiz = sessionStorage.getItem('currentEditingQuiz');
                if (storedQuiz) {
                    const quizData = JSON.parse(storedQuiz);
                    quizName = typeof quizData === 'string' ? 'Untitled Quiz' : (quizData.quizName || 'Untitled Quiz');
                }
            } catch (e) {
                console.warn('Could not retrieve quiz name for new question');
            }

            const payload = {
                questionText,
                optionA,
                optionB,
                optionC,
                optionD,
                correctAnswer: { A: optionA, B: optionB, C: optionC, D: optionD }[correct],
                quizId,
                quizName
            };
            const res = await fetch(`${API_BASE}/add`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Question added!");
                fetchQuizQuestions(quizId);
            } else {
                alert("Failed to add question.");
            }
        };
        newBlock.appendChild(saveBtn);
    };

    // Add event listener for remove button (for all question blocks, including new ones)
    const questionsContainer = document.getElementById("admin-question-list");
    questionsContainer.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-question-btn')) {
            e.target.closest('.question-block').remove();
        }
    });

    const questionsListContainer = document.getElementById("admin-question-list");
    if (!questions.length) {
        questionsListContainer.innerHTML = `
            <div style="
                text-align: center; 
                color: rgba(255, 255, 255, 0.7); 
                font-style: italic; 
                font-size: 1.1rem;
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 30px;
                margin-top: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            ">
                <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.6;">❓</div>
                <p style="margin: 0; font-size: 1.2rem; color: #ffe066;">No questions found</p>
                <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255, 255, 255, 0.6);">Click "Add Question" to create your first question!</p>
            </div>
        `;
        return;
    }
    questions.forEach((q) => {
        const div = document.createElement("div");
        div.className = "question-card";
        div.style.cssText = `
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            transition: all 0.3s ease;
        `;

        // Add hover effect matching host page
        div.addEventListener('mouseenter', function () {
            this.style.background = 'rgba(255, 255, 255, 0.12)';
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 12px 40px rgba(31, 38, 135, 0.5)';
        });
        div.addEventListener('mouseleave', function () {
            this.style.background = 'rgba(255, 255, 255, 0.08)';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.37)';
        });

        div.innerHTML = `
            <div style="margin-bottom: 20px;">
                <label style="display: block; color: #ffe066; font-weight: 700; margin-bottom: 8px; font-size: 1.1rem; text-shadow: 0 0 8px rgba(255, 224, 102, 0.4);">
                    Question:
                </label>
                <input type="text" value="${q.questionText}" data-qid="${q.id}" class="edit-question-text" style="
                    width: 100%;
                    padding: 14px 18px;
                    border: none;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(10px);
                    color: #fff;
                    font-size: 1rem;
                    font-family: 'Quicksand', sans-serif;
                    font-weight: 600;
                    margin-bottom: 15px;
                    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.15);
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                ">
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #00f2fe; font-size: 1.05rem; font-weight: 700; margin-bottom: 15px; text-shadow: 0 0 8px rgba(0, 242, 254, 0.4);">
                    Answer Options:
                </h4>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="
                            background: linear-gradient(90deg, #ff6b6b 0%, #ee5a52 100%);
                            color: white;
                            width: 35px;
                            height: 35px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: 700;
                            font-size: 0.9rem;
                            box-shadow: 0 3px 10px rgba(255, 107, 107, 0.3);
                        ">A</span>
                        <input type="text" value="${q.optionA}" class="edit-optionA" style="
                            flex: 1;
                            padding: 12px 16px;
                            border: none;
                            border-radius: 10px;
                            background: rgba(255, 255, 255, 0.12);
                            backdrop-filter: blur(8px);
                            color: #fff;
                            font-size: 0.95rem;
                            font-family: 'Quicksand', sans-serif;
                            font-weight: 500;
                            box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.1);
                            transition: all 0.3s ease;
                            box-sizing: border-box;
                            min-width: 0;
                        ">
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="
                            background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
                            color: white;
                            width: 35px;
                            height: 35px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: 700;
                            font-size: 0.9rem;
                            box-shadow: 0 3px 10px rgba(0, 242, 254, 0.3);
                        ">B</span>
                        <input type="text" value="${q.optionB}" class="edit-optionB" style="
                            flex: 1;
                            padding: 12px 16px;
                            border: none;
                            border-radius: 10px;
                            background: rgba(255, 255, 255, 0.12);
                            backdrop-filter: blur(8px);
                            color: #fff;
                            font-size: 0.95rem;
                            font-family: 'Quicksand', sans-serif;
                            font-weight: 500;
                            box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.1);
                            transition: all 0.3s ease;
                            box-sizing: border-box;
                            min-width: 0;
                        ">
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="
                            background: linear-gradient(90deg, #ffe066 0%, #ffc107 100%);
                            color: #1e003a;
                            width: 35px;
                            height: 35px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: 700;
                            font-size: 0.9rem;
                            box-shadow: 0 3px 10px rgba(255, 224, 102, 0.3);
                        ">C</span>
                        <input type="text" value="${q.optionC}" class="edit-optionC" style="
                            flex: 1;
                            padding: 12px 16px;
                            border: none;
                            border-radius: 10px;
                            background: rgba(255, 255, 255, 0.12);
                            backdrop-filter: blur(8px);
                            color: #fff;
                            font-size: 0.95rem;
                            font-family: 'Quicksand', sans-serif;
                            font-weight: 500;
                            box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.1);
                            transition: all 0.3s ease;
                            box-sizing: border-box;
                            min-width: 0;
                        ">
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="
                            background: linear-gradient(90deg, #51cf66 0%, #37b24d 100%);
                            color: white;
                            width: 35px;
                            height: 35px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: 700;
                            font-size: 0.9rem;
                            box-shadow: 0 3px 10px rgba(81, 207, 102, 0.3);
                        ">D</span>
                        <input type="text" value="${q.optionD}" class="edit-optionD" style="
                            flex: 1;
                            padding: 12px 16px;
                            border: none;
                            border-radius: 10px;
                            background: rgba(255, 255, 255, 0.12);
                            backdrop-filter: blur(8px);
                            color: #fff;
                            font-size: 0.95rem;
                            font-family: 'Quicksand', sans-serif;
                            font-weight: 500;
                            box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.1);
                            transition: all 0.3s ease;
                            box-sizing: border-box;
                            min-width: 0;
                        ">
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; color: #51cf66; font-weight: 700; margin-bottom: 8px; font-size: 1rem; text-shadow: 0 0 8px rgba(81, 207, 102, 0.4);">
                    ✓ Correct Answer:
                </label>
                <input type="text" value="${q.correctAnswer}" class="edit-correctAnswer" style="
                    width: 100%;
                    padding: 12px 16px;
                    border: none;
                    border-radius: 10px;
                    background: rgba(81, 207, 102, 0.15);
                    backdrop-filter: blur(8px);
                    color: #51cf66;
                    font-size: 0.95rem;
                    font-family: 'Quicksand', sans-serif;
                    font-weight: 600;
                    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(81, 207, 102, 0.3);
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                ">
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="saveQuestion(${q.id}, this)" style="
                    background: linear-gradient(90deg, #00f2fe 0%, #4f8cff 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 700;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3);
                ">💾 Save</button>
                <button onclick="deleteQuestion(${q.id}, this)" style="
                    background: linear-gradient(90deg, #ff6b6b 0%, #ee5a52 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 700;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                ">🗑️ Delete</button>
            </div>
        `;
        questionsListContainer.appendChild(div);
    });
}

window.saveQuestion = async function (qid, btn) {
    const card = btn.closest('.question-card');
    const payload = {
        questionText: card.querySelector('.edit-question-text').value,
        optionA: card.querySelector('.edit-optionA').value,
        optionB: card.querySelector('.edit-optionB').value,
        optionC: card.querySelector('.edit-optionC').value,
        optionD: card.querySelector('.edit-optionD').value,
        correctAnswer: card.querySelector('.edit-correctAnswer').value
    };
    const res = await fetch(`${API_BASE}/${qid}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        alert("Saved!");
    } else {
        alert("Failed to save.");
    }
};

window.deleteQuestion = async function (qid, btn) {
    if (!confirm("Delete this question?")) return;
    const res = await fetch(`${API_BASE}/${qid}`, { method: "DELETE", headers });
    if (res.ok) {
        btn.closest('.question-card').remove();
    } else {
        alert("Failed to delete.");
    }
};

const quizIdParam = getQueryParam('quizId');
if (quizIdParam) {
    // Hide the main quiz section and show questions section
    document.getElementById("admin-quizzes-section").style.display = "none";
    document.getElementById("admin-questions-section").style.display = "block";

    console.log('Loading quiz questions for ID:', quizIdParam);
    fetchQuizQuestions(quizIdParam);
} else {
    // Show main quiz listing
    document.getElementById("admin-quizzes-section").style.display = "block";
    document.getElementById("admin-questions-section").style.display = "none";
    fetchMyQuizzes();
}

// Utility to extract username from JWT token
function getUsernameFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.username;
    } catch (e) {
        return null;
    }
}

// Call fetchMyQuizzes() when loading the admin panel to get real data from database
fetchMyQuizzes();

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function () {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    if (scrollToTopBtn) {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.display = 'block';
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    }
});

// Make scrollToTop available globally
window.scrollToTop = scrollToTop;
