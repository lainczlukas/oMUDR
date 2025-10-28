/**
 * MUDR Quiz Application
 * Medical University Entrance Exam Preparation Tool
 *
 * This application provides a quiz interface for medical students
 * to practice exam questions with immediate feedback.
 */

// ============================================================================
// Application State
// ============================================================================

/**
 * Global application state
 */
const state = {
    questionsData: null,      // All questions and categories from JSON
    currentQuestion: null,    // Currently displayed question
    answeredQuestions: [],    // Array of recently answered question IDs
    isAnswerSubmitted: false  // Whether current question has been answered
};

// ============================================================================
// DOM Element References
// ============================================================================

const elements = {
    categoryBadge: document.getElementById('categoryBadge'),
    questionText: document.getElementById('questionText'),
    answersContainer: document.getElementById('answersContainer'),
    resultMessage: document.getElementById('resultMessage'),
    submitBtn: document.getElementById('submitBtn'),
    nextBtn: document.getElementById('nextBtn')
};

// ============================================================================
// Data Loading
// ============================================================================

/**
 * Loads questions from the JSON file
 * @returns {Promise<void>}
 */
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        state.questionsData = await response.json();

        // Validate data structure
        if (!state.questionsData.questions || state.questionsData.questions.length === 0) {
            throw new Error('No questions found in data file');
        }

        console.log(`Loaded ${state.questionsData.questions.length} questions`);

        // Display the first question
        displayRandomQuestion();

    } catch (error) {
        console.error('Error loading questions:', error);
        showError('Failed to load questions. Please refresh the page.');
    }
}

/**
 * Displays an error message to the user
 * @param {string} message - Error message to display
 */
function showError(message) {
    elements.questionText.textContent = 'Nepodarilo sa načítať otázky. Obnovte stránku prosím.';
    elements.categoryBadge.textContent = 'Chyba';
    elements.categoryBadge.className = 'inline-block bg-gradient-to-r from-red-400 to-pink-500 text-white text-sm font-bold px-6 py-2 rounded-full shadow-md';
    elements.submitBtn.disabled = true;
}

// ============================================================================
// Question Selection
// ============================================================================

/**
 * Selects a random question, avoiding recently answered questions
 * @returns {Object} Selected question object
 */
function getRandomQuestion() {
    const questions = state.questionsData.questions;
    const maxHistorySize = Math.min(5, Math.floor(questions.length / 2));

    // If we've answered most questions, clear history to allow repeats
    if (state.answeredQuestions.length >= questions.length - 1) {
        state.answeredQuestions = [];
    }

    // Get questions that haven't been recently answered
    const availableQuestions = questions.filter(
        q => !state.answeredQuestions.includes(q.id)
    );

    // If all questions were recently answered (shouldn't happen due to above check)
    const questionPool = availableQuestions.length > 0 ? availableQuestions : questions;

    // Select random question
    const randomIndex = Math.floor(Math.random() * questionPool.length);
    const selectedQuestion = questionPool[randomIndex];

    // Add to history and maintain size limit
    state.answeredQuestions.push(selectedQuestion.id);
    if (state.answeredQuestions.length > maxHistorySize) {
        state.answeredQuestions.shift(); // Remove oldest
    }

    return selectedQuestion;
}

/**
 * Gets the category name for a given category ID
 * @param {number} categoryId - Category ID
 * @returns {string} Category name
 */
function getCategoryName(categoryId) {
    const category = state.questionsData.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
}

// ============================================================================
// Question Display
// ============================================================================

/**
 * Displays a random question from the question pool
 */
function displayRandomQuestion() {
    const question = getRandomQuestion();
    displayQuestion(question);
}

/**
 * Displays a specific question
 * @param {Object} question - Question object to display
 */
