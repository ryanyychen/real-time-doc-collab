'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// frontend/src/app/page.tsx
export default function Home() {
    const apiURL = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${apiURL}/documents`)
            .then(res => res.json())
            .then(data => setDocs(data))
            .finally(() => setLoading(false));
    }, []);

    async function createDocument() {
        try {
            const res = await fetch(`${apiURL}/create_document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Untitled Document', content: '' })
            });
            const data = await res.json();
            if (data.id) {
                router.push(`/editor/${data.id}`);
            }
        } catch (error) {
            console.error("Error creating document", error);
        }
    }

    async function deleteDocument(id: number) {
        try {
            const res = await fetch(`${apiURL}/document/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setDocs(docs.filter(doc => doc.id !== id));
            }
        } catch (error) {
            console.error("Error deleting document", error);
        }
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <main className="flex min-h-screen flex-col items-center bg-gray-50">
            <div className="grid grid-cols-5 gap-4">
                <div
                    key={0}
                    className="document-card"
                    onClick={() => createDocument()}
                >
                    <h2 className="font-bold">+ New Document</h2>
                </div>
                {docs.map((doc: { id: number; title: string; content: string; created_at: string; updated_at: string; }) => (
                    <div
                        key={doc.id}
                        className="document-card relative"
                        onClick={() => router.push(`/editor/${doc.id}`)}
                    >
                        <h2 className="font-bold">{doc.title}</h2>
                        <p>{doc.content}</p>
                        <button
                            className="absolute top-2 right-2 p-2 text-sm text-red bg-red border rounded-full cursor-pointer z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteDocument(doc.id);
                            }}
                        >
                            x
                        </button>
                    </div>
                ))}
            </div>
        </main>
    );
}