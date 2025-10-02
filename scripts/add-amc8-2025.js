const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const amc8Questions = [
  {
    questionNumber: "1",
    questionText: "The eight-pointed star, shown in the figure below, is a popular quilting pattern. What percent of the entire 444-by-444 grid is covered by the star?",
    examName: "AMC 8",
    examYear: 2025,
    difficulty: "easy",
    topic: "Geometry",
    subtopic: "Area and Percent",
    timeLimit: 3,
    answerChoices: [
      { letter: "A", text: "40", isCorrect: false },
      { letter: "B", text: "50", isCorrect: true },
      { letter: "C", text: "60", isCorrect: false },
      { letter: "D", text: "75", isCorrect: false },
      { letter: "E", text: "80", isCorrect: false }
    ]
  },
  {
    questionNumber: "2",
    questionText: "The table below shows the ancient Egyptian heiroglyphs that were used to represent different numbers. What number was represented by the given combination of heiroglyphs?",
    examName: "AMC 8",
    examYear: 2025,
    difficulty: "easy",
    topic: "Number Theory",
    subtopic: "Number Systems",
    timeLimit: 3,
    answerChoices: [
      { letter: "A", text: "1,423", isCorrect: false },
      { letter: "B", text: "10,423", isCorrect: true },
      { letter: "C", text: "14,023", isCorrect: false },
      { letter: "D", text: "14,203", isCorrect: false },
      { letter: "E", text: "14,230", isCorrect: false }
    ]
  },
  {
    questionNumber: "3",
    questionText: "\"Buffalo Shuffle-o\" is a card game in which all the cards are distributed evenly among all players at the start of the game. When Annika and 3 of her friends play, each player is dealt 15 cards. Suppose 2 more friends join the next game. How many cards will be dealt to each player?",
    examName: "AMC 8",
    examYear: 2025,
    difficulty: "easy",
    topic: "Algebra",
    subtopic: "Division and Proportions",
    timeLimit: 3,
    answerChoices: [
      { letter: "A", text: "8", isCorrect: false },
      { letter: "B", text: "9", isCorrect: false },
      { letter: "C", text: "10", isCorrect: true },
      { letter: "D", text: "11", isCorrect: false },
      { letter: "E", text: "12", isCorrect: false }
    ]
  },
  {
    questionNumber: "4",
    questionText: "Lucius is counting backward by 7s. His first three numbers are 100, 93, and 86. What is his 10th number?",
    examName: "AMC 8",
    examYear: 2025,
    difficulty: "easy",
    topic: "Algebra",
    subtopic: "Arithmetic Sequences",
    timeLimit: 3,
    answerChoices: [
      { letter: "A", text: "30", isCorrect: false },
      { letter: "B", text: "37", isCorrect: true },
      { letter: "C", text: "42", isCorrect: false },
      { letter: "D", text: "44", isCorrect: false },
      { letter: "E", text: "47", isCorrect: false }
    ]
  },
  {
    questionNumber: "5",
    questionText: "Betty drives a truck to deliver packages in a neighborhood whose street map is shown. Betty starts at the factory (labeled F) and drives to location A, then B, then C, before returning to F. What is the shortest distance, in blocks, she can drive to complete the route?",
    examName: "AMC 8",
    examYear: 2025,
    difficulty: "medium",
    topic: "Geometry",
    subtopic: "Distance and Paths",
    timeLimit: 3,
    answerChoices: [
      { letter: "A", text: "20", isCorrect: false },
      { letter: "B", text: "22", isCorrect: false },
      { letter: "C", text: "24", isCorrect: true },
      { letter: "D", text: "26", isCorrect: false },
      { letter: "E", text: "28", isCorrect: false }
    ]
  },
  {
    questionNumber: "6",
    questionText: "Sekou writes the numbers 15, 16, 17, 18, 19. After he erases one of the numbers, the sum of the remaining four numbers is a multiple of 4. Which number did he erase?",
    examName: "AMC 8",
    examYear: 2025,
    difficulty: "easy",
    topic: "Number Theory",
    subtopic: "Divisibility",
    timeLimit: 3,
    answerChoices: [
      { letter: "A", text: "15", isCorrect: false },
      { letter: "B", text: "16", isCorrect: false },
      { letter: "C", text: "17", isCorrect: true },
      { letter: "D", text: "18", isCorrect: false },
      { letter: "E", text: "19", isCorrect: false }
    ]
  },
  {
    questionNumber: "7",
    questionText: "On the most recent exam in Prof. Xochi's class: • 5 students earned a score of at least 95%, • 13 students earned a score of at least 90%, • 27 students earned a score of at least 85%, and • 50 students earned a score of at least 80%. How many students earned a score of at least 80% and less than 90%?",
    examName: "AMC 8",
    examYear: 2025,
    difficulty: "medium",
    topic: "Statistics",
    subtopic: "Data Analysis",
    timeLimit: 3,
    answerChoices: [
      { letter: "A", text: "8", isCorrect: false },
      { letter: "B", text: "14", isCorrect: false },
      { letter: "C", text: "22", isCorrect: false },
      { letter: "D", text: "37", isCorrect: true },
      { letter: "E", text: "45", isCorrect: false }
    ]
  },
  {
    questionNumber: "8",
    questionText: "Isaiah cuts open a cardboard cube along some of its edges to form the flat shape shown, which has an area of 18 square centimeters. What was the volume of the cube in cubic centimeters?",
    examName: "AMC 8",
    examYear: 2025,
    difficulty: "medium",
    topic: "Geometry",
    subtopic: "3D Geometry",
    timeLimit: 3,
    answerChoices: [
      { letter: "A", text: "3√3", isCorrect: true },
      { letter: "B", text: "6", isCorrect: false },
      { letter: "C", text: "9", isCorrect: false },
      { letter: "D", text: "6√3", isCorrect: false },
      { letter: "E", text: "9√3", isCorrect: false }
    ]
  },
  {
    questionNumber: "9",
    questionText: "Ningli looks at the 6 pairs of numbers directly across from each other on a clock. She takes the average of each pair of numbers. What is the average of the resulting 6 numbers?",
    examName: "AMC 8",
    examYear: 2025,
    difficulty: "medium",
    topic: "Statistics",
    subtopic: "Mean and Average",
    timeLimit: 3,
    answerChoices: [
      { letter: "A", text: "5", isCorrect: false },
      { letter: "B", text: "6.5", isCorrect: true },
      { letter: "C", text: "8", isCorrect: false },
      { letter: "D", text: "9.5", isCorrect: false },
      { letter: "E", text: "12", isCorrect: false }
    ]
  }
];

async function addAMC8Questions() {
  try {
    console.log('Starting to add AMC 8 2025 questions...');

    for (const question of amc8Questions) {
      console.log(`Adding question ${question.questionNumber}...`);

      // Create the question
      const createdQuestion = await prisma.question.create({
        data: {
          questionText: question.questionText,
          examName: question.examName,
          examYear: question.examYear,
          questionNumber: question.questionNumber,
          difficulty: question.difficulty,
          topic: question.topic,
          subtopic: question.subtopic,
          timeLimit: question.timeLimit,
          hasImage: false,
        }
      });

      // Add answer choices
      for (const choice of question.answerChoices) {
        await prisma.option.create({
          data: {
            questionId: createdQuestion.id,
            optionLetter: choice.letter,
            optionText: choice.text,
            isCorrect: choice.isCorrect
          }
        });
      }

      console.log(`✓ Added question ${question.questionNumber}: ${question.questionText.substring(0, 50)}...`);
    }

    console.log(`Successfully added ${amc8Questions.length} AMC 8 2025 questions!`);

    // Check total count
    const totalQuestions = await prisma.question.count();
    console.log(`Total questions in database: ${totalQuestions}`);

  } catch (error) {
    console.error('Error adding questions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAMC8Questions();