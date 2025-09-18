'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MathRenderer } from './MathRenderer';
import { Eye, EyeOff } from 'lucide-react';

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
}

export function MathInput({
  value,
  onChange,
  placeholder = "Enter your answer (supports LaTeX: $x^2$, \\frac{1}{2}, etc.)",
  className = "",
  showPreview = true
}: MathInputProps) {
  const [previewVisible, setPreviewVisible] = useState(showPreview);

  const insertMathSymbol = (symbol: string) => {
    onChange(value + symbol);
  };

  const mathSymbols = [
    { label: 'Fraction', symbol: '\\frac{}{} ' },
    { label: 'Square', symbol: '^2 ' },
    { label: 'Cube', symbol: '^3 ' },
    { label: 'Square Root', symbol: '\\sqrt{} ' },
    { label: 'Pi', symbol: '\\pi ' },
    { label: 'Infinity', symbol: '\\infty ' },
    { label: 'Plus/Minus', symbol: '\\pm ' },
    { label: 'Times', symbol: '\\times ' },
    { label: 'Divide', symbol: '\\div ' },
    { label: 'Not Equal', symbol: '\\neq ' },
    { label: 'Less Equal', symbol: '\\leq ' },
    { label: 'Greater Equal', symbol: '\\geq ' }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        {showPreview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setPreviewVisible(!previewVisible)}
          >
            {previewVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Math Symbol Toolbar */}
      <div className="flex flex-wrap gap-1">
        {mathSymbols.map((symbol) => (
          <Button
            key={symbol.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertMathSymbol(symbol.symbol)}
            className="text-xs h-8"
            title={symbol.label}
          >
            <MathRenderer content={`$${symbol.symbol.replace(/\{\}/g, '{a}')}$`} />
          </Button>
        ))}
      </div>

      {/* Live Preview */}
      {previewVisible && value && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="text-sm text-gray-600 mb-2">Preview:</div>
            <div className="min-h-[2rem] bg-white p-2 rounded border">
              <MathRenderer content={`$${value}$`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Help */}
      <div className="text-xs text-gray-500">
        <details>
          <summary className="cursor-pointer hover:text-gray-700">LaTeX Help</summary>
          <div className="mt-2 space-y-1">
            <div><code>$x^2$</code> → x²</div>
            <div><code>$\\frac{'{1}'}{'{2}'}$</code> → ½</div>
            <div><code>$\\sqrt{'{x}'}$</code> → √x</div>
            <div><code>$x_1$</code> → x₁</div>
            <div><code>$\\pi$</code> → π</div>
            <div><code>$\\infty$</code> → ∞</div>
          </div>
        </details>
      </div>
    </div>
  );
}

// Specialized math input for different answer types
export function FractionInput({
  numerator,
  denominator,
  onNumeratorChange,
  onDenominatorChange,
  className = ""
}: {
  numerator: string;
  denominator: string;
  onNumeratorChange: (value: string) => void;
  onDenominatorChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-sm font-medium">Enter as a fraction:</div>
      <div className="flex items-center gap-3">
        <Input
          value={numerator}
          onChange={(e) => onNumeratorChange(e.target.value)}
          placeholder="Numerator"
          className="w-20 text-center"
        />
        <div className="text-xl">/</div>
        <Input
          value={denominator}
          onChange={(e) => onDenominatorChange(e.target.value)}
          placeholder="Denominator"
          className="w-20 text-center"
        />
      </div>
      {numerator && denominator && (
        <div className="text-center">
          <MathRenderer content={`$\\frac{${numerator}}{${denominator}}$`} />
        </div>
      )}
    </div>
  );
}

// Decimal input with validation
export function DecimalInput({
  value,
  onChange,
  decimals = 2,
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  decimals?: number;
  className?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow only numbers, decimal point, and minus sign
    if (/^-?\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-sm font-medium">Enter decimal answer:</div>
      <Input
        value={value}
        onChange={handleChange}
        placeholder={`0.${'0'.repeat(decimals)}`}
        className="text-center"
        type="text"
        pattern="^-?\d*\.?\d*$"
      />
      {value && !isNaN(Number(value)) && (
        <div className="text-xs text-gray-600 text-center">
          Rounded to {decimals} decimal places: {Number(value).toFixed(decimals)}
        </div>
      )}
    </div>
  );
}