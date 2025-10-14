'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function FormulasPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const formulas = {
    'Area & Perimeter': [
      { name: 'Circle Area', formula: 'A = πr²', description: 'r = radius' },
      { name: 'Circle Circumference', formula: 'C = 2πr', description: 'r = radius' },
      { name: 'Rectangle Area', formula: 'A = l × w', description: 'l = length, w = width' },
      {
        name: 'Rectangle Perimeter',
        formula: 'P = 2(l + w)',
        description: 'l = length, w = width',
      },
      { name: 'Triangle Area', formula: 'A = ½bh', description: 'b = base, h = height' },
      {
        name: "Triangle Area (Heron's)",
        formula: 'A = √[s(s-a)(s-b)(s-c)]',
        description: 's = (a+b+c)/2',
      },
      {
        name: 'Trapezoid Area',
        formula: 'A = ½h(b₁ + b₂)',
        description: 'h = height, b₁, b₂ = parallel sides',
      },
      { name: 'Square Area', formula: 'A = s²', description: 's = side length' },
      { name: 'Square Perimeter', formula: 'P = 4s', description: 's = side length' },
    ],
    Volume: [
      { name: 'Cube', formula: 'V = s³', description: 's = side length' },
      {
        name: 'Rectangular Prism',
        formula: 'V = lwh',
        description: 'l = length, w = width, h = height',
      },
      { name: 'Cylinder', formula: 'V = πr²h', description: 'r = radius, h = height' },
      { name: 'Sphere', formula: 'V = (4/3)πr³', description: 'r = radius' },
      { name: 'Cone', formula: 'V = (1/3)πr²h', description: 'r = radius, h = height' },
      { name: 'Pyramid', formula: 'V = (1/3)Bh', description: 'B = base area, h = height' },
    ],
    'Number Theory': [
      {
        name: 'Divisibility by 2',
        formula: 'Last digit is even',
        description: 'Ends in 0, 2, 4, 6, 8',
      },
      {
        name: 'Divisibility by 3',
        formula: 'Sum of digits divisible by 3',
        description: 'e.g., 123: 1+2+3=6 (divisible)',
      },
      {
        name: 'Divisibility by 4',
        formula: 'Last 2 digits divisible by 4',
        description: 'e.g., 316',
      },
      { name: 'Divisibility by 5', formula: 'Last digit is 0 or 5', description: 'Ends in 0 or 5' },
      {
        name: 'Divisibility by 9',
        formula: 'Sum of digits divisible by 9',
        description: 'e.g., 729: 7+2+9=18',
      },
      {
        name: 'GCD Formula',
        formula: 'gcd(a,b) = gcd(b, a mod b)',
        description: 'Euclidean algorithm',
      },
      { name: 'LCM Formula', formula: 'lcm(a,b) = (a × b) / gcd(a,b)', description: 'Using GCD' },
    ],
    Combinatorics: [
      {
        name: 'Permutations',
        formula: 'P(n,r) = n!/(n-r)!',
        description: 'Order matters. n objects, choose r',
      },
      {
        name: 'Combinations',
        formula: 'C(n,r) = n!/[r!(n-r)!]',
        description: "Order doesn't matter",
      },
      {
        name: 'Permutations with Repetition',
        formula: 'n^r',
        description: 'r choices from n options with replacement',
      },
      {
        name: 'Circular Permutations',
        formula: '(n-1)!',
        description: 'Arranging n objects in a circle',
      },
    ],
    Probability: [
      {
        name: 'Basic Probability',
        formula: 'P(A) = (Favorable outcomes) / (Total outcomes)',
        description: '',
      },
      {
        name: 'Complement Rule',
        formula: "P(A') = 1 - P(A)",
        description: 'Probability of not A',
      },
      {
        name: 'Addition Rule',
        formula: 'P(A ∪ B) = P(A) + P(B) - P(A ∩ B)',
        description: 'For any two events',
      },
      {
        name: 'Multiplication Rule (Independent)',
        formula: 'P(A ∩ B) = P(A) × P(B)',
        description: 'When A and B are independent',
      },
      {
        name: 'Conditional Probability',
        formula: 'P(A|B) = P(A ∩ B) / P(B)',
        description: 'Probability of A given B',
      },
    ],
    'Algebraic Identities': [
      { name: 'Square of Sum', formula: '(a + b)² = a² + 2ab + b²', description: '' },
      { name: 'Square of Difference', formula: '(a - b)² = a² - 2ab + b²', description: '' },
      { name: 'Difference of Squares', formula: 'a² - b² = (a + b)(a - b)', description: '' },
      { name: 'Cube of Sum', formula: '(a + b)³ = a³ + 3a²b + 3ab² + b³', description: '' },
      { name: 'Cube of Difference', formula: '(a - b)³ = a³ - 3a²b + 3ab² - b³', description: '' },
      { name: 'Sum of Cubes', formula: 'a³ + b³ = (a + b)(a² - ab + b²)', description: '' },
      { name: 'Difference of Cubes', formula: 'a³ - b³ = (a - b)(a² + ab + b²)', description: '' },
    ],
    'Sequences & Series': [
      {
        name: 'Arithmetic Sequence',
        formula: 'aₙ = a₁ + (n-1)d',
        description: 'd = common difference',
      },
      {
        name: 'Arithmetic Series Sum',
        formula: 'Sₙ = n/2[2a₁ + (n-1)d]',
        description: 'or Sₙ = n/2(a₁ + aₙ)',
      },
      {
        name: 'Geometric Sequence',
        formula: 'aₙ = a₁ × r^(n-1)',
        description: 'r = common ratio',
      },
      {
        name: 'Geometric Series Sum',
        formula: 'Sₙ = a₁(1-r^n)/(1-r)',
        description: 'r ≠ 1',
      },
      {
        name: 'Sum of First n Natural Numbers',
        formula: 'Σn = n(n+1)/2',
        description: '1+2+3+...+n',
      },
      {
        name: 'Sum of Squares',
        formula: 'Σn² = n(n+1)(2n+1)/6',
        description: '1²+2²+3²+...+n²',
      },
    ],
    'Distance & Speed': [
      { name: 'Distance', formula: 'd = rt', description: 'r = rate/speed, t = time' },
      { name: 'Speed', formula: 'r = d/t', description: 'd = distance, t = time' },
      { name: 'Time', formula: 't = d/r', description: 'd = distance, r = rate' },
      {
        name: 'Average Speed',
        formula: 'avg = Total Distance / Total Time',
        description: 'Not average of speeds!',
      },
    ],
    Trigonometry: [
      { name: 'Pythagorean Theorem', formula: 'a² + b² = c²', description: 'c = hypotenuse' },
      { name: 'Sine', formula: 'sin θ = opposite/hypotenuse', description: '' },
      { name: 'Cosine', formula: 'cos θ = adjacent/hypotenuse', description: '' },
      { name: 'Tangent', formula: 'tan θ = opposite/adjacent', description: '' },
      { name: 'Pythagorean Identity', formula: 'sin²θ + cos²θ = 1', description: '' },
    ],
  };

  const filteredFormulas = Object.entries(formulas).reduce(
    (acc, [category, items]) => {
      const filtered = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category as keyof typeof formulas] = filtered;
      }
      return acc;
    },
    {} as Record<string, (typeof formulas)[keyof typeof formulas]>
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Ayansh Math Prep
          </Link>
          <nav className="flex gap-4">
            <Link href="/practice" className="text-gray-600 hover:text-indigo-600">
              Practice
            </Link>
            <Link href="/progress" className="text-gray-600 hover:text-indigo-600">
              Progress
            </Link>
            <Link href="/exams" className="text-gray-600 hover:text-indigo-600">
              Exams
            </Link>
            <Link href="/achievements" className="text-gray-600 hover:text-indigo-600">
              Achievements
            </Link>
            <Link href="/library" className="text-gray-600 hover:text-indigo-600">
              Library
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Formula Reference Sheet</h1>
          <p className="text-gray-600 mb-4">Quick access to essential math formulas</p>

          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search formulas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Print
            </button>
          </div>
        </div>

        <div className="print:block hidden mb-6">
          <h1 className="text-3xl font-bold text-center mb-2">Math Formula Reference Sheet</h1>
          <p className="text-center text-gray-600">Ayansh Math Prep</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(filteredFormulas).map(([category, items]) => (
            <div key={category} className="bg-white rounded-lg shadow-md p-6 break-inside-avoid">
              <h2 className="text-xl font-bold text-indigo-600 mb-4 border-b-2 border-indigo-100 pb-2">
                {category}
              </h2>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-indigo-200 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="font-mono text-indigo-700 bg-indigo-50 px-3 py-2 rounded mb-1">
                      {item.formula}
                    </p>
                    {item.description && (
                      <p className="text-sm text-gray-600 italic">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {Object.keys(filteredFormulas).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No formulas found matching your search.</p>
          </div>
        )}

        <div className="mt-8 text-center print:hidden">
          <Link
            href="/practice"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Back to Practice
          </Link>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
