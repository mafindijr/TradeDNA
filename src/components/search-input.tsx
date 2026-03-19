import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function SearchInput({
  placeholder = "Paste wallet address",
  value,
  onChange,
  onAnalyze,
  isLoading = false,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onAnalyze?: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row">
      <Input
        placeholder={placeholder}
        aria-label="Wallet address"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
      <Button
        variant="primary"
        className="w-full sm:w-auto"
        type="button"
        onClick={onAnalyze}
        disabled={isLoading}
      >
        {isLoading ? "Analyzing..." : "Analyze Wallet"}
      </Button>
    </div>
  );
}
