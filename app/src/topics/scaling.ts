import type { NodeDef, Topic } from '../types'

// Fixed canvas positions (1000x600) so the final diagram is laid out once, by hand.
const n = (id: string, label: string, icon: NodeDef['icon'], x: number, y: number, sub?: string): NodeDef =>
  ({ id, label, icon, x, y, sub })

export const scaling: Topic = {
  id: 'scaling',
  title: 'Scale from zero to millions of users',
  intro:
    'You start with one server. Each step below is a problem real systems hit as users grow. Pick the fix, see what it buys you and what it costs, and watch the architecture evolve.',
  recap: [
    'Keep the web tier stateless.',
    'Build redundancy at every tier: no single point of failure.',
    'Cache what is read often, and put static files on a CDN.',
    'Decouple slow work with queues.',
    'Scale the data tier by sharding when one database is not enough.',
    'Logs, metrics and automation are not optional once you have more than a few servers.',
  ],
  steps: [
    {
      id: 'single-server',
      title: 'What happens when someone opens your site?',
      situation:
        'A user types api.mysite.com into a browser. Your whole app (web code, database, cache) runs on one server. What happens first?',
      options: [
        {
          id: 'dns', label: 'The browser asks DNS for the server’s IP address', verdict: 'best',
          feedback:
            'Right. Browsers route by IP address, not by name. DNS (usually a paid third-party service, not run by your server) translates the name into an IP. Only then is the HTTP request sent, and the server replies with HTML or JSON.',
          add: {
            nodes: [n('users', 'Users', 'users', 70, 300, 'web + mobile'), n('dns', 'DNS', 'dns', 190, 120), { ...n('box', 'Single server', 'server', 560, 300, 'web + DB + cache'), kind: 'box' }],
            edges: [{ from: 'users', to: 'dns', label: '1 · look up IP' }, { from: 'users', to: 'box', label: '2 · HTTP request' }],
          },
          delta: { capacity: 0 },
        },
        {
          id: 'http', label: 'The browser sends the HTTP request to the server', verdict: 'wrong',
          feedback: 'Not yet. The browser only has a name like api.mysite.com, which is not an address. It needs an IP first.',
        },
        {
          id: 'db', label: 'The server queries the database', verdict: 'wrong',
          feedback: 'That happens later, and only after a request has reached the server.',
        },
      ],
      underTheHood: [
        'Two kinds of clients hit your server: web apps (server-side code for logic, HTML/JS for presentation) and mobile apps.',
        'Both usually speak HTTP, and JSON is the common response format because it is simple and light. Example: GET /users/12 returns user 12 as JSON.',
      ],
      llmPrompt:
        'Build a small HTTP API with GET /users/:id that returns JSON. It will run on one server behind the DNS name api.mysite.com.',
    },
