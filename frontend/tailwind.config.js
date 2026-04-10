/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0f1117',
        sidebar:  '#161b27',
        card:     '#131a28',
        surface:  '#1a2235',
        border:   '#2a3045',
        border2:  '#1e2535',
        green:    '#3dd68c',
        amber:    '#f0b840',
        blue:     '#4f9eff',
        purple:   '#b06af0',
        muted:    '#6b7a99',
        dim:      '#4f6080',
        faint:    '#3d5070',
        text:     '#e0e6f0',
        textSub:  '#c8d8f0',
        textDim:  '#8a9abf',
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
        mono: ['monospace'],
      },
    },
  },
  plugins: [],
}
