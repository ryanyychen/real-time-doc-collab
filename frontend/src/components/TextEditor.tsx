'use client';

import { Socket } from "socket.io-client";
import { useRef, useEffect } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

interface TextEditorProps {
    documentID: number;
    title: string;
    content: string;
    socket: Socket;
}

const TextEditor: React.FC<TextEditorProps> = ({ documentID, title, content, socket }) => {
    const { quill, quillRef } = useQuill();

    // Populate text editor with previously saved content
    useEffect(() => {
        if (quill && content) {
            quill.setText(content);
        }
    }, [quill, content]);

    // Track content changes
    useEffect(() => {
        if (!quill) return;

        const handleTextChange = (delta: any, deltaOld: any, source: string) => {
            console.log(delta);
            if (source === 'user') {
                socket.emit('edit', {
                    documentID,
                    title,
                    delta,
                });
            }
        };
        
        quill.on('text-change', handleTextChange);

        const handleBeforeUnload = () => {
            const fullContent = quill.getContents();
            socket.emit('edit', {
                documentID,
                title,
                fullContent,
            });
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            quill.off('text-change', handleTextChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [quill, documentID, title, socket]);

    // Update document as broadcast by server
    useEffect(() => {
        const handleUpdate = (delta: any) => {
            console.log("Delta:", delta);
            if (!delta) return;
            if (quill) {
                quill.updateContents(delta);
            }
        };

        socket.on("update-document", handleUpdate);

        return () => {
            socket.off("update-document", handleUpdate)
        }
    }, [quill, documentID, socket])

    return (
        <div className="h-[80vh]">
            <div ref={quillRef} />
        </div>
    )
}

export default TextEditor;