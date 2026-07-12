
## 15. Milestone 5: Economy & Guilds - Task 3: Marketplace UI and Trading

**Mechanics:**
- The world economy is driven by a Marketplace where players can buy and sell items for Gold.
- Interacting with specific Merchant NPCs (or a global market hotkey) opens the Marketplace.
- **Buying:** Players can spend Gold to purchase items (weapons, armor, seeds).
- **Selling:** Players can sell items from their inventory to gain Gold.

**Data Model:**
- Create `useMarketStore.ts` to manage market state (`isOpen`, `marketItems`, `openMarket()`, `closeMarket()`).
- Implement `buyItem(itemId, price)` and `sellItem(itemId, price, quantity)`.

**UI & Visuals:**
- **Marketplace UI:** A React modal (`MarketplaceUI.tsx`) featuring a split-pane layout:
  - Left Pane: Items available for purchase (with icons and prices).
  - Right Pane: Player's current inventory available to sell.
- Use the existing `premium-glass` styles.
- Add an 'M' keybind or a button in the HUD/Dialogue to open the market.
