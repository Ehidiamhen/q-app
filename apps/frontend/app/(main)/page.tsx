/**
 * Home Page
 * Feed of recent question papers
 */

import { QuestionFeed } from '@/components/questions/question-feed';

export default function HomePage() {
    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Recent Papers</h1>
                <p className="text-sm text-muted-foreground">
                    Browse the latest uploaded question papers
                </p>
            </div>

            <QuestionFeed />
        </div>
    );
}
