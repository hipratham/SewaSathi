export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} SewaSathi. All rights reserved.</p>
        <p className="mt-1">Connecting communities with reliable local services.</p>
      </div>
    </footer>
  );
}
