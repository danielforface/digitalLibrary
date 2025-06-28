import DigitalArchiveApp from '@/components/digital-archive-app';
import { getArchiveItems, getCategoryPaths } from '@/app/actions';

export default async function Home() {
  // Fetch initial data on the server
  const [itemData, categoryData] = await Promise.all([
    getArchiveItems(),
    getCategoryPaths(),
  ]);

  return (
    <main>
      <DigitalArchiveApp 
        initialItems={itemData} 
        initialCategories={categoryData}
      />
    </main>
  );
}
