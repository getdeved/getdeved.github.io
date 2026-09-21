// The one icon standard for the whole app: Lucide (MIT). Add names here, nowhere else.
import {
  Activity, Archive, Bell, Boxes, Bug, Building2, ChartColumn, Clock, Cloud, Cog, CreditCard, Database,
  FileText, Film, Filter, Fingerprint, Folder, Gauge, Globe, HardDrive, Hash, Inbox, KeyRound, Laptop,
  Layers, Lock, Mail, Map, MapPin, MessageSquare, Navigation, Network, Radio, ScrollText, Search, Send,
  Server, Share2, ShieldCheck, Smartphone, Split, Ticket, Timer, TrendingUp, Trophy, Users, Wallet, Wifi, Zap,
} from 'lucide-react'

export const icons = {
  users: Users, client: Laptop, dns: Globe, geodns: MapPin, server: Server, db: Database,
  replica: HardDrive, cache: Zap, cdn: Globe, lb: Split, session: KeyRound,
  queue: Inbox, worker: Cog, monitor: Activity, dc: Building2,
  // used by the other topics
  search: Search, crawler: Bug, doc: FileText, bell: Bell, mail: Mail, chat: MessageSquare, phone: Smartphone,
  share: Share2, film: Film, cloud: Cloud, disk: HardDrive, folder: Folder, pin: MapPin, map: Map, nav: Navigation,
  radio: Radio, wifi: Wifi, clock: Clock, lock: Lock, card: CreditCard, wallet: Wallet, trend: TrendingUp,
  trophy: Trophy, chart: ChartColumn, layers: Layers, hash: Hash, finger: Fingerprint, shield: ShieldCheck,
  gauge: Gauge, filter: Filter, archive: Archive, boxes: Boxes, log: ScrollText, timer: Timer, ring: Network,
  ticket: Ticket, send: Send,
}

export type IconName = keyof typeof icons
