# Font Specifications

## Exact Font Hierarchy

### 1. Headings Font
- **FONT NAME:** Archivo Black, Google Font
- **CSS Class:** `font-heading`
- **Usage:** Main headings, important titles
- **Example:** Page titles, section headers

### 2. Numbers Font
- **FONT NAME:** Archivo, Google Font
- **CSS Class:** `font-numbers`
- **Usage:** All numerical values, amounts, counts
- **Example:** "2345678", currency amounts, percentages

### 3. Titles Font
- **FONT NAME:** Archivo, Google Font
- **CSS Class:** `font-titles`
- **Usage:** Section titles, labels, UI elements
- **Example:** "Apple", button labels, form labels

### 4. Description Font
- **FONT NAME:** Playfair Display, Google Font
- **CSS Class:** `font-description`
- **Usage:** Descriptive text, body content, explanations
- **Example:** "Apple", help text, descriptions

## CSS Variables

```css
--font-heading: 'Archivo Black', [fallbacks...];
--font-numbers: 'Archivo', [fallbacks...];
--font-titles: 'Archivo', [fallbacks...];
--font-description: 'Playfair Display', [fallbacks...];
```

## Tailwind Classes

```css
font-heading    /* Archivo Black */
font-numbers    /* Archivo */
font-titles     /* Archivo */
font-description /* Playfair Display */
```

## Usage in Components

```tsx
// Headings
<h1 className="font-heading">Main Title</h1>

// Numbers
<span className="font-numbers">$1,234.56</span>

// Titles
<h3 className="font-titles">Section Title</h3>

// Descriptions
<p className="font-description">This is descriptive text</p>
```

## Mobile Optimization

- All fonts have robust fallbacks for mobile devices
- Font loading is optimized with `font-display: swap`
- System fonts are used as fallbacks when Google Fonts fail
- Mobile-specific font rendering optimizations applied

## Font Loading

- Fonts are preloaded for better performance
- Graceful fallback when fonts fail to load
- Loading states handled automatically
- Mobile-optimized font rendering
