'use client';

import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { useParams } from "next/navigation";
import TextEditor from "@/components/TextEditor";

export default function EditorPage() {
    const { socket } = useSocket();
    const params = useParams();
    const documentID = Number(params.id);

    const [doc, setDoc] = useState<{ title: string; delta: any } | null>(null);

    // Join and leave document room
    useEffect(() => {
        if (!socket || !documentID) return;

        socket.emit("join-document", { documentID });

        const handleJoin = (payload: { title: string; delta: any }) => {
            setDoc({ title: payload.title, delta: payload.delta });
        }

        socket.on("document-joined", handleJoin);

        return () => {
            socket.off("document-joined", handleJoin);
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
                delta={doc.delta}
                socket={socket!}
            />
        </div>
    );
}