import { societies } from './data.js';

export const quizQuestions = [
  {
    id: 1,
    question: "How do you prefer to spend your free time?",
    options: [
      { text: "Solving puzzles, building mini-apps, or exploring gadgets", scores: { Technical: 3, Literary: 0, Cultural: 0, Sports: 0 } },
      { text: "Singing, playing instruments, or acting in front of a mirror", scores: { Technical: 0, Literary: 0, Cultural: 3, Sports: 0 } },
      { text: "Running, playing outdoor games, or physical training", scores: { Technical: 0, Literary: 0, Cultural: 0, Sports: 3 } },
      { text: "Reading, analyzing policies, or participating in discussions", scores: { Technical: 1, Literary: 3, Cultural: 0, Sports: 0 } }
    ]
  },
  {
    id: 2,
    question: "Which of these environments excites you the most?",
    options: [
      { text: "A desk full of wiring, microcontrollers, and screens", scores: { Technical: 3, Literary: 0, Cultural: 0, Sports: 0 } },
      { text: "A vibrant stage lit by spotlights and filled with sound", scores: { Technical: 0, Literary: 0, Cultural: 3, Sports: 0 } },
      { text: "An open running track, sports field, or physical gym", scores: { Technical: 0, Literary: 0, Cultural: 0, Sports: 3 } },
      { text: "A formal podium or a round-table room for public debates", scores: { Technical: 0, Literary: 3, Cultural: 0, Sports: 0 } }
    ]
  },
  {
    id: 3,
    question: "What is your primary goal for joining a student club?",
    options: [
      { text: "To learn hard technical skills and build real projects", scores: { Technical: 3, Literary: 0, Cultural: 0, Sports: 0 } },
      { text: "To express myself creatively and perform for an audience", scores: { Technical: 0, Literary: 0, Cultural: 3, Sports: 0 } },
      { text: "To build physical discipline, stamina, and team spirit", scores: { Technical: 0, Literary: 0, Cultural: 0, Sports: 3 } },
      { text: "To refine my verbal rhetoric, writing, and logical arguments", scores: { Technical: 0, Literary: 3, Cultural: 0, Sports: 0 } }
    ]
  }
];

export function getRecommendation(answers) {
  const categoryScores = {
    Technical: 0,
    Cultural: 0,
    Sports: 0,
    Literary: 0
  };

  // Sum up scores based on chosen options
  answers.forEach((optionIndex, questionIndex) => {
    const question = quizQuestions[questionIndex];
    if (question && question.options[optionIndex]) {
      const scores = question.options[optionIndex].scores;
      for (const cat in scores) {
        categoryScores[cat] += scores[cat];
      }
    }
  });

  // Find category with the maximum score
  let bestCategory = "Technical";
  let maxScore = -1;
  for (const cat in categoryScores) {
    if (categoryScores[cat] > maxScore) {
      maxScore = categoryScores[cat];
      bestCategory = cat;
    }
  }

  // Filter societies matching the best category
  const candidates = societies.filter(s => s.category.toLowerCase() === bestCategory.toLowerCase());
  
  // If no candidates (safety fallback), return a default society
  if (candidates.length === 0) {
    return societies[0];
  }

  // Randomly select one of the candidates in the winning category
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}
