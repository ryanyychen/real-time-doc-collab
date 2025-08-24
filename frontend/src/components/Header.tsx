'use client';

import { useRouter } from "next/navigation";

const Header: React.FC = () => {
    const router = useRouter();
    return (
        <div>
            <h1
                className="text-4xl font-bold m-8 justify-self-center cursor-pointer"
                onClick={() => router.push(`/`)}
            >
                Doodle Docs
            </h1>
        </div>
    )
}

export default Header;