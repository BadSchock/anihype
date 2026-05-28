import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'src');

const replacements = [
  ['text-white/40', 'text-muted-foreground'],
  ['text-white/50', 'text-muted-foreground'],
  ['text-white/60', 'text-muted-foreground'],
  ['text-white/30', 'text-muted-foreground'],
  ['text-white/70', 'text-foreground/80'],
  ['text-white/80', 'text-foreground/90'],
  ['text-white/25', 'text-muted-foreground/50'],
  ['hover:text-white', 'hover:text-foreground'],
  ['bg-white/5', 'bg-muted'],
  ['bg-white/10', 'bg-muted'],
  ['hover:bg-white/20', 'hover:bg-muted'],
  ['hover:bg-white/10', 'hover:bg-muted'],
  ['border-white/10', 'border-border'],
  ['border-white/5', 'border-border'],
  ['divide-white/5', 'divide-border'],
  ['text-white', 'text-foreground'],
  ['bg-[#0F1115]', 'bg-background'],
];

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (file.endsWith('.tsx')) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const [from, to] of replacements) {
        if (content.includes(from)) {
          content = content.split(from).join(to);
          changed = true;
        }
      }
      // Botões primários mantêm texto branco no label
      content = content.replace(/btn-primary([^"]*)text-foreground/g, 'btn-primary$1text-primary-foreground');
      content = content.replace(/bg-purple-600([^"]*)text-foreground/g, 'bg-purple-600$1text-primary-foreground');
      if (changed) fs.writeFileSync(full, content);
    }
  }
}

walk(root);
console.log('Theme colors updated');
