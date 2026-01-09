import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export default function BtnVoltar({className}: {className?: string}) {

    const router = useRouter();

    return (
        <Button variant="outline" size="icon" onClick={() => router.back()} className={cn("absolute top-0 left-8 xxl:left-[-70px] xxl:top-6 rounded-full text-muted-foreground hover:text-white hover:border-primary hover:bg-primary", className)}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
    );
}
