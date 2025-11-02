export function Footer() {
  return (
    <footer className="border-t py-4 bg-white dark:bg-black sticky bottom-0 z-50">
      <div className="container mx-auto px-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Neco Box. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
