import { createRoot } from 'react-dom/client';
import { SearchPanel } from '../content/SearchPanel';
import '../content/index.css';

const closeSearch = () => window.close();

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeSearch();
  }
});

createRoot(document.getElementById('root')!).render(
  <SearchPanel isOpen={true} onClose={closeSearch} />
);
