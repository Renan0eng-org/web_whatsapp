// components/Breadcrumb.tsx
"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

export function BreadcrumbDynamic() {
  const pathname = usePathname();
  const pathSegments = pathname.replace("/admin", "").split("/").filter((segment) => segment);


  return (
    <Breadcrumb >
      <BreadcrumbList className="text-xs md:text-sm">
        {/* Link para a página inicial */}
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin" className="text-text">
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Gera os itens do breadcrumb com base nos segmentos do caminho */}
        {/* {pathSegments.map((segment, index) => {
          const href = `/admin/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLastSegment = index === pathSegments.length - 1;

          return (
            <div key={index} className="flex gap-[2px] md:gap-2 justify-center items-center">
              <BreadcrumbSeparator className=" text-text" />

              <BreadcrumbItem>
                {isLastSegment ? (
                  <BreadcrumbPage className="text-text">
                    {capitalize(segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href} className="text-text">
                    {capitalize(segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })} */}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Função auxiliar para capitalizar a primeira letra de cada segmento
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}