'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Target, AlertCircle, Play, Settings } from 'lucide-react';
import Link from 'next/link';
import { TimedChallenge } from '@/components/practice/TimedChallenge';

interface ChallengeConfig {
  examType: string;
  duration: number; // in minutes
  questionCount: number;
  difficulty?: string;
}

const CHALLENGE_PRESETS = {
  'AMC8_FULL': {
    examType: 'amc8',
    duration: 40,
    questionCount: 25,
    name: 'AMC 8 Full Exam',
    description: '25 questions in 40 minutes'
  },
  'AMC8_SPRINT': {
    examType: 'amc8',
    duration: 20,
    questionCount: 15,
    name: 'AMC 8 Sprint',
    description: '15 questions in 20 minutes'
  },
  'MOEMS_FULL': {
    examType: 'moems',
    duration: 30,
    questionCount: 5,
    name: 'MOEMS Full Round',
    description: '5 questions in 30 minutes'
  },
  'KANGAROO_SPRINT': {
    examType: 'kangaroo',
    duration: 25,
    questionCount: 20,
    name: 'Kangaroo Sprint',
    description: '20 questions in 25 minutes'
  },
  'MATHCOUNTS_SPRINT': {
    examType: 'mathcounts',
    duration: 40,
    questionCount: 30,
    name: 'MathCounts Sprint',
    description: '30 questions in 40 minutes'
  },
  'CUSTOM': {
    examType: 'mixed',
    duration: 15,
    questionCount: 10,
    name: 'Custom Challenge',
    description: 'Create your own challenge'
  }
};

export default function TimedChallengePage() {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customConfig, setCustomConfig] = useState<ChallengeConfig>({
    examType: 'amc8',
    duration: 15,
    questionCount: 10
  });
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeConfig, setChallengeConfig] = useState<ChallengeConfig | null>(null);

  const startChallenge = () => {
    if (selectedPreset === 'CUSTOM') {
      setChallengeConfig(customConfig);
    } else if (selectedPreset) {
      const preset = CHALLENGE_PRESETS[selectedPreset as keyof typeof CHALLENGE_PRESETS];
      setChallengeConfig({
        examType: preset.examType,
        duration: preset.duration,
        questionCount: preset.questionCount
      });
    }
    setShowChallenge(true);
  };

  const handleChallengeComplete = (_results: any) => {
    setShowChallenge(false);
    setChallengeConfig(null);
    setSelectedPreset('');
    // You could redirect to a results page or show results modal here
  };

  const handleBackToSetup = () => {
    setShowChallenge(false);
    setChallengeConfig(null);
  };

  if (showChallenge && challengeConfig) {
    return (
      <TimedChallenge
        config={challengeConfig}
        onComplete={handleChallengeComplete}
        onBack={handleBackToSetup}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <Clock className="h-10 w-10 text-red-600" />
          Timed Challenges
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Test your speed and accuracy with real competition timing
        </p>
      </div>

      {/* Challenge Selection */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Preset Challenges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Choose Your Challenge
            </CardTitle>
            <CardDescription>
              Select a pre-made challenge or create your own custom timed session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(CHALLENGE_PRESETS).map(([key, preset]) => (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPreset === key ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedPreset(key)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{preset.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {preset.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{preset.duration}m</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-gray-500" />
                        <span>{preset.questionCount}q</span>
                      </div>
                    </div>
                    {key !== 'CUSTOM' && (
                      <Badge variant="outline" className="mt-2 capitalize">
                        {preset.examType}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Configuration */}
        {selectedPreset === 'CUSTOM' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Custom Challenge Setup
              </CardTitle>
              <CardDescription>
                Configure your own timed challenge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Exam Type</label>
                  <Select
                    value={customConfig.examType}
                    onValueChange={(value) => setCustomConfig(prev => ({ ...prev, examType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amc8">AMC 8</SelectItem>
                      <SelectItem value="moems">MOEMS</SelectItem>
                      <SelectItem value="kangaroo">Math Kangaroo</SelectItem>
                      <SelectItem value="mathcounts">MathCounts</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <Select
                    value={customConfig.duration.toString()}
                    onValueChange={(value) => setCustomConfig(prev => ({ ...prev, duration: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="40">40 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Number of Questions</label>
                  <Select
                    value={customConfig.questionCount.toString()}
                    onValueChange={(value) => setCustomConfig(prev => ({ ...prev, questionCount: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 questions</SelectItem>
                      <SelectItem value="10">10 questions</SelectItem>
                      <SelectItem value="15">15 questions</SelectItem>
                      <SelectItem value="20">20 questions</SelectItem>
                      <SelectItem value="25">25 questions</SelectItem>
                      <SelectItem value="30">30 questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Challenge Preview</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      You'll have {customConfig.duration} minutes to solve {customConfig.questionCount} {customConfig.examType} questions.
                      That's an average of {Math.round((customConfig.duration * 60) / customConfig.questionCount)} seconds per question.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Challenge */}
        {selectedPreset && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center gap-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Ready to start?</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    Once you begin, the timer will start immediately. Make sure you're ready to focus!
                  </p>
                </div>

                <Button
                  onClick={startChallenge}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Challenge
                </Button>

                <div className="flex justify-center">
                  <Button variant="ghost" asChild>
                    <Link href="/practice">← Back to Practice</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!selectedPreset && (
          <Card>
            <CardHeader>
              <CardTitle>How Timed Challenges Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Choose Your Challenge</h4>
                  <p className="text-sm text-gray-600">Select from pre-made exam simulations or create a custom challenge</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Race Against Time</h4>
                  <p className="text-sm text-gray-600">Answer questions as quickly and accurately as possible</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Review Your Performance</h4>
                  <p className="text-sm text-gray-600">See detailed results with timing analysis and accuracy breakdown</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}