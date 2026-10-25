# Animal Messenger

A messaging app where your pets carry the messages. Hatch animals, feed them and play with them, then send them off to friends. Fast animals deliver in minutes, a tortoise takes about a day, and clumsy animals sometimes drop the message or get lost and need to be found.

This is the first playable prototype. It runs entirely on the phone with demo friends who write back, so the game can be tried before there's a server.

## Try it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone (App Store or Google Play), or press `w` to open it in your browser.

## What's in it

- **Animals**: you start with Pip the pigeon, Shelly the tortoise, Waddles the duckling, Biscuit the dog and Mittens the cat. Each has food, energy and happiness meters that change over real time.
- **Species**: 10 so far. Common: pigeon (10 min), dog (30 min), cat and duckling (2 h), tortoise (about a day). Uncommon: armadillo (4 h, rolls up and drops things) and axolotl (6 h, very careful). Rare: fox (15 min), snow leopard (20 min) and giraffe (45 min).
- **Name, colour and personality**: rename and recolour any animal, and give it up to two personality traits (speedy, sleepy, careful, clumsy, brave, curious, foodie, playful, cheerful). Traits change how fast it travels, how often it has mishaps and how its meters move.
- **Care**: feed each animal (its favourite food fills more) and play fetch. Care builds bond, and a well-bonded animal is faster and less clumsy.
- **Sending**: write a message, pick a friend and choose who carries it. You see the arrival time and mishap risk before sending.
- **Mishaps**: a clumsy animal can drop the message (search the path or write a new one) or get lost (search the bushes, then send it on or give it a new message). A lost animal nobody looks for comes home after a day.
- **Eggs**: earn one every 3 deliveries and for every rescue. Name it, pick a colour and traits (or leave traits as a surprise) and hatch it. Eggs are 65% common, 25% uncommon and 10% rare.
- **Testing tools**: on the Animals tab, skip ahead an hour or a day to see slow deliveries without waiting.

Axolotls and armadillos don't have emojis yet, so a lizard and a hedgehog stand in until there's real artwork.

## Code layout

| Path | What it holds |
| --- | --- |
| `src/game/` | All game rules as plain TypeScript (species, traits, timing, mishaps, eggs). No React, so it can move to a server later. |
| `src/state/` | Keeps the game running every second and saves it on the device. |
| `src/app/` | The screens ([Expo Router](https://docs.expo.dev/router/introduction/): each file is a screen). |
| `src/ui/` | Shared colours and components. |

```bash
npm test           # game rule tests
npm run typecheck  # TypeScript check
```

## Next steps

Real accounts and messaging between real people need a backend. The plan is Supabase for sign-in, the database, scheduled delivery and push notifications, with the rules in `src/game/` running on the server.
