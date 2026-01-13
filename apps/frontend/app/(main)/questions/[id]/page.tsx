/**
 * Question Detail Page
 * View full question paper with images
 */

export default async function QuestionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Question Paper</h1>
                <p className="text-sm text-muted-foreground">View full details</p>
            </div>

            <div className="text-center py-12 text-muted-foreground">
                <p>Question detail for: {id}</p>
                <p className="text-sm mt-2">Will implement fully in next session</p>
            </div>
        </div>
    );
}
