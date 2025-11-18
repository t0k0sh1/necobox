import { Button } from "@/components/ui/button";
import { Dices, Globe, Key, Lock, Type } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-start justify-center py-4 px-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          <Link href="/random" className="block">
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Lock className="w-10 h-10" />
              <span className="text-sm">Password Generator</span>
            </Button>
          </Link>
          <Link href="/random-integer" className="block">
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Dices className="w-10 h-10" />
              <span className="text-sm">Random Integer Generator</span>
            </Button>
          </Link>
          <Link href="/dummy-text" className="block">
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Type className="w-10 h-10" />
              <span className="text-sm">Dummy Text Generator</span>
            </Button>
          </Link>
          <Link href="/show-gip" className="block">
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Globe className="w-10 h-10" />
              <span className="text-sm">Show Global IP</span>
            </Button>
          </Link>
          <Link href="/jwt-decoder" className="block">
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <Key className="w-10 h-10" />
              <span className="text-sm">JWT Decoder</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
