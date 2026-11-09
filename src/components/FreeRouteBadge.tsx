import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Leaf } from 'lucide-react';

interface RouteInfo { free: string[]; paid: string }

export function FreeRouteBadge({ institution }: { institution: string | null }) {
  const [info, setInfo] = useState<RouteInfo | null>(null);

  useEffect(() => {
    if (!institution) return;
    fetch('/api/free-routes')
      .then((r) => r.json())
      .then((d) => {
        const route = d.routes?.[institution];
        if (route) setInfo(route);
      })
      .catch(() => {});
  }, [institution]);

  if (!info || !info.free || info.free.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="text-[9px] bg-green-100 text-green-800 border-green-300 cursor-help flex items-center gap-1">
            <Leaf className="w-2.5 h-2.5" /> free route
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">
          <div className="font-medium mb-1">Free alternatives for {institution}:</div>
          <ul className="list-disc list-inside space-y-0.5">
            {info.free.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
          {info.paid && <div className="mt-1 text-stone-500 italic">Paid: {info.paid}</div>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}