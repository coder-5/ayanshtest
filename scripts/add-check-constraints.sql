-- Add CHECK constraints to ensure data integrity
-- Run this after your next Prisma migration

-- UserAttempt constraints
-- Ensure timeSpent is non-negative and reasonable (max 2 hours = 7200 seconds)
ALTER TABLE "user_attempts"
ADD CONSTRAINT check_time_spent_positive
CHECK (time_spent >= 0 AND time_spent <= 7200);

-- Ensure hintsUsed is non-negative and reasonable (max 10 hints per question)
ALTER TABLE "user_attempts"
ADD CONSTRAINT check_hints_used_positive
CHECK (hints_used >= 0 AND hints_used <= 10);

-- ExamSchedule constraints
-- Ensure score is non-negative (no penalty for wrong answers)
ALTER TABLE "ExamSchedule"
ADD CONSTRAINT check_score_non_negative
CHECK (score IS NULL OR score >= 0);

-- Ensure maxScore is positive when specified
ALTER TABLE "ExamSchedule"
ADD CONSTRAINT check_max_score_positive
CHECK (max_score IS NULL OR max_score > 0);

-- Ensure score doesn't exceed maxScore when both are specified
ALTER TABLE "ExamSchedule"
ADD CONSTRAINT check_score_within_max
CHECK (score IS NULL OR max_score IS NULL OR score <= max_score);

-- Ensure percentile is between 0 and 100
ALTER TABLE "ExamSchedule"
ADD CONSTRAINT check_percentile_range
CHECK (percentile IS NULL OR (percentile >= 0.0 AND percentile <= 100.0));