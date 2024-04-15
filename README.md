# gribi-playground
A playground environment for hands-on learning about Gribi

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

### Run the dev setup 
```
cd playground/game
pnpm install
pnpm run dev
```

