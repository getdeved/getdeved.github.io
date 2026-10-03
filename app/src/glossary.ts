export type Info = { name: string; what: string; use: string; watch: string }

// Keyed by node kind (see NodeDef.kind; defaults to the icon name).
export const glossary: Record<string, Info> = {
  users: {
    name: 'Users (clients)',
    what: 'Browsers and mobile apps sending requests to your system over HTTP.',
    use: 'They are the source of all traffic. Everything you add exists to serve them faster, more reliably, or for more of them at once.',
    watch: 'You do not control them: they are slow, far away, and arrive in bursts.',
  },
  dns: {
    name: 'DNS',
    what: 'The internet’s phone book. It turns a name like api.mysite.com into the IP address of a server.',
    use: 'Every request starts here. Usually a paid third-party service, not something your servers run.',
    watch: 'Answers are cached, so changing an IP is not instant.',
  },
  geodns: {
    name: 'GeoDNS',
    what: 'A DNS service that answers differently depending on where the user is.',
    use: 'Sends each user to the nearest data center, and away from one that is down.',
    watch: 'Only as good as its health checks, and you must keep data in sync across the sites it points to.',
  },
  server: {
    name: 'Web server',
    what: 'A machine running your application code. It receives requests, talks to the data tier, and returns HTML or JSON.',
    use: 'Where your business logic lives. Several identical servers let you grow and survive a failure.',
    watch: 'If it keeps user state in its own memory, you cannot freely add or remove servers.',
  },