function displayQuestion(question) {
    state.currentQuestion = question;
    state.isAnswerSubmitted = false;

    // Add animation to quiz container
    const quizContainer = document.getElementById('quizContainer');
    quizContainer.classList.remove('slide-in');
    void quizContainer.offsetWidth; // Trigger reflow
    quizContainer.classList.add('slide-in');

    // Update category badge with colorful gradients
    const categoryName = getCategoryName(question.categoryId);
    const categoryColors = {
        'Anatómia': 'from-pink-400 to-rose-500',
        'Fyziológia': 'from-blue-400 to-indigo-500',
        'Biochémia': 'from-green-400 to-emerald-500',
        'Farmakológia': 'from-purple-400 to-violet-500',
        'Patológia': 'from-orange-400 to-red-500'
    };
    const colorClass = categoryColors[categoryName] || 'from-pink-400 to-purple-500';
    elements.categoryBadge.textContent = categoryName;
    elements.categoryBadge.className = `inline-block bg-gradient-to-r ${colorClass} text-white text-sm font-bold px-6 py-2 rounded-full shadow-md`;

    // Update question text with animation
    elements.questionText.style.opacity = '0';
    setTimeout(() => {
        elements.questionText.textContent = question.text;
        elements.questionText.style.transition = 'opacity 0.5s ease-in';
        elements.questionText.style.opacity = '1';
    }, 100);

    // Clear and populate answers
    elements.answersContainer.innerHTML = '';

    question.answers.forEach((answer) => {
        const answerElement = createAnswerElement(answer);
        elements.answersContainer.appendChild(answerElement);
    });

    // Reset UI state
    elements.resultMessage.classList.add('hidden');
    elements.submitBtn.disabled = false;
    elements.submitBtn.classList.remove('hidden');
    elements.nextBtn.classList.add('hidden');
}

/**
 * Creates a DOM element for a single answer
 * @param {Object} answer - Answer object
 * @returns {HTMLElement} Answer DOM element
 */
function createAnswerElement(answer) {
    const div = document.createElement('div');
    div.className = 'answer-item bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-purple-50 p-4 rounded-xl transition-all duration-300 cursor-pointer border-2 border-purple-200 hover:border-purple-400 hover:shadow-md';
    div.dataset.answerId = answer.id;

    const label = document.createElement('label');
    label.className = 'flex items-start cursor-pointer';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `answer-${answer.id}`;
    checkbox.className = 'mt-1 mr-3 h-5 w-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer';
    checkbox.dataset.answerId = answer.id;
    checkbox.dataset.isCorrect = answer.isCorrect;

    const span = document.createElement('span');
    span.className = 'text-gray-800 font-medium select-none flex-1';
    span.textContent = answer.text;

    label.appendChild(checkbox);
    label.appendChild(span);
    div.appendChild(label);

    // Allow clicking anywhere on the div to toggle checkbox
    div.addEventListener('click', (e) => {
        if (e.target !== checkbox && !state.isAnswerSubmitted) {
            checkbox.checked = !checkbox.checked;
        }
    });

    return div;
}

// ============================================================================
// Answer Validation
// ============================================================================

/**
 * Handles answer submission
 */
function submitAnswer() {
    if (state.isAnswerSubmitted) return;

    state.isAnswerSubmitted = true;

    // Get all checkboxes
    const checkboxes = document.querySelectorAll('#answersContainer input[type="checkbox"]');

    // Get user's selected answers
    const selectedAnswers = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.dataset.answerId);

    // Get correct answers
    const correctAnswers = state.currentQuestion.answers
        .filter(a => a.isCorrect)
        .map(a => a.id.toString());

    // Check if answer is correct
    const isCorrect = validateAnswer(selectedAnswers, correctAnswers);

    // Highlight answers and show feedback
    highlightAnswers(checkboxes);
    showResult(isCorrect);

    // Update UI state
    elements.submitBtn.disabled = true;
    elements.submitBtn.classList.add('hidden');
    elements.nextBtn.classList.remove('hidden');

    // Disable all checkboxes
    checkboxes.forEach(cb => cb.disabled = true);
}

/**
 * Validates if the selected answers match the correct answers
 * @param {string[]} selected - Selected answer IDs
 * @param {string[]} correct - Correct answer IDs
 * @returns {boolean} True if answer is correct
 */
