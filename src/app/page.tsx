import DigitalArchiveApp from '@/components/digital-archive-app';
import { getArchiveItems, getCategoryPaths } from '@/app/actions';
import { checkAuth } from './auth-actions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch initial data on the server
  const [itemData, categoryData, authStatus] = await Promise.all([
    getArchiveItems(),
    getCategoryPaths(),
    checkAuth(),
  ]);

  return (
    <main>
      <DigitalArchiveApp 
        initialItems={itemData} 
        initialCategories={categoryData}
        initialIsAuthenticated={authStatus.isAuthenticated}
      />
    </main>
  );
}
