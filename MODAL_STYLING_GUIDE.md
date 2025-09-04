# Modal Styling Guide

## Overview

This guide documents the comprehensive modal styling system implemented to address contrast issues and create a cohesive, user-friendly design across both light and dark themes.

## Design Philosophy

### Problem Solved
- **Before**: Current modals in light theme blended too much with background and card colors
- **After**: Clear, stylish, and friendly modals with purposeful color usage and high contrast

### Key Principles
1. **Monochromatic Palette**: Reduce color mixing, use purposeful accent colors
2. **High Contrast**: Ensure excellent readability in all conditions
3. **Tactile Depth**: Neumorphism for light theme, glassmorphism for dark theme
4. **Consistent Typography**: Unified font system across all modals

## Font System

### Typography Classes
```css
/* Headings - Archivo Black */
.font-heading {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 900;
  color: var(--text-primary);
}

/* Numbers - Archivo */
.font-numbers {
  font-family: 'Archivo', sans-serif;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--text-primary);
}

/* Titles - Archivo */
.font-titles {
  font-family: 'Archivo', sans-serif;
  font-weight: 600;
  color: var(--text-primary);
}

/* Descriptions - Playfair Display */
.font-description {
  font-family: 'Playfair Display', serif;
  color: var(--text-secondary);
  line-height: 1.6;
}
```

## Theme System