function validateAnswer(selected, correct) {
    if (selected.length !== correct.length) return false;

    const selectedSet = new Set(selected);
    const correctSet = new Set(correct);

    // Check if sets are equal
    return selected.every(id => correctSet.has(id)) &&
           correct.every(id => selectedSet.has(id));
}

/**
 * Highlights correct and incorrect answers with visual feedback
 * @param {NodeList} checkboxes - All answer checkboxes
 */
function highlightAnswers(checkboxes) {
    checkboxes.forEach((checkbox, index) => {
        const answerDiv = checkbox.closest('.answer-item');
        const isCorrect = checkbox.dataset.isCorrect === 'true';
        const isChecked = checkbox.checked;

        // Remove hover effects and reset classes
        answerDiv.classList.remove('hover:from-blue-50', 'hover:to-purple-50', 'hover:border-purple-400');

        // Stagger animation for each answer
        setTimeout(() => {
            if (isCorrect) {
                // Correct answers get vibrant green gradient
                answerDiv.className = 'answer-item bg-gradient-to-r from-green-400 to-emerald-500 p-4 rounded-xl transition-all duration-300 cursor-pointer border-2 border-green-600 shadow-lg transform scale-105';
                answerDiv.querySelector('span').className = 'text-white font-bold select-none flex-1';
                answerDiv.querySelector('input').className = 'mt-1 mr-3 h-5 w-5 cursor-pointer';
            } else if (isChecked) {
                // Incorrectly selected answers get vibrant red gradient
                answerDiv.className = 'answer-item bg-gradient-to-r from-red-400 to-pink-500 p-4 rounded-xl transition-all duration-300 cursor-pointer border-2 border-red-600 shadow-lg';
                answerDiv.querySelector('span').className = 'text-white font-bold select-none flex-1';
                answerDiv.querySelector('input').className = 'mt-1 mr-3 h-5 w-5 cursor-pointer';
            }
        }, index * 100); // Stagger by 100ms per answer
    });
}

/**
 * Displays the result message
 * @param {boolean} isCorrect - Whether the answer was correct
 */
function showResult(isCorrect) {
    // Delay showing result to allow answer highlights to animate first
    setTimeout(() => {
        elements.resultMessage.classList.remove('hidden');
        elements.resultMessage.style.opacity = '0';

        if (isCorrect) {
            elements.resultMessage.className = 'mb-6 p-5 rounded-xl font-bold text-center text-lg shadow-lg bg-gradient-to-r from-green-400 to-emerald-500 text-white border-2 border-green-600';
            elements.resultMessage.innerHTML = `
                <span class="text-3xl">🎉</span>
                <span class="ml-2">Správne! Výborne!</span>
                <span class="text-3xl ml-2">✓</span>
            `;
        } else {
            elements.resultMessage.className = 'mb-6 p-5 rounded-xl font-bold text-center text-lg shadow-lg bg-gradient-to-r from-orange-400 to-red-500 text-white border-2 border-red-600';
            elements.resultMessage.innerHTML = `
                <span class="text-3xl">💡</span>
                <span class="ml-2">Nesprávne. Správne odpovede sú zvýraznené zelenou.</span>
            `;
        }

        // Fade in animation
        setTimeout(() => {
            elements.resultMessage.style.transition = 'opacity 0.5s ease-in';
            elements.resultMessage.style.opacity = '1';
        }, 50);
    }, 800); // Wait for answer highlights to finish
}

// ============================================================================
// Navigation
// ============================================================================

/**
 * Loads and displays the next question
 */
function nextQuestion() {
    displayRandomQuestion();
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Sets up all event listeners
 */
function initializeEventListeners() {
    elements.submitBtn.addEventListener('click', submitAnswer);
    elements.nextBtn.addEventListener('click', nextQuestion);

    // Allow Enter key to submit/next
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (!state.isAnswerSubmitted && !elements.submitBtn.disabled) {
                submitAnswer();
            } else if (state.isAnswerSubmitted) {
                nextQuestion();
            }
        }
    });
}

// ============================================================================
// Application Initialization
// ============================================================================

/**
 * Initializes the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('MUDR Quiz Application Starting...');
    initializeEventListeners();
    loadQuestions();
});
