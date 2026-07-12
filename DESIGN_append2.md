
## 13. Milestone 5: Player Housing & Life Skills - Task 1: Farming & Agriculture

**Mechanics:**
- Players can plant crops on specific "dirt" tiles in the world or in their personal housing instance.
- **Planting:** Selecting a 'seed' item from the inventory/hotbar and clicking a valid dirt tile plants the seed.
- **Growth Cycle:** Crops grow over real-time (accelerated for testing) through 3 stages: `seed` -> `growing` -> `mature`.
- **Harvesting:** Clicking on a `mature` crop harvests it, yielding crop items and occasionally seeds, then returning the plot to `empty`.

**Data Model:**
- Create `useFarmStore` to track farm plots.
- `FarmPlot` interface: `{ id, x, y, seedItemId, plantedAt, state: 'empty' | 'seed' | 'growing' | 'mature' }`.

**UI & Visuals:**
- **Tile Highlight:** Hovering over a valid dirt tile with a seed selected shows a green placement highlight.
- **Crop Sprites:** The `WorldScene` renders crop sprites on top of the soil, updating their visual frame based on the crop's state (seed sprout, growing plant, fully grown).
