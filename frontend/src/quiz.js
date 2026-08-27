import { societies } from './data.js';

export const quizQuestions = [
  {
    id: 1,
    question: "How do you prefer to spend your free time?",
    options: [
      { text: "Writing code, building apps, or tinkering with hardware", scores: { Technical: 3, Media: 0, Creative: 0, Cultural: 0 } },
      { text: "Shooting photos, designing posters, or painting", scores: { Technical: 0, Media: 0, Creative: 3, Cultural: 0 } },
      { text: "Singing, dancing, or rehearsing a dramatic scene", scores: { Technical: 0, Media: 0, Creative: 0, Cultural: 3 } },
      { text: "Writing articles, making videos, or managing social media", scores: { Technical: 0, Media: 3, Creative: 0, Cultural: 0 } }
    ]
  },
  {
    id: 2,
    question: "Which of these environments excites you the most?",
    options: [
      { text: "A desk full of monitors, microcontrollers, and IDE screens", scores: { Technical: 3, Media: 0, Creative: 0, Cultural: 0 } },
      { text: "A vibrant stage lit by spotlights and filled with energy", scores: { Technical: 0, Media: 0, Creative: 0, Cultural: 3 } },
      { text: "A studio with canvases, cameras, and design tools everywhere", scores: { Technical: 0, Media: 0, Creative: 3, Cultural: 0 } },
      { text: "A newsroom buzzing with stories, edits, and live broadcasts", scores: { Technical: 0, Media: 3, Creative: 0, Cultural: 0 } }
    ]
  },
  {
    id: 3,
    question: "What is your primary goal for joining a student society?",
    options: [
      { text: "To build technical skills and ship real projects", scores: { Technical: 3, Media: 0, Creative: 0, Cultural: 0 } },
      { text: "To express myself through art, design, or visual storytelling", scores: { Technical: 0, Media: 0, Creative: 3, Cultural: 0 } },
      { text: "To perform, entertain, and connect with an audience", scores: { Technical: 0, Media: 0, Creative: 0, Cultural: 3 } },
      { text: "To influence opinions, build a brand, and communicate ideas", scores: { Technical: 0, Media: 3, Creative: 0, Cultural: 0 } }
    ]
  },
  {
    id: 4,
    question: "Which skill are you most proud of?",
    options: [
      { text: "Problem-solving and logical thinking", scores: { Technical: 3, Media: 0, Creative: 1, Cultural: 0 } },
      { text: "Visual aesthetics and an eye for detail", scores: { Technical: 0, Media: 1, Creative: 3, Cultural: 0 } },
      { text: "Stage presence, confidence, and body expression", scores: { Technical: 0, Media: 0, Creative: 0, Cultural: 3 } },
      { text: "Persuasive writing and clear communication", scores: { Technical: 0, Media: 3, Creative: 0, Cultural: 1 } }
    ]
  }
];

export function getRecommendation(answers) {
  const categoryScores = {
    Technical: 0,
    Media: 0,
    Creative: 0,
    Cultural: 0
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
