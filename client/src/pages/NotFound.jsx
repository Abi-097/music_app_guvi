import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-5xl font-extrabold">404</h1>
      <p className="mt-2 text-muted-foreground">This page skipped a beat.</p>
      <Button asChild className="mt-6"><Link to="/">Back home</Link></Button>
    </div>
  );
}
