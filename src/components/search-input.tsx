import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function SearchInput({
  placeholder = "Paste wallet address",
}: {
  placeholder?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row">
      <Input placeholder={placeholder} aria-label="Wallet address" />
      <Button variant="primary" className="w-full sm:w-auto" type="button">
        Analyze Wallet
      </Button>
    </div>
  );
}
