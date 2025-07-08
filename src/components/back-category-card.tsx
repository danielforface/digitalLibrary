
'use client';

import { Card } from '@/components/ui/card';
import { CornerUpLeft } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

type BackCategoryCardProps = {
    parentPath: string;
    onSelectCategory: (path: string) => void;
};

export default function BackCategoryCard({ parentPath, onSelectCategory }: BackCategoryCardProps) {
    const { t } = useLanguage();

    return (
        <Card className="group relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 bg-secondary/30 hover:bg-secondary/50">
            <button
                onClick={() => onSelectCategory(parentPath)}
                className={cn(
                    "w-full h-full p-6 flex flex-col items-start justify-between text-left"
                )}
            >
                <div className="flex items-center gap-3">
                    <CornerUpLeft className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-headline font-semibold text-foreground">{t('go_back')}</h3>
                    </div>
                </div>
            </button>
        </Card>
    );
}
