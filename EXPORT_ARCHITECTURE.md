# Export Functionality Architecture

## Concept

The DT Boilerplate plugin creates a **Theme** from a **Preset** that serves as a single source of truth for:

1. Figma Variables
2. Visual Documentation  
3. Code Export (CSS, JSON, Framework-specific)

## Architecture Flow

```
Preset (Official Framework Defaults)
    ↓
Theme Generation (User Customizations)
    ↓
Generated Theme (Single Source of Truth)
    ├── Figma Variables
    ├── Visual Documentation
    └── Export
        ├── CSS Custom Properties
        ├── JSON
        ├── DTCG-compatible JSON
        └── Framework-specific formats
            ├── Bootstrap
            ├── Tailwind CSS
            ├── Bulma
            └── StartToken (neutral)
```

## Data Structure

### Theme State
```typescript
interface ThemeState {
  presetId: string;
  presetName: string;
  customizations: Record<string, string>; // User-edited values
  generatedScale: Record<string, string>; // Calculated typography scale
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
  };
}
```

### Export Formats
```typescript
type ExportFormat = 'css' | 'json' | 'dtcg' | 'bootstrap' | 'tailwind' | 'bulma' | 'starttoken';

interface ExportOptions {
  format: ExportFormat;
  includeVariableTypes?: ('colors' | 'typography' | 'layout')[];
  variableNaming?: 'camelCase' | 'kebab-case' | 'PascalCase';
  cssPrefix?: string; // For CSS variables
}
```

## Export Implementation Plan

### Phase 1: Core Export Functionality
- [ ] Create export utility functions
- [ ] Implement CSS Custom Properties export
- [ ] Implement JSON export
- [ ] Implement DTCG-compatible JSON export

### Phase 2: Framework-Specific Exports
- [ ] Bootstrap-compatible CSS variables
- [ ] Tailwind CSS theme configuration
- [ ] Bulma-compatible CSS variables
- [ ] StartToken neutral format

### Phase 3: UI Integration
- [ ] Add export button to Theme generation completion
- [ ] Create export format selector modal
- [ ] Add export preview
- [ ] Implement copy to clipboard
- [ ] Implement download functionality

### Phase 4: Advanced Features
- [ ] Export presets/configurations
- [ ] Batch export multiple formats
- [ ] Custom variable naming strategies
- [ ] Export validation and error handling

## Export Format Specifications

### CSS Custom Properties
```css
:root {
  --color-primary: #05061a;
  --color-primary-900: #090c2e;
  --typography-font-family-sans: 'DM Sans';
  --typography-base-size: 16px;
  --layout-grid-columns: 12;
}
```

### JSON
```json
{
  "colors": {
    "primary": "#05061a",
    "primary-900": "#090c2e"
  },
  "typography": {
    "fontFamily": {
      "sans": "DM Sans"
    },
    "baseSize": "16px"
  },
  "layout": {
    "grid": {
      "columns": 12
    }
  }
}
```

### DTCG-compatible JSON
```json
{
  "$schema": "https://tr.designtech.org/tm/dtcg/schema.json",
  "colors": {
    "primary": {
      "$type": "color",
      "$value": "#05061a"
    }
  }
}
```

### Bootstrap Format
```scss
$primary: #05061a;
$primary-900: #090c2e;
$font-family-sans: 'DM Sans';
$font-size-base: 16px;
$grid-columns: 12;
```

### Tailwind CSS Format
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#05061a',
        'primary-900': '#090c2e',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      fontSize: {
        base: '16px',
      },
    }
  }
}
```

## Implementation Considerations

1. **Single Source of Truth**: All exports derive from the same Theme state
2. **Format Validation**: Ensure exports are valid for their target formats
3. **Naming Conventions**: Support different variable naming strategies
4. **Performance**: Generate exports on-demand, not pre-compute
5. **Extensibility**: Easy to add new export formats
6. **Framework Detection**: Auto-select appropriate format based on preset

## File Structure

```
src/
├── export/
│   ├── formatters/
│   │   ├── css.ts
│   │   ├── json.ts
│   │   ├── dtcg.ts
│   │   ├── bootstrap.ts
│   │   ├── tailwind.ts
│   │   ├── bulma.ts
│   │   └── starttoken.ts
│   ├── validators/
│   │   ├── css-validator.ts
│   │   ├── json-validator.ts
│   │   └── framework-validator.ts
│   ├── types.ts
│   └── index.ts
└── app/
    └── ExportModal.tsx
```

## Next Steps

1. Implement core export functionality (CSS, JSON, DTCG)
2. Add export UI to Theme generation flow
3. Implement framework-specific formatters
4. Add export validation and testing
5. Document export formats and usage