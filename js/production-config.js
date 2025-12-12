// Production Configuration for Quiz Application
// Update these URLs with your actual Back4App deployment URLs

window.PRODUCTION_AUTH_API = 'https://quiz-auth-service.b4a.run/api/auth';
window.PRODUCTION_QUESTION_API = 'https://quiz-question-service.b4a.run/api/questions';  
window.PRODUCTION_RESULT_API = 'https://quiz-result-service.b4a.run/api/results';

console.log('Production configuration loaded');
console.log('Auth API:', window.PRODUCTION_AUTH_API);
console.log('Question API:', window.PRODUCTION_QUESTION_API);
console.log('Result API:', window.PRODUCTION_RESULT_API);
