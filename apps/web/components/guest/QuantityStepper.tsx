"use client";

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center space-x-2 bg-surface-container-low rounded-full p-1 border border-buna/10">
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Decrease quantity"
        className="w-12 h-12 rounded-full bg-white text-buna font-bold text-base flex items-center justify-center shadow-sm hover:bg-teff focus:outline-primary"
      >
        −
      </button>
      <span className="w-8 text-center font-bold text-sm text-buna">{quantity}</span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Increase quantity"
        className="w-12 h-12 rounded-full bg-white text-buna font-bold text-base flex items-center justify-center shadow-sm hover:bg-teff focus:outline-primary"
      >
        +
      </button>
    </div>
  );
}
