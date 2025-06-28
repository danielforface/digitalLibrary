
'use client';

import { Card } from '@/components/ui/card';
import { Folder } from 'lucide-react';
import type { CategoryNode } from '@/lib/types';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

type CategoryCardProps = {
    node: CategoryNode;
    onSelectCategory: (path: string) => void;
};

export default function CategoryCard({ node, onSelectCategory }: CategoryCardProps) {
    const { t } = useLanguage();

    const itemsText = node.itemCount === 1 ? t('one_item') : t('item_count', { count: node.itemCount });

    return (
        <Card className="group relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 bg-secondary/30 hover:bg-secondary/50">
            <button
                onClick={() => onSelectCategory(node.path)}
                className={cn(
                    "w-full h-full p-6 flex flex-col items-start justify-between text-left"
                )}
            >
                <div className="flex items-center gap-3">
                    <Folder className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-headline font-semibold text-foreground">{node.name}</h3>
                        <p className="text-sm text-muted-foreground">{itemsText}</p>
                    </div>
                </div>
                <div className="mt-4">
                    <span className="text-sm text-primary group-hover:underline">{t('open_folder')}</span>
                </div>
            </button>
        </Card>
    );
}
