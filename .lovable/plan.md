

## Plan: Replace Village Grid with Searchable Dropdown + "Add Your Village"

### What changes
Replace the current grid of village buttons in `SetupProfile.tsx` with a searchable dropdown (Popover + Command pattern from shadcn/ui) that:
- Shows a search input to filter villages by name
- Lists all approved villages from the database
- Shows an "Add Your Village" option at the bottom when no match is found (or always)
- Clicking "Add Your Village" reveals an inline input to type and submit a new village name (same logic as now, instant approval)
- Selected village displays in the trigger button

### File changes

**`src/pages/SetupProfile.tsx`**
- Remove the grid-based village buttons
- Import `Popover`, `PopoverTrigger`, `PopoverContent` from `@/components/ui/popover`
- Import `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem` from `@/components/ui/command`
- Import `Check`, `ChevronsUpDown`, `Plus` icons
- Build a combobox-style dropdown:
  - Trigger button shows selected village or placeholder "Select your village..."
  - Popover content uses Command with search input
  - CommandGroup lists all fetched villages, filterable by typing
  - CommandEmpty shows "No village found"
  - A separate CommandItem at the bottom: "+ Add Your Village" which toggles the custom input
- Keep the existing custom village input/submit flow below the dropdown when "Add Your Village" is clicked
- All existing logic (fetch, insert, submit profile) stays the same

### No other files change
The dropdown uses existing shadcn/ui components already in the project.

