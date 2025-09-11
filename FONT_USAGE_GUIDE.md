# Self-Hosted Fonts Usage Guide

This project now uses self-hosted fonts instead of Google Fonts for better offline support and CSP compliance.

## Font Files

The following font files are located in `/public/fonts/`:

- `Archivo-VariableFont.ttf` - Archivo variable font (weights 100-900)
- `Archivo-Italic-VariableFont.ttf` - Archivo italic variable font (weights 100-900)
- `ArchivoBlack-Regular.ttf` - Archivo Black regular (weight 400)
- `Playfair-VariableFont.ttf` - Playfair Display variable font (weights 100-900)
- `Playfair-Italic-VariableFont.ttf` - Playfair Display italic variable font (weights 100-900)

## Tailwind CSS Classes

Use these Tailwind classes to apply the fonts:

### Font Families
- `font-heading` - Archivo Black (for main headings)
- `font-number` - Archivo (for numbers and data)
- `font-title` - Archivo (for titles and labels)
- `font-description` - Playfair Display (for descriptions and body text)

### Font Weights
- `font-light` - 300
- `font-normal` - 400
- `font-medium` - 500
- `font-semibold` - 600
- `font-bold` - 700

## Usage Examples

```jsx
// Main heading
<h1 className="text-4xl font-heading text-gray-800">
  Financial Dashboard
</h1>

// Numbers and data
<div className="text-2xl font-number text-green-600 font-bold">
  $12,345.67
</div>

// Titles and labels
<h2 className="text-xl font-title text-gray-700">
  Account Summary
</h2>

// Descriptions and body text
<p className="text-base font-description text-gray-600 leading-relaxed">
  This is a beautiful description using Playfair Display.
</p>
```

## CSS Variables

The fonts are also available as CSS variables:

```css
:root {
  --font-heading: 'Archivo Black', sans-serif;
  --font-numbers: 'Archivo', sans-serif;
  --font-titles: 'Archivo', sans-serif;
  --font-description: 'Playfair Display', serif;
}
```

## Benefits

1. **Offline Support** - Fonts work without internet connection
2. **CSP Compliance** - No external font requests
3. **Performance** - Faster loading, no external requests
4. **Privacy** - No data sent to Google
5. **Reliability** - Fonts always available

## Font Showcase Component

Check out `src/components/common/FontShowcase.tsx` for a complete demonstration of all font usage patterns.

## Mobile Optimization

The fonts are optimized for mobile devices with:
- Proper font-display: swap
- System font fallbacks
- Mobile-specific font rendering optimizations
- Touch-friendly font sizes
