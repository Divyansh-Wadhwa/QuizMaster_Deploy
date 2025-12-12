// Utility to create a question block with pre-filled values
function createQuestionBlockWithData(idx, data) {
    return `
    <div class="question-block" data-idx="${idx}" style="
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 25px;
        margin-bottom: 20px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
        transition: all 0.3s ease;
    ">
        <div style="margin-bottom: 20px;">
            <label style="display: block; color: #ffe066; font-weight: 700; margin-bottom: 8px; font-size: 1.1rem; text-shadow: 0 0 8px rgba(255, 224, 102, 0.4);">
                Question:
            </label>
            <input type="text" class="question-text" required value="${data.questionText || ''}" style="
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
                    <input type="text" class="optionA" required value="${data.optionA || ''}" style="
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
                    <input type="text" class="optionB" required value="${data.optionB || ''}" style="
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
                    <input type="text" class="optionC" required value="${data.optionC || ''}" style="
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
                    <input type="text" class="optionD" required value="${data.optionD || ''}" style="
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
            <select class="correct-answer" required style="
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
                cursor: pointer;
            ">
                <option value="A" ${data.correctAnswer === data.optionA ? 'selected' : ''}>A</option>
                <option value="B" ${data.correctAnswer === data.optionB ? 'selected' : ''}>B</option>
                <option value="C" ${data.correctAnswer === data.optionC ? 'selected' : ''}>C</option>
                <option value="D" ${data.correctAnswer === data.optionD ? 'selected' : ''}>D</option>
            </select>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" class="remove-question-btn" style="
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
            ">🗑️ Remove</button>
        </div>
    </div>
    `;
}