### Light Theme (Neumorphism)
- **Background**: Cream (#FDF6E3)
- **Modal Surface**: Slightly darker cream (#F2E9D9) with soft extruded shadows
- **Text**: Black (#000000) for high contrast
- **Accents**: Olive Green (#556B2F) for highlights and CTAs
- **Shadows**: Subtle inner/outer shadows for tactile feel

### Dark Theme (Glassmorphism)
- **Background**: Deep Green (#3D5720)
- **Modal Surface**: Semi-transparent frosted glass (white overlay at ~10-15% opacity)
- **Text**: Cream (#FDF6E3) for readability
- **Accents**: Lighter olive tints (#6C8A3A) for buttons and highlights
- **Effects**: Blur effects and subtle transparency

## CSS Variables

### Light Theme Variables
```css
:root {
  /* Background Colors */
  --background: #FDF6E3; /* Cream */
  --background-secondary: #F2E9D9; /* Slightly darker cream */
  
  /* Surface Colors */
  --surface: #F2E9D9; /* Modal surface */
  --surface-elevated: #fafafa;
  --surface-pressed: #f0f0f0;
  
  /* Text Colors */
  --text-primary: #000000; /* Black for high contrast */
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  
  /* Accent Colors */
  --accent: #556B2F; /* Olive Green */
  --accent-light: #6C8A3A;
  
  /* Modal Specific */
  --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --modal-backdrop: rgba(0, 0, 0, 0.4);
  
  /* Neumorphic Shadows */
  --neumorphic-light: 8px 8px 16px rgba(255, 255, 255, 0.7), -8px -8px 16px rgba(0, 0, 0, 0.1);
  --neumorphic-inset: inset 8px 8px 16px rgba(0, 0, 0, 0.1), inset -8px -8px 16px rgba(255, 255, 255, 0.7);
}
```

### Dark Theme Variables
```css
[data-theme="dark"] {
  /* Background Colors */
  --background: #3D5720; /* Deep Green */
  --background-secondary: #2d3f1a;
  
  /* Surface Colors */
  --surface: rgba(255, 255, 255, 0.1); /* Semi-transparent frosted glass */
  --surface-elevated: rgba(255, 255, 255, 0.15);
  --surface-pressed: rgba(255, 255, 255, 0.05);
  
  /* Text Colors */
  --text-primary: #FDF6E3; /* Cream for readability */
  --text-secondary: #d1d5db;
  --text-tertiary: #9ca3af;
  
  /* Accent Colors */
  --accent: #6C8A3A; /* Lighter olive tints */
  --accent-light: #7f8f55;
  
  /* Modal Specific */
  --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  --modal-backdrop: rgba(0, 0, 0, 0.6);
  
  /* Glassmorphism Effects */
  --neumorphic-light: 0 8px 32px rgba(0, 0, 0, 0.3);
  --neumorphic-inset: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

## Modal Components

### Base Modal Structure
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  size="md" // sm, md, lg, xl
  className="custom-class"
>
  {/* Modal content */}
</Modal>
```

### Modal CSS Classes
```css
/* Backdrop */
.modal-backdrop {
  background: var(--modal-backdrop);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Container */
.modal-container {
  background: var(--surface);
  border-radius: 1.5rem;
  box-shadow: var(--modal-shadow);
  border: 1px solid var(--border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

/* Header */
.modal-header {
  border-bottom: 1px solid var(--border);
  padding: 1.5rem;
}

.modal-title {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 900;
  font-size: 1.25rem;
  color: var(--text-primary);
  margin: 0;
}

/* Content */
.modal-content {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

/* Close Button */
.modal-close-button {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.modal-close-button:hover {
  background: var(--surface-pressed);
  color: var(--text-primary);
}
```

### Form Elements
```css
/* Input Fields */
.modal-input {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  font-family: 'Archivo', sans-serif;
  transition: all 0.2s ease;
}

.modal-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(85, 107, 47, 0.1);
}

/* Primary Button */
.modal-button-primary {
  background: var(--accent);
  color: var(--text-inverse);
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1.5rem;
  font-family: 'Archivo', sans-serif;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
}

.modal-button-primary:hover {
  background: var(--accent-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Secondary Button */
.modal-button-secondary {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 0.75rem 1.5rem;
  font-family: 'Archivo', sans-serif;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.modal-button-secondary:hover {
  background: var(--surface-elevated);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
```

## Theme Context Usage

### ThemeProvider Setup
```tsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* Your app components */}
    </ThemeProvider>
  );
}
```

### Using Theme in Components
```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>
        Switch to {theme === 'light' ? 'dark' : 'light'} theme
      </button>
    </div>
  );
}
```

## Implementation Examples

### Updated Modal Component
The `Modal.tsx` component has been updated to use the new styling system:

```tsx
export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '' 
}) => {
  // ... component logic

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 modal-backdrop" onClick={onClose} />
      <div className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden modal-container animate-scale-in ${className}`}>
        <div className="modal-header">
          <div className="flex items-center justify-between">
            <h2 className="modal-title">{title}</h2>
            <button onClick={onClose} className="modal-close-button">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};
```

### Form Components
Form components like `MockTransactionForm` and `AccountBudgetForm` have been updated to use the new modal styling classes:

```tsx
// Input fields
<input
  className="modal-input w-full"
  placeholder="Enter value"
/>

// Buttons
<button className="modal-button-primary">Submit</button>
<button className="modal-button-secondary">Cancel</button>
```

## Key Features

### 1. **Subtle Shadows**
- Light theme: Neumorphic shadows for tactile feel
- Dark theme: Glassmorphism with blur effects

### 2. **Soft UI Feel**
- Rounded corners (1.5rem for modals, 0.75rem for inputs)
- Smooth transitions (0.2s-0.3s ease)
- Hover effects with subtle transforms

### 3. **Monochromatic Palette**
- Controlled use of olive green accents
- High contrast text colors
- Minimal color mixing

### 4. **Consistent Typography**
- Archivo Black for headings
- Archivo for numbers and titles
- Playfair Display for descriptions
- Proper font weights and spacing

### 5. **Responsive Design**
- Mobile-first approach
- Flexible sizing (sm, md, lg, xl)
- Proper touch targets (44px minimum)

## Browser Support

- **Backdrop Filter**: Modern browsers with fallbacks
- **CSS Variables**: All modern browsers
- **Flexbox**: Universal support
- **Transitions**: Universal support

## Performance Considerations

- **CSS Variables**: Efficient theme switching
- **Hardware Acceleration**: Transform and opacity animations
- **Minimal Repaints**: Strategic use of transforms
- **Lazy Loading**: Modal content loaded on demand

## Accessibility

- **High Contrast**: WCAG AA compliant
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels
- **Focus Management**: Clear focus indicators
- **Reduced Motion**: Respects user preferences

## Migration Guide

### For Existing Modals
1. Replace custom styling with modal classes
2. Update form inputs to use `modal-input` class
3. Replace buttons with `modal-button-primary/secondary` classes
4. Ensure proper theme context usage

### For New Modals
1. Use the updated `Modal` component
2. Apply appropriate size prop
3. Use modal styling classes for form elements
4. Test in both light and dark themes

## Best Practices

1. **Consistent Sizing**: Use appropriate size props (sm, md, lg, xl)
2. **Proper Contrast**: Always test in both themes
3. **Form Validation**: Use consistent error styling
4. **Loading States**: Provide clear feedback
5. **Accessibility**: Include proper labels and ARIA attributes
6. **Performance**: Minimize re-renders and use efficient animations

This modal styling system provides a solid foundation for creating consistent, accessible, and visually appealing modals across the entire application.
