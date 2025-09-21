import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  className?: string;
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  className,
  showRetry = true,
  showHome = false,
  onRetry,
  type = 'error'
}: ErrorDisplayProps) {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
      case 'info':
        return <AlertTriangle className="h-12 w-12 text-blue-500" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-red-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'warning':
        return {
          title: 'text-yellow-800',
          description: 'text-yellow-600'
        };
      case 'info':
        return {
          title: 'text-blue-800',
          description: 'text-blue-600'
        };
      default:
        return {
          title: 'text-red-800',
          description: 'text-red-600'
        };
    }
  };

  const colors = getColors();

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        <CardTitle className={colors.title}>{title}</CardTitle>
        <CardDescription className={colors.description}>
          {message}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {showRetry && (
          <Button
            onClick={onRetry || (() => window.location.reload())}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        {showHome && (
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function InlineError({
  message,
  className,
  type = 'error'
}: {
  message: string;
  className?: string;
  type?: 'error' | 'warning' | 'info';
}) {
  const getColors = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-red-50 text-red-800 border-red-200';
    }
  };

  return (
    <div className={cn(
      'p-3 rounded-md border text-sm flex items-center gap-2',
      getColors(),
      className
    )}>
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon = AlertTriangle,
  title,
  description,
  action,
  className
}: {
  icon?: any;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('text-center py-12', className)}>
      <Icon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6">{description}</p>
      )}
      {action && action}
    </div>
  );
}