import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface RoundProgressProps {
  roundInfo: {
    roundNumber: number;
    totalQuestionsInRound: number;
    attemptedInRound: number;
    completedRounds: number;
  };
  className?: string;
}

export function RoundProgressTracker({ roundInfo, className = "" }: RoundProgressProps) {
  const progressPercentage = roundInfo.totalQuestionsInRound > 0
    ? (roundInfo.attemptedInRound / roundInfo.totalQuestionsInRound) * 100
    : 0;

  const getRoundStatusBadge = () => {
    if (roundInfo.roundNumber === 1 && roundInfo.attemptedInRound === 0) {
      return <Badge variant="default">Starting Fresh</Badge>;
    }

    if (progressPercentage === 100) {
      return <Badge variant="default" className="bg-green-500">Round Complete</Badge>;
    }

    if (roundInfo.roundNumber === 1) {
      return <Badge variant="secondary">First Round</Badge>;
    }

    return <Badge variant="outline">Round {roundInfo.roundNumber}</Badge>;
  };

  const getProgressMessage = () => {
    if (roundInfo.roundNumber === 1 && roundInfo.attemptedInRound === 0) {
      return "You'll see each question for the first time";
    }

    if (progressPercentage === 100) {
      return `Ready for Round ${roundInfo.roundNumber + 1} - focusing on practice areas`;
    }

    const remaining = roundInfo.totalQuestionsInRound - roundInfo.attemptedInRound;
    if (roundInfo.roundNumber === 1) {
      return `${remaining} new questions remaining in your first round`;
    }

    return `${remaining} questions left before Round ${roundInfo.roundNumber + 1}`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Practice Progress</CardTitle>
          {getRoundStatusBadge()}
        </div>
        <CardDescription className="text-sm">
          {getProgressMessage()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Round {roundInfo.roundNumber} Progress</span>
            <span className="font-medium">
              {roundInfo.attemptedInRound}/{roundInfo.totalQuestionsInRound}
            </span>
          </div>

          <Progress
            value={progressPercentage}
            className="h-2"
          />

          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="font-semibold text-blue-600">{roundInfo.roundNumber}</div>
              <div className="text-gray-500">Current Round</div>
            </div>
            <div>
              <div className="font-semibold text-green-600">{roundInfo.completedRounds}</div>
              <div className="text-gray-500">Completed</div>
            </div>
            <div>
              <div className="font-semibold text-purple-600">
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-gray-500">Round Progress</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}