
let questionCount = 0;

// Function to generate 6-digit alphanumeric quiz ID
function generateQuizId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Function to check if quiz ID already exists
async function isQuizIdUnique(quizId) {
    try {
        const response = await fetch(`${window.QUESTION_API_BASE}/quiz/${quizId}`);
        // If quiz exists, response will be ok (200), so ID is not unique
        // If quiz doesn't exist, response will be 404 or error, so ID is unique
        return !response.ok;
    } catch (error) {
        // If there's an error (likely 404), the ID is unique
        return true;
    }
}

// Function to generate unique quiz ID
async function generateUniqueQuizId() {
    let quizId;
    let attempts = 0;
    const maxAttempts = 10;

    do {
        quizId = generateQuizId();
        attempts++;

        if (attempts >= maxAttempts) {
            // Fallback: add timestamp to ensure uniqueness
            const timestamp = Date.now().toString().slice(-4);
            quizId = generateQuizId().slice(0, 2) + timestamp;
            break;
        }
    } while (!(await isQuizIdUnique(quizId)));

    return quizId;
}

// Use the new utility for pre-filled blocks
// createQuestionBlockWithData is imported from host-utils.js
function createQuestionBlock(idx) {
    return createQuestionBlockWithData(idx, {});
}

document.addEventListener("DOMContentLoaded", function () {
    const quizSetupSection = document.getElementById("quiz-setup-section");
    const generateIdBtn = document.getElementById("generate-id-btn");
    const startQuestionsBtn = document.getElementById("start-questions-btn");
    const quizForm = document.getElementById("quiz-form");
    const questionsSection = document.getElementById("questions-section");
    const addBtn = document.getElementById("add-question-btn");
    let quizId = "";
    let quizName = "";

    // Auto-generate quiz ID when page loads
    generateUniqueQuizId().then(id => {
        document.getElementById("quiz-id").value = id;
        quizId = id;
    });

    // Generate new quiz ID when button is clicked
    generateIdBtn.onclick = async function () {
        this.disabled = true;
        this.textContent = 'Generating...';

        try {
            const newId = await generateUniqueQuizId();
            document.getElementById("quiz-id").value = newId;
            quizId = newId;
            this.textContent = 'Generate ID';
        } catch (error) {
            alert('Error generating quiz ID. Please try again.');
            this.textContent = 'Generate ID';
        } finally {
            this.disabled = false;
        }
    };

    startQuestionsBtn.onclick = function () {
        quizName = document.getElementById("quiz-name").value.trim();
        quizId = document.getElementById("quiz-id").value.trim();

        if (!quizName) {
            alert("Please enter a quiz name.");
            document.getElementById("quiz-name").focus();
            return;
        }

        if (!quizId) {
            alert("Please generate a quiz ID.");
            generateIdBtn.click();
            return;
        }

        // Hide setup section and show questions form
        quizSetupSection.style.display = 'none';
        quizForm.style.display = 'block';

        // Add quiz name and ID display
        const quizInfo = document.createElement('div');
        quizInfo.className = 'quiz-info-display';
        quizInfo.innerHTML = `
            <h3>${quizName}</h3>
            <p>Quiz ID: ${quizId}</p>
            <button type="button" id="back-to-setup-btn" class="host-btn" style="max-width: 200px; margin: 10px auto 0 auto; font-size: 0.9rem; padding: 8px;">
                Change Quiz Details
            </button>
        `;
        questionsSection.parentNode.insertBefore(quizInfo, questionsSection);

        // Add question counter
        const questionCounter = document.createElement('div');
        questionCounter.id = 'question-counter';
        questionCounter.style.cssText = `
            background: rgba(255, 224, 102, 0.2);
            color: #ffe066;
            padding: 8px 15px;
            border-radius: 20px;
            margin-bottom: 15px;
            text-align: center;
            font-weight: 600;
            border: 1px solid rgba(255, 224, 102, 0.3);
        `;
        questionCounter.textContent = 'Questions Added: 0';
        questionsSection.parentNode.insertBefore(questionCounter, questionsSection);

        // Add event listener for back to setup button
        document.getElementById('back-to-setup-btn').onclick = function () {
            if (confirm('Are you sure? Any questions you\'ve added will be lost.')) {
                quizSetupSection.style.display = 'block';
                quizForm.style.display = 'none';
                quizInfo.remove();
                // Clear questions
                questionsSection.innerHTML = '';
                questionCount = 0;
            }
        };
    };


    function addQuestion() {
        // Remove 'no questions' message if present
        const msg = questionsSection.querySelector('p');
        if (msg) msg.remove();
        questionCount++;
        questionsSection.insertAdjacentHTML('beforeend', createQuestionBlock(questionCount));

        // Update question counter
        const counter = document.getElementById('question-counter');
        if (counter) {
            counter.textContent = `Questions Added: ${questionCount}`;
        }

        // Scroll to the newly added question
        setTimeout(() => {
            const questionBlocks = document.querySelectorAll('.question-block');
            if (questionBlocks.length > 0) {
                const lastQuestion = questionBlocks[questionBlocks.length - 1];
                lastQuestion.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // Focus on the question text input of the new question
                const questionTextInput = lastQuestion.querySelector('.question-text');
                if (questionTextInput) {
                    questionTextInput.focus();
                }
            }
        }, 100);
    }
    addBtn.onclick = addQuestion;

    questionsSection.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-question-btn')) {
            e.target.closest('.question-block').remove();
            questionCount = Math.max(0, questionCount - 1);

            // Update question counter
            const counter = document.getElementById('question-counter');
            if (counter) {
                counter.textContent = `Questions Added: ${questionCount}`;
            }

            // If no questions left, show a message
            if (questionCount === 0) {
                questionsSection.innerHTML = '<p style="text-align: center; color: #ffe066; font-style: italic;">No questions added yet. Click "Add Question" to get started.</p>';
            }
        }
    });

    quizForm.onsubmit = async function (e) {
        e.preventDefault();
        const questionBlocks = document.querySelectorAll('.question-block');
        if (!quizId || !quizName || questionBlocks.length === 0) {
            alert("Quiz name, Quiz ID and at least one question are required.");
            return;
        }

        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Quiz...';

        const questions = [];
        for (const block of questionBlocks) {
            const questionText = block.querySelector('.question-text').value.trim();
            const optionA = block.querySelector('.optionA').value.trim();
            const optionB = block.querySelector('.optionB').value.trim();
            const optionC = block.querySelector('.optionC').value.trim();
            const optionD = block.querySelector('.optionD').value.trim();
            const correct = block.querySelector('.correct-answer').value;
            if (!questionText || !optionA || !optionB || !optionC || !optionD) {
                alert("All fields are required for each question.");
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            questions.push({
                questionText,
                optionA,
                optionB,
                optionC,
                optionD,
                correctAnswer: correct,
                quizId,
                quizName
            });
        }

        try {
            // Submit each question to backend
            let success = true;
            let successCount = 0;

            for (const q of questions) {
                try {
                    const res = await fetch(`${window.QUESTION_API_BASE}/add`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(q)
                    });
                    if (res.ok) {
                        successCount++;
                    } else {
                        success = false;
                        console.error('Failed to add question:', await res.text());
                    }
                } catch (error) {
                    success = false;
                    console.error('Error adding question:', error);
                }
            }

            if (success && successCount === questions.length) {
                alert(`Quiz "${quizName}" created successfully with ${successCount} questions!\nQuiz ID: ${quizId}`);
                window.location.href = `admin.html?quizId=${encodeURIComponent(quizId)}`;
            } else if (successCount > 0) {
                alert(`Quiz partially created. ${successCount} out of ${questions.length} questions were added successfully. Please check and add remaining questions.`);
                window.location.href = `admin.html?quizId=${encodeURIComponent(quizId)}`;
            } else {
                alert("Failed to create quiz. Please check your connection and try again.");
            }

        } catch (error) {
            console.error('Error creating quiz:', error);
            alert("An error occurred while creating the quiz. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    };

    // Function to get username from JWT token
    function getUsernameFromToken() {
        const token = localStorage.getItem('token');
        if (!token) return 'anonymous';

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub || payload.username || 'anonymous';
        } catch (error) {
            return 'anonymous';
        }
    }
});

// Import the utility for pre-filled question blocks
// <script src="js/host-utils.js"></script> should be added to host.html before host.js
