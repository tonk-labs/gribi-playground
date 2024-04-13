# gribi-playground
A little playground to try out the Gribi interface

Setup
---

### Fetch the Gribi repository and build 

```
cd gribi
git submodule update --init
node scripts/build.js
```

### Install and build module
```
cd playground/module/circuits
pnpm i & pnpm build
cd playground/module/client
pnpm i & pnpm build
cd playground/module/contracts
pnpm i & pnpm build
```

### Install and build MUD game
```
cd playground/game/client
pnpm i
cd playground/game/contracts
pnpm i
```

### Run the dev setup 
```
cd playground/game
pnpm install
pnpm run dev
```

