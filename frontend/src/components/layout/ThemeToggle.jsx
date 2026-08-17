import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme';
import { Button } from '@/components/ui/button';

export function ThemeToggle({ className }) {
  const { theme, toggle } = useThemeStore();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  );
}
