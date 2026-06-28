import { Calendar, Clock, Shield, Ship } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getLineColor, getLineBadgeColor, TIMELINE_EVENTS } from '@/lib/constants';

const ICON_MAP = { Calendar, Clock, Shield, Ship } as const;

export function TimelineTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-[#800020]">Chronological Family Timeline</h3>
          <p className="text-xs text-stone-500 font-sans">Key events, births, military service, and migration voyages across generations.</p>
        </div>
        <div className="relative border-l-2 border-stone-300 pl-6 ml-4 space-y-8 py-2">
          {TIMELINE_EVENTS.map((event, idx) => {
            const IconComponent = ICON_MAP[event.icon];
            return (
              <div key={idx} className="relative group">
                <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#FAF6F0] shadow-sm ${getLineColor(event.line)}`}>
                  <IconComponent className="w-3 h-3" />
                </div>
                <div className="bg-[#FAF6F0] border border-stone-200 rounded-lg p-4 shadow-sm hover:border-[#800020] transition-all duration-150">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-bold text-[#800020] font-sans">{event.year}</span>
                    <Badge className={getLineBadgeColor(event.line)}>
                      {event.line} Line
                    </Badge>
                  </div>
                  <h4 className="text-base font-bold text-stone-800 mt-1">{event.title}</h4>
                  <p className="text-xs text-stone-600 font-sans mt-1">{event.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-stone-300 bg-[#F4EFE6] shadow-md">
          <CardHeader className="pb-3 border-b border-stone-200">
            <CardTitle className="text-lg font-serif text-[#800020] flex items-center gap-2">
              <Ship className="w-5 h-5" /> Migration Networks
            </CardTitle>
            <CardDescription className="font-sans text-xs text-stone-600">
              Key figures and sponsors in the family's Ingham, North Queensland sugar industry network.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-bold text-stone-800">Pietro Patanè</h4>
              <p className="text-xs text-stone-600 font-sans">
                Cane farm owner at Black Rock, via Ingham, N.Q. Employed Gregorio Emmi and guaranteed accommodation for Rosaria and Concetta on arrival. Shared surname with Rosaria strongly suggests a family connection (possibly brother, cousin, or uncle).
              </p>
              <Badge variant="outline" className="font-sans text-[9px] text-blue-900 border-blue-900/20 bg-blue-50">
                Key Sponsor
              </Badge>
            </div>
            <Separator className="bg-stone-200" />
            <div className="space-y-2">
              <h4 className="font-bold text-stone-800">Piero Lalli</h4>
              <p className="text-xs text-stone-600 font-sans">
                Cane farmer at Blackrock, via Ingham, born Todi, Italy, 6 Feb 1895. Naturalised British subject (1927). First sponsor of Gregorio Emmi's migration application in 1949, listed as a "friend," not a relative. Lalli himself was interned in Australia during WWII (June 1940–Nov 1943).
              </p>
              <Badge variant="outline" className="font-sans text-[9px] text-stone-600 border-stone-300 bg-stone-50">
                Community Contact
              </Badge>
            </div>
            <Separator className="bg-stone-200" />
            <div className="space-y-2">
              <h4 className="font-bold text-stone-800">Leonardo Vecchio</h4>
              <p className="text-xs text-stone-600 font-sans">
                Worked Piero Lalli's cane farm on a share-profit basis (1949), and later co-signed Rosaria's accommodation guarantee with Pietro Patanè at Black Rock (1950). Appears twice in the family's Ingham circle; relationship not yet known (possible connection to Rosaria's mother Venera Vecchio).
              </p>
              <Badge variant="outline" className="font-sans text-[9px] text-emerald-800 border-emerald-800/20 bg-emerald-50">
                Associate
              </Badge>
            </div>
            <Separator className="bg-stone-200" />
            <div className="space-y-2">
              <h4 className="font-bold text-stone-800">Sydney Relocation</h4>
              <p className="text-xs text-stone-600 font-sans">
                Gregorio was buried at Rookwood Catholic Cemetery, Sydney, in 1979, indicating the family (or at least Gregorio) had moved from Ingham, North Queensland to the Sydney area at some point between 1950 and 1979.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
