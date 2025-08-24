'use client';

import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { useParams } from "next/navigation";
import TextEditor from "@/components/TextEditor";

export default function EditorPage() {
    const apiURL = process.env.NEXT_PUBLIC_API_URL;
    const { socket } = useSocket();
    const params = useParams();
    const documentID = Number(params.id);

    const [doc, setDoc] = useState<any>(null);

    // Join and leave document room
    useEffect(() => {
        if (!socket || !documentID) return;

        socket.emit("join-document", { documentID });

        // Fetch document data
        fetch(`${apiURL}/document/${documentID}`)
            .then((res) => res.json())
            .then((data) => setDoc(data));

        return () => {
            socket.emit("leave-document", { documentID });
        }
    }, [socket, documentID]);

    if (!doc) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-[80vw] justify-self-center">
            <h1 className="text-3xl mb-4">{doc.title}</h1>
            <TextEditor
                documentID={documentID}
                title={doc.title}
                content={doc.content}
                socket={socket!}
            />
        </div>
    )
}