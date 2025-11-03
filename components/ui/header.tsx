import { ModeToggle } from "./mode-toggle";

export function Header() {
  return (
    <header className="w-full border-b bg-white dark:bg-black sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Neco Box</h1>
        <ModeToggle />
      </div>
    </header>
  );
}
