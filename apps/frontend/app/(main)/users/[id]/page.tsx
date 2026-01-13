/**
 * User Profile Page
 * View user's profile and their uploads
 */

export default async function UserProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">User Profile</h1>
                <p className="text-sm text-muted-foreground">
                    View uploads and activity
                </p>
            </div>

            <div className="text-center py-12 text-muted-foreground">
                <p>Profile page for user: {id}</p>
                <p className="text-sm mt-2">Will implement fully in next session</p>
            </div>
        </div>
    );
}
